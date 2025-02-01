import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { SecretsStack } from "./secrets-stack";
import { VPCStack } from "./vpc-stack";

interface IDBMigrateTaskStackProps extends cdk.StageProps {
  secretsStack: SecretsStack;
  vpcStack: VPCStack;
}

export class DBMigrateTaskStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: IDBMigrateTaskStackProps) {
    super(scope, id, props);

    const { secretsStack, vpcStack } = props;

    const migrationTaskRole = new cdk.aws_iam.Role(this, "TodoListDBMigrationTaskRole", {
      assumedBy: new cdk.aws_iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      inlinePolicies: {
        SecretsAccess: new cdk.aws_iam.PolicyDocument({
          statements: [
            new cdk.aws_iam.PolicyStatement({
              actions: ["secretsmanager:GetSecretValue"],
              resources: [secretsStack.dbCredentials.secretArn]
            }),
          ],
        }),
      },
    });

    const migrationCluster = new cdk.aws_ecs.Cluster(this, "TodoListDBMigrationCluster", {
      vpc: vpcStack.vpc,
      enableFargateCapacityProviders: true,
    });

    const dbMigrateTask = new cdk.aws_ecs.FargateTaskDefinition(this, "TodoListDBMigrateTask", {
      cpu: 256,
      memoryLimitMiB: 512,
      taskRole: migrationTaskRole,
      // runtimePlatform: {
      //   cpuArchitecture: cdk.aws_ecs.CpuArchitecture.ARM64,
      // },
    });

    dbMigrateTask.addContainer("DBMigrateContainer", {
      image: cdk.aws_ecs.ContainerImage.fromAsset("./migration"),
      command: ["sh", "-c", `migrate -path /migration -database "$POSTGRES_URL" up`],
      environment: {
        DB_SECRET_ARN: secretsStack.dbCredentials.secretArn,
      },
      logging: cdk.aws_ecs.LogDriver.awsLogs({ streamPrefix: "migrate" }),
    });

    new cdk.CfnOutput(this, "TodoListDBMigrateTaskDefArn", {
      value: dbMigrateTask.taskDefinitionArn,
    });
  }
}
