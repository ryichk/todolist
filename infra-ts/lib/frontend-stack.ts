import * as cdk from "aws-cdk-lib";
import { IAccessLog, IFrontendStack, ILogAnalytics, StackProperties } from "./types";
import { Construct } from "constructs";
import { S3Bucket } from "./constructs/s3-bucket";
import { CloudFront } from "./constructs/cloudfront";
import * as path from "path";
import { LogAnalytics } from "./constructs/log-analytics";

export interface IFrontendStackProps extends cdk.StackProps, IFrontendStack {}

export class FrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: IFrontendStackProps) {
    super(scope, id, props)

    const { s3ServerAccessLog, cloudFrontAccessLog, allowDeleteBucketAndObjects, logAnalytics } = props;

    let s3ServerAccessLogS3Bucket;
    if (s3ServerAccessLog?.enableAccessLog) {
      s3ServerAccessLogS3Bucket = this.createS3Bucket("TodoListS3ServerAccessLogBucket", allowDeleteBucketAndObjects, s3ServerAccessLog);
    }

    let cloudFrontAccessLogBucket;
    if (cloudFrontAccessLog?.enableAccessLog) {
      cloudFrontAccessLogBucket = this.createS3Bucket("TodoListCloudFrontAccessLogBucket", allowDeleteBucketAndObjects, cloudFrontAccessLog);
    }

    const frontendBucket = new S3Bucket(
      this,
      "TodoListFrontendBucket",
      {
        s3ServerAccessLogS3Bucket,
        allowDeleteBucketAndObjects: props.allowDeleteBucketAndObjects,
        logFilePrefix: props.s3ServerAccessLog?.logFilePrefix,
      }
    );

    const cloudFront = new CloudFront(
      this,
      "TodoListCloudFront",
      {
        frontendBucket: frontendBucket,
        cloudFrontAccessLogBucket,
        route53Stack: props.route53Stack,
        certificateStack: props.certificateStack,
        ...props.cloudFront,
        ...props.cloudFrontAccessLog,
        ...props.logAnalytics,
      }
    );

    if (logAnalytics) {
      this.createLogAnalytics(logAnalytics, frontendBucket, cloudFront, s3ServerAccessLogS3Bucket, cloudFrontAccessLogBucket, s3ServerAccessLog, cloudFrontAccessLog, allowDeleteBucketAndObjects);
    }
  }

  private createS3Bucket(bucketName: string, allowDeleteBucketAndObjects?: boolean, logConfig?: IAccessLog): S3Bucket {
    return new S3Bucket(this, bucketName, {
      allowDeleteBucketAndObjects,
      accessControl: cdk.aws_s3.BucketAccessControl.LOG_DELIVERY_WRITE,
      ...logConfig,
    })
  }

  private createLogAnalytics(logAnalytics: ILogAnalytics, frontendBucket: S3Bucket, cloudFront: CloudFront, s3ServerAccessLogS3Bucket?: S3Bucket, cloudFrontAccessLogBucket?: S3Bucket, s3ServerAccessLog?: IAccessLog, cloudFrontAccessLog?: IAccessLog, allowDeleteBucketAndObjects?: boolean): void {
    if (logAnalytics.createWorkGroup) {
      const athenaQueryOutputBucket = new S3Bucket(this, "AthenaQueryOutputBucket", {
        allowDeleteBucketAndObjects,
      });

      const logAnalyticsConstruct = new LogAnalytics(this, "TodoListLogAnalytics", {
        athenaQueryOutputBucket,
      });

      if (logAnalyticsConstruct && logAnalytics.enableLogAnalytics) {
        const database = logAnalyticsConstruct.createDatabase("AccessLogDatabase", {
          databaseName: "access_log",
        });

        if (s3ServerAccessLogS3Bucket && database) {
          logAnalyticsConstruct.createTable("S3ServerAccessLogTable", {
            databaseName: database.ref,
            logType: "s3ServerAccessLog",
            locationPlaceholder: {
              logBucketName: s3ServerAccessLogS3Bucket.bucket.bucketName,
              logSrcResourceId: frontendBucket.bucket.bucketName,
              logSrcResourceAccountId: this.account,
              logSrcResourceRegion: this.region,
              prefix: s3ServerAccessLog?.logFilePrefix,
            },
          });
        }

        if (cloudFrontAccessLogBucket && database) {
          logAnalyticsConstruct.createTable("CloudFrontAccessLogTable", {
            databaseName: database.ref,
            logType: "cloudFrontAccessLog",
            locationPlaceholder: {
              logBucketName: cloudFrontAccessLogBucket.bucket.bucketName,
              logSrcResourceId: cloudFront.distribution.distributionId,
              logSrcResourceAccountId: this.account,
              logSrcResourceRegion: this.region,
              prefix: cloudFrontAccessLog?.logFilePrefix,
            },
          });
        }
      }
    }
  }
}

export const frontendStackProperties: StackProperties & {
  props: IFrontendStack
} = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  props: {
    cloudFront: {
      domainName: "todolist.ryichk.com",
      contentsPath: path.join(__dirname, "../../client/build/client"),
      enableS3ListBucket: true,
    },
    allowDeleteBucketAndObjects: true,
    s3ServerAccessLog: {
      enableAccessLog: true,
      lifecycleRules: [{ expirationDays: 365 }],
    },
    cloudFrontAccessLog: {
      enableAccessLog: true,
      lifecycleRules: [{ expirationDays: 365 }],
    },
    logAnalytics: {
      createWorkGroup: true,
      enableLogAnalytics: ["s3ServerAccessLog", "cloudFrontAccessLog"],
    },
  },
};
