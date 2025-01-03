import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { IAccessLog, ICloudFront, ILogAnalytics } from "../types";
import { S3Bucket } from "./s3-bucket";
import { CertificateStack } from "../certificate-stack";
import { Route53Stack } from "../route53-stack";

export interface ICloudFrontProps extends ICloudFront, IAccessLog, ILogAnalytics {
  frontendBucket: S3Bucket;
  cloudFrontAccessLogBucket?: S3Bucket;
  route53Stack?: Route53Stack;
  certificateStack?: CertificateStack;
}

export class CloudFront extends Construct {
  readonly distribution: cdk.aws_cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: ICloudFrontProps) {
    super(scope, id)

    const {
      frontendBucket,
      route53Stack,
      certificateStack,
      cloudFrontAccessLogBucket,
      domainName,
      logFilePrefix,
      contentsPath,
      enableS3ListBucket
    } = props;

    // frontendBucket.bucket.addCorsRule({
    //   allowedMethods: [
    //     cdk.aws_s3.HttpMethods.GET,
    //     cdk.aws_s3.HttpMethods.HEAD,
    //     cdk.aws_s3.HttpMethods.POST,
    //   ],
    //   allowedOrigins: ["https://todolist.ryichk.com"],
    //   allowedHeaders: ["Content-Type", "Authorization", "X-Amz-Date", "X-Amz-Security-Token"],
    // });

    // const cachePolicy = new cdk.aws_cloudfront.CachePolicy(this, "TodoListCachePolicy", {
    //   cachePolicyName: "TodoListCachePolicy",
    //   defaultTtl: cdk.Duration.minutes(10),
    //   minTtl: cdk.Duration.minutes(1),
    //   maxTtl: cdk.Duration.days(1),
    //   headerBehavior: cdk.aws_cloudfront.CacheHeaderBehavior.allowList(
    //     "Origin",
    //     "Access-Control-Request-Headers",
    //     "Access-Control-Request-Method"
    //   ),
    // });

    this.distribution = new cdk.aws_cloudfront.Distribution(this, "Default", {
      defaultRootObject: "index.html",
      errorResponses: [
        {
          ttl: cdk.Duration.minutes(1),
          httpStatus: 403,
          responseHttpStatus: 403,
          responsePagePath: "/index.html",
        },
        {
          ttl: cdk.Duration.minutes(1),
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: "/index.html",
        },
      ],
      defaultBehavior: {
        origin: cdk.aws_cloudfront_origins.S3BucketOrigin.withOriginAccessControl(
          frontendBucket.bucket
        ),
        allowedMethods: cdk.aws_cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: cdk.aws_cloudfront.CachePolicy.CACHING_OPTIMIZED,
        viewerProtocolPolicy: cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        responseHeadersPolicy: cdk.aws_cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
      },
      httpVersion: cdk.aws_cloudfront.HttpVersion.HTTP2_AND_3,
      priceClass: cdk.aws_cloudfront.PriceClass.PRICE_CLASS_200,
      domainNames: domainName ? [domainName] : undefined,
      certificate: domainName ? certificateStack?.certificate : undefined,
      logBucket: cloudFrontAccessLogBucket?.bucket,
      logFilePrefix,
    });

    this.addOriginAccessControl(frontendBucket.bucket);

    this.addBucketPolicy(frontendBucket.bucket, enableS3ListBucket);

    if (route53Stack && domainName) {
      this.addRoute53Alias(route53Stack, domainName);
    }

    // if (
    //   props.cloudFrontAccessLogBucket &&
    //   props.enableLogAnalytics?.find((enableLogAnalytics) => enableLogAnalytics === "cloudFrontAccessLog")
    // ) {
    //   const targetKeyPrefix = props.logFilePrefix
    //     ? `${props.logFilePrefix}/partitioned/${cdk.Stack.of(this).account}/${
    //       this.distribution.distributionId
    //     }/`
    //     : `partitioned/${cdk.Stack.of(this).account}/${
    //       this.distribution.distributionId
    //     }/`;
    // }

    if (contentsPath) {
      this.deployContents(frontendBucket.bucket, contentsPath);
    }
  }

  private addOriginAccessControl(bucket: cdk.aws_s3.IBucket): void {
    const oac = new cdk.aws_cloudfront.CfnOriginAccessControl(
      this,
      "OriginAccessControl",
      {
        originAccessControlConfig: {
          name: "Origin AccessControl for Frontend Bucket",
          originAccessControlOriginType: "s3",
          signingBehavior: "always",
          signingProtocol: "sigv4",
        },
      }
    );

    const cfnDistribution = this.distribution.node.defaultChild as cdk.aws_cloudfront.CfnDistribution;
    // Set OAC
    cfnDistribution.addPropertyOverride("DistributionConfig.Origins.0.OriginAccessControlId", oac.attrId);
    // Set S3 domain name
    cfnDistribution.addPropertyOverride("DistributionConfig.Origins.0.DomainName", bucket.bucketRegionalDomainName);
    // Delete OAI
    cfnDistribution.addPropertyOverride("DistributionConfig.Origins.0.S3OriginConfig.OriginAccessIdentity", "");
  }

  private addBucketPolicy(bucket: cdk.aws_s3.IBucket, enableS3ListBucket?: boolean): void {
    bucket.addToResourcePolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: enableS3ListBucket ? ["s3:GetObject", "s3:ListBucket"] : ["s3:GetObject"],
        effect: cdk.aws_iam.Effect.ALLOW,
        principals: [new cdk.aws_iam.ServicePrincipal("cloudfront.amazonaws.com")],
        resources: enableS3ListBucket ? [`${bucket.bucketArn}/*`, bucket.bucketArn] : [`${bucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            "AWS:SourceArn": `arn:aws:cloudfront::${cdk.Stack.of(this).account}:distribution/${this.distribution.distributionId}`,
          },
        },
      })
    );
  }

  private addRoute53Alias(route53Stack: Route53Stack, domainName: string): void {
    new cdk.aws_route53.ARecord(this, `AliasRecord`, {
      recordName: domainName,
      zone: route53Stack.publicHostedZone,
      target: cdk.aws_route53.RecordTarget.fromAlias(
        new cdk.aws_route53_targets.CloudFrontTarget(this.distribution)
      ),
    });
  }

  private deployContents(bucket: cdk.aws_s3.IBucket, contentsPath: string): void {
    new cdk.aws_s3_deployment.BucketDeployment(this, "DeployContents", {
      sources: [cdk.aws_s3_deployment.Source.asset(contentsPath)],
      destinationBucket: bucket,
      distribution: this.distribution,
      distributionPaths: ["/*"],
    });
  }
}
