import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { ECRDeployment, DockerImageName } from "cdk-ecr-deployment";
import * as path from "path"

export class ECRStack extends cdk.Stack {
  public readonly repository: cdk.aws_ecr.Repository;
  public readonly imageAsset: cdk.aws_ecr_assets.DockerImageAsset;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.repository = new cdk.aws_ecr.Repository(this, "TodoListAPIRepository", {
      repositoryName: "todolist-api-repository",
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Stack削除時にリポジトリも削除
    });

    this.imageAsset = new cdk.aws_ecr_assets.DockerImageAsset(this, "TodoListAPIImage", {
      directory: path.join(__dirname, "../../api"),
    });

    new ECRDeployment(this, "DeployTodoListApiDockerImage", {
      src: new DockerImageName(this.imageAsset.imageUri),
      dest: new DockerImageName(
        `${cdk.Aws.ACCOUNT_ID}.dkr.ecr.${cdk.Aws.REGION}.amazonaws.com/${this.repository.repositoryName}:latest`
      ),
    });
  }
}
