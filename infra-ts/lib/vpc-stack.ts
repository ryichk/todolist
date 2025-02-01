import * as cdk from "aws-cdk-lib";
import { SubnetType } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export class VPCStack extends cdk.Stack {
  public readonly vpc: cdk.aws_ec2.Vpc

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.vpc = new cdk.aws_ec2.Vpc(this, "TodoListAPIVpc", {
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "public-subnet",
          subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: "private-subnet",
          subnetType: cdk.aws_ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      natGateways: 0,
    });
  }
}
