import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { VPCStack } from "./vpc-stack";
import { SecretsStack } from "./secrets-stack";

interface IRDSStackProps extends cdk.StackProps {
  vpcStack: VPCStack;
  secretsStack: SecretsStack;
}

export class RDSStack extends cdk.Stack {
  public readonly dbInstance: cdk.aws_rds.DatabaseInstance;
  public readonly rdsSecurityGroup: cdk.aws_ec2.SecurityGroup;
  public readonly appRunnerSecurityGroup: cdk.aws_ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: IRDSStackProps) {
    super(scope, id, props);

    const { vpcStack, secretsStack } = props;

    this.rdsSecurityGroup = new cdk.aws_ec2.SecurityGroup(this, "TodoListRDSSecurityGroup", {
      vpc: vpcStack.vpc,
      description: "Security Group for RDS",
    });

    this.appRunnerSecurityGroup = new cdk.aws_ec2.SecurityGroup(this, "TodoListAPIAppRunnerSecurityGroup", {
      vpc: vpcStack.vpc,
      allowAllOutbound: true,
      description: "Security Group for App Runner",
    });

    this.rdsSecurityGroup.addIngressRule(
      this.appRunnerSecurityGroup,
      cdk.aws_ec2.Port.tcp(5432),
      "Allow App Runner to access RDS"
    );

    // this.appRunnerSecurityGroup.addIngressRule(
    //   cdk.aws_ec2.Peer.anyIpv4(),
    //   cdk.aws_ec2.Port.tcp(22),
    //   "Allow SSH access from anywhere"
    // );
    this.appRunnerSecurityGroup.addIngressRule(
      cdk.aws_ec2.Peer.ipv4("192.0.2.0/24"), // CloudFrontのIP範囲
      cdk.aws_ec2.Port.tcp(443),
      "Allow HTTPS traffic from anywhere",
    );

    const dbName = "app_db";

    this.dbInstance = new cdk.aws_rds.DatabaseInstance(this, "TodoListPostgresInstance", {
      engine: cdk.aws_rds.DatabaseInstanceEngine.postgres({
        version: cdk.aws_rds.PostgresEngineVersion.VER_17,
      }),
      instanceType: cdk.aws_ec2.InstanceType.of(
        cdk.aws_ec2.InstanceClass.T4G,
        cdk.aws_ec2.InstanceSize.MICRO
      ),
      vpc: vpcStack.vpc,
      vpcSubnets: {
        subnetType: cdk.aws_ec2.SubnetType.PRIVATE_ISOLATED,
      },
      credentials: cdk.aws_rds.Credentials.fromSecret(secretsStack.dbCredentials),
      databaseName: dbName,
      securityGroups: [this.rdsSecurityGroup],
      storageEncrypted: true,
      multiAz: false,
    });
  }
}
