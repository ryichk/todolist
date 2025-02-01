#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { FrontendStack, frontendStackProperties } from "../lib/frontend-stack";
import { CertificateStack, certificateStackProperties } from "../lib/certificate-stack";
import { Route53Stack, route53tackProperties } from "../lib/route53-stack";
import { ECRStack } from "../lib/ecr-stack";
import { RDSStack } from "../lib/rds-stack";
import { VPCStack } from "../lib/vpc-stack";
import { AppRunnerStack } from "../lib/app-runner-stack";
import { RDSSecretsStack } from "../lib/secrets-stack";

const app = new cdk.App();

const ecrStack = new ECRStack(app, "TodoListAPIECRStack")
const vpcStack = new VPCStack(app, "TodoListAPIVpcStack")
const rdsStack = new RDSStack(app, "TodoListRDS", { vpcStack })
const rdsSecretsStack = new RDSSecretsStack(app, "TodoListAPISecret")
const appRunnerStack = new AppRunnerStack(app, "TodoListAPIAppRunnerStack", { ecrStack, vpcStack, rdsStack, rdsSecretsStack })

const route53Stack = new Route53Stack(app, "TodoListRoute53Stack", {
  env: route53tackProperties.env,
  crossRegionReferences: true,
  ...route53tackProperties.hostedZone,
});
const certificateStack = new CertificateStack(app, "TodoListCertificateStack", {
    env: certificateStackProperties.env,
    crossRegionReferences: true,
    route53Stack,
    ...certificateStackProperties.certificate,
  });
new FrontendStack(app, "TodoListFrontendStack", {
  env: frontendStackProperties.env,
  crossRegionReferences: true,
  route53Stack,
  certificateStack,
  ...frontendStackProperties.props,
});
