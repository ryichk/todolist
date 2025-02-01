import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { IAccessLog, ICloudFront, ILogAnalytics } from "../types";
import { S3Bucket } from "./s3-bucket";
import { CertificateStack } from "../certificate-stack";
import { Route53Stack } from "../route53-stack";
import * as path from "path";

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
      enableS3ListBucket,
      enableLogAnalytics
    } = props;

    const webACL = new cdk.aws_wafv2.CfnWebACL(this, "TodoListCloudFrontWebACL", {
      defaultAction: { allow: {} },
      scope: "CLOUDFRONT",
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "CloudFrontSecurity",
        sampledRequestsEnabled: true,
      },
      rules: [
        {
          name: "AWS-AWSManagedRulesCommonRuleSet",
          priority: 0,
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesCommonRuleSet",
            },
          },
          overrideAction: {
            none: {}
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "AWSManagedRulesCommonRuleSet",
            sampledRequestsEnabled: true,
          },
        },
        {
          name: "GeoRestriction",
          priority: 1,
          statement: {
            geoMatchStatement: {
              countryCodes: ["JP"],
            },
          },
          action: {
            block: {}
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "GeoRestriction",
            sampledRequestsEnabled: true,
          }
        }
      ]
    });

    new cdk.aws_wafv2.CfnWebACLAssociation(this, "WebACLAssociation", {
      webAclArn: webACL.attrArn,
      resourceArn: `arn:aws:cloudfront::${cdk.Stack.of(this).account}:distribution/${this.distribution.distributionId}`
    })

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

    if (
      cloudFrontAccessLogBucket &&
      enableLogAnalytics?.find((enableLogAnalytics) => enableLogAnalytics === "cloudFrontAccessLog")
    ) {
      let targetKeyPrefix;
      if (logFilePrefix) {
        targetKeyPrefix = `${logFilePrefix}/partitioned/${cdk.Stack.of(this).account}/${this.distribution.distributionId}/`;
      } else {
        targetKeyPrefix = `partitioned/${cdk.Stack.of(this).account}/${this.distribution.distributionId}/`;
      }

      this.setupCloudFrontAccessLogProcessing(targetKeyPrefix, cloudFrontAccessLogBucket)
    }

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

  private setupCloudFrontAccessLogProcessing(targetKeyPrefix: string, cloudFrontAccessLogBucket: S3Bucket): void {
    const moveCloudFrontAccessLogLambda = new cdk.aws_lambda_nodejs.NodejsFunction(
      this, "MoveCloudFrontAccessLogLambda", {
        entry: path.join(__dirname, "../src/lambda/move-cloudfront-access-log/index.ts"),
        runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
        bundling: {
          minify: true,
          tsconfig: path.join(__dirname, "../src/lambda/tsconfig.json"),
          format: cdk.aws_lambda_nodejs.OutputFormat.ESM,
        },
        architecture: cdk.aws_lambda.Architecture.ARM_64,
        environment: {
          TARGET_KEY_PREFIX: targetKeyPrefix,
          HIVE_COMPATIBLE_PARTITIONS: "false",
        },
      }
    );
    cloudFrontAccessLogBucket.bucket.enableEventBridgeNotification();
    cloudFrontAccessLogBucket.bucket.grantReadWrite(moveCloudFrontAccessLogLambda);
    cloudFrontAccessLogBucket.bucket.grantDelete(moveCloudFrontAccessLogLambda);
    new cdk.aws_events.Rule(this, "CloudFrontAccessLogCreatedEventRule", {
      eventPattern: {
        source: ["aws.s3"],
        resources: [cloudFrontAccessLogBucket.bucket.bucketArn],
        detailType: ["Object Created"],
        detail: {
          object: {
            key: [
              {
                "anything-but": {
                  prefix: targetKeyPrefix,
                },
              },
            ],
          },
        },
      },
      targets: [
        new cdk.aws_events_targets.LambdaFunction(moveCloudFrontAccessLogLambda)
      ],
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
