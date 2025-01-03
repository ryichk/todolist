import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { IHostedZone, StackProperties } from "./types";

export interface IRoute53StackProps extends cdk.StackProps, IHostedZone {}

export class Route53Stack extends cdk.Stack {
  readonly publicHostedZone: cdk.aws_route53.IPublicHostedZone

  constructor(scope: Construct, id: string, props: IRoute53StackProps) {
    super(scope, id, props);

    if (props.zoneName) {
      this.publicHostedZone = new cdk.aws_route53.PublicHostedZone(this, "Default", {
        zoneName: props.zoneName,
      });
    }
    if (props.hostedZoneId) {
      this.publicHostedZone = cdk.aws_route53.PublicHostedZone.fromHostedZoneId(
        this,
        "Default",
        props.hostedZoneId,
      )
    }
  }
}

export const route53tackProperties: StackProperties & {
  hostedZone: IHostedZone
} = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  hostedZone: {
    zoneName: "todolist.ryichk.com",
  },
}
