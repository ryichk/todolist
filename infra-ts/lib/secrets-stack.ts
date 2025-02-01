import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export class SecretsStack extends cdk.Stack {
  public readonly dbCredentials: cdk.aws_secretsmanager.Secret
  public readonly cognitoSecret: cdk.aws_secretsmanager.Secret

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.dbCredentials = new cdk.aws_secretsmanager.Secret(this, "TodoListAPISecret", {
      secretName: "todolist-rds-secret",
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: "app_user" }),
        generateStringKey: "password",
        excludeCharacters: "\"@/\\\'",
        passwordLength: 32,
      },
    });

    this.cognitoSecret = new cdk.aws_secretsmanager.Secret(this, "TodoListCognitoSecret", {
      description: "Cognito User Pool Configuration",
    })
  }
}
