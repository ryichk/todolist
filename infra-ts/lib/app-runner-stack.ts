import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { ECRStack } from "./ecr-stack";
import { RDSStack } from "./rds-stack";
import { VPCStack } from "./vpc-stack";
import { SecretsStack } from "./secrets-stack";

interface IAppRunnerStackProps extends cdk.StackProps {
  ecrStack: ECRStack;
  vpcStack: VPCStack;
  rdsStack: RDSStack;
  secretsStack: SecretsStack;
}

export class AppRunnerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: IAppRunnerStackProps) {
    super(scope, id, props);

    const { ecrStack, vpcStack, rdsStack , secretsStack } = props;

    const accessRole = new cdk.aws_iam.Role(this, "TodoListAPIAppRunnerAccessRole", {
      assumedBy: new cdk.aws_iam.ServicePrincipal("build.apprunner.amazonaws.com"),
    });
    accessRole.addToPolicy(new cdk.aws_iam.PolicyStatement({
      effect: cdk.aws_iam.Effect.ALLOW,
      actions: [
        "ecr:GetAuthorizationToken",
      ],
      resources: ["*"],
    }));
    accessRole.addToPolicy(new cdk.aws_iam.PolicyStatement({
      effect: cdk.aws_iam.Effect.ALLOW,
      actions: [
        "ecr:BatchCheckLayerAvailability",
        "ecr:BatchGetImage",
        "ecr:DescribeImages",
        "ecr:GetDownloadUrlForLayer",
      ],
      resources: [ecrStack.repository.repositoryArn],
    }));
    secretsStack.dbCredentials.grantRead(accessRole);
    secretsStack.cognitoSecret.grantRead(accessRole);

    const instanceRole = new cdk.aws_iam.Role(this, "TodoListAPIAppRunnerInstanceRole", {
      assumedBy: new cdk.aws_iam.ServicePrincipal("tasks.apprunner.amazonaws.com"),
    });
    secretsStack.dbCredentials.grantRead(instanceRole);

    const vpcConnector = new cdk.aws_apprunner.CfnVpcConnector(this, "TodoListAPIVpcConnector", {
      subnets: vpcStack.vpc.selectSubnets({ subnetType: cdk.aws_ec2.SubnetType.PRIVATE_ISOLATED }).subnetIds,
      securityGroups: [rdsStack.appRunnerSecurityGroup.securityGroupId],
      vpcConnectorName: "todolist-api-vpc-connector"
    })

    const repositoryName = ecrStack.repository.repositoryName;

    new cdk.aws_apprunner.CfnService(this, "TodoListAPIAppRunnerService", {
      serviceName: "todolist-api-app-runner-service",
      sourceConfiguration: {
        imageRepository: {
          imageIdentifier: `${cdk.Aws.ACCOUNT_ID}.dkr.ecr.${cdk.Aws.REGION}.amazonaws.com/${repositoryName}:latest`,
          imageRepositoryType: "ECR",
          imageConfiguration: {
            runtimeEnvironmentVariables: [
              {
                name: "CLIENT_DOMAIN",
                value: "https://todolist.ryichk.com"
              },
              {
                name: "POSTGRES_HOST",
                value: rdsStack.dbInstance.dbInstanceEndpointAddress,
              },
              {
                name: "POSTGRES_PORT",
                value: rdsStack.dbInstance.dbInstanceEndpointPort,
              },
              {
                name: "POSTGRES_APP_USER",
                value: secretsStack.dbCredentials.secretValueFromJson("username").unsafeUnwrap(),
              },
              {
                name: "POSTGRES_APP_PASSWORD",
                value: secretsStack.dbCredentials.secretValueFromJson("password").unsafeUnwrap(),
              },
              {
                name: "POSTGRES_DB",
                value: "app_db",
              },
              {
                name: "COGNITO_SECRET_ARN",
                value: secretsStack.cognitoSecret.secretArn,
              },
            ],
          }
        },
        authenticationConfiguration: {
          accessRoleArn: accessRole.roleArn,
        },
      },
      instanceConfiguration: {
        instanceRoleArn: instanceRole.roleArn,
        cpu: "1 vCPU",
        memory: "2 GB",
      },
      networkConfiguration: {
        egressConfiguration: {
          egressType: "VPC",
          vpcConnectorArn: vpcConnector.attrVpcConnectorArn,
        },
        ingressConfiguration: {
          isPubliclyAccessible: true,
        }
      },
    });
  }
}
