import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { ICertificateStack, StackProperties } from "./types";
import { Route53Stack } from "./route53-stack";

export interface ICertificateStackProps extends cdk.StackProps, ICertificateStack {
  route53Stack?: Route53Stack
}

export class CertificateStack extends cdk.Stack {
  readonly certificate: cdk.aws_certificatemanager.ICertificate

  constructor(scope: Construct, id: string, props: ICertificateStackProps) {
    super(scope, id, props)

    const { certificateArn, certificateDomainName, route53Stack } = props;

    if (certificateArn) {
      this.certificate = cdk.aws_certificatemanager.Certificate.fromCertificateArn(
          this,
          "Default",
          certificateArn,
        );
    } else if (certificateDomainName && route53Stack?.publicHostedZone) {
      this.certificate = new cdk.aws_certificatemanager.Certificate(
        this,
        "TodoCertificate",
        {
          domainName: certificateDomainName,
          validation: cdk.aws_certificatemanager.CertificateValidation.fromDns(
            route53Stack.publicHostedZone
          ),
        }
      );
    }
  }
}

export const certificateStackProperties: StackProperties & {
  certificate: ICertificateStack
} = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "us-east-1",
  },
  certificate: {
    certificateDomainName: "todolist.ryichk.com",
  },
}
