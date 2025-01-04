import * as cdk from "aws-cdk-lib";
import { Route53Stack } from "./route53-stack";
import { CertificateStack } from "./certificate-stack";

export interface IFrontendStack {
  route53Stack?: Route53Stack;
  certificateStack?: CertificateStack;
  cloudFront?: ICloudFront;
  allowDeleteBucketAndObjects?: boolean;
  s3ServerAccessLog?: IAccessLog;
  cloudFrontAccessLog?: IAccessLog;
  logAnalytics?: ILogAnalytics;
}

export interface ICertificateStack {
  certificateArn?: string;
  certificateDomainName?: string;
}

export interface StackProperties {
  env?: cdk.Environment;
}

export interface IHostedZone {
  zoneName?: string;
  hostedZoneId?: string;
}

export interface ICloudFront {
  domainName?: string;
  contentsPath?: string;
  enableDirectoryIndex?: "cf2" | "lambdaEdge" | false;
  enableS3ListBucket?: boolean;
}

export interface ILifecycleRule {
  prefix?: string;
  expirationDays: number;
  ruleNameSuffix?: string;
  abortIncompleteMultipartUploadAfter?: cdk.Duration;
}

export interface IAccessLog {
  enableAccessLog?: boolean;
  logFilePrefix?: string;
  lifecycleRules?: ILifecycleRule[];
}

export type LogType = "s3ServerAccessLog" | "cloudFrontAccessLog";

export interface ILogAnalytics {
  createWorkGroup?: boolean;
  enableLogAnalytics?: LogType[];
}
