import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { IAccessLog, ILifecycleRule } from "../types";

export interface IS3Bucket extends IAccessLog {
  bucketName?: string;
  lifecycleRules?: ILifecycleRule[];
  accessControl?: cdk.aws_s3.BucketAccessControl;
  allowDeleteBucketAndObjects?: boolean;
  s3ServerAccessLogS3Bucket?: S3Bucket;
}

export class S3Bucket extends Construct {
  readonly bucket: cdk.aws_s3.Bucket;

  constructor(scope: Construct, id: string, props?: IS3Bucket) {
    super(scope, id);

    const {
      bucketName,
      lifecycleRules,
      accessControl,
      allowDeleteBucketAndObjects,
      s3ServerAccessLogS3Bucket,
      logFilePrefix,
    } = props || {};

    this.bucket = new cdk.aws_s3.Bucket(this, "Default", {
      bucketName,
      encryption: cdk.aws_s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: new cdk.aws_s3.BlockPublicAccess({
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }),
      enforceSSL: true,
      versioned: false,
      removalPolicy: allowDeleteBucketAndObjects
        ? cdk.RemovalPolicy.DESTROY
        : undefined,
      autoDeleteObjects: allowDeleteBucketAndObjects ?? false,
      accessControl: accessControl,
      serverAccessLogsBucket: s3ServerAccessLogS3Bucket?.bucket,
      serverAccessLogsPrefix:
        s3ServerAccessLogS3Bucket?.bucket && logFilePrefix
          ? `${logFilePrefix}/`
          : undefined,
    });

    this.addLifecycleRules(lifecycleRules);

    if (s3ServerAccessLogS3Bucket) {
      this.configureAccessLogs(s3ServerAccessLogS3Bucket)
    }
  }

  private addLifecycleRules(lifecycleRules?: ILifecycleRule[]): void {
    lifecycleRules?.forEach((rule) => {
      const ruleName = rule.ruleNameSuffix
        ? `Delete-After-${rule.expirationDays}Days-${rule.ruleNameSuffix}`
        : `Delete-After-${rule.expirationDays}Days`;

      this.bucket.addLifecycleRule({
        enabled: true,
        id: ruleName,
        expiration: cdk.Duration.days(rule.expirationDays),
        prefix: rule.prefix,
        expiredObjectDeleteMarker: false,
        abortIncompleteMultipartUploadAfter: rule.abortIncompleteMultipartUploadAfter,
      });
    });
  }

  private configureAccessLogs(s3ServerAccessLogS3Bucket: S3Bucket) {
    const cfnBucket = this.bucket.node.defaultChild as cdk.aws_s3.CfnBucket;
    cfnBucket.addPropertyOverride(
      "LoggingConfiguration.TargetObjectKeyFormat.PartitionedPrefix.PartitionDateSource",
      "EventTime"
    )
  }
}
