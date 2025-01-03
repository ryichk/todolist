import * as cdk from "aws-cdk-lib";
import { IFrontendStack, StackProperties } from "./types";
import { Construct } from "constructs";
import { S3Bucket } from "./constructs/s3-bucket";
import { CloudFront } from "./constructs/cloudfront";
import * as path from "path";

export interface IFrontendStackProps extends cdk.StackProps, IFrontendStack {}

export class FrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: IFrontendStackProps) {
    super(scope, id, props)

    const s3ServerAccessLogBucket = props.s3ServerAccessLog?.enableAccessLog
      ? new S3Bucket(this, "TodoListS3ServerAccessLogBucket", {
          allowDeleteBucketAndObjects: props.allowDeleteBucketAndObjects,
          accessControl: cdk.aws_s3.BucketAccessControl.LOG_DELIVERY_WRITE,
          ...props.s3ServerAccessLog,
        })
      : undefined;

    const cloudFrontAccessLogBucket = props.cloudFrontAccessLog?.enableAccessLog
      ? new S3Bucket(this, "TodoListCloudFrontAccessLogBucket", {
          allowDeleteBucketAndObjects: props.allowDeleteBucketAndObjects,
          accessControl: cdk.aws_s3.BucketAccessControl.LOG_DELIVERY_WRITE,
          ...props.cloudFrontAccessLog,
        })
      : undefined;

    const frontendBucket = new S3Bucket(
      this,
      "TodoListFrontendBucket",
      {
        s3ServerAccessLogS3Bucket: s3ServerAccessLogBucket,
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
  },
};
