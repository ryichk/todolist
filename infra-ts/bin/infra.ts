#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { FrontendStack, frontendStackProperties } from '../lib/frontend-stack';
import { CertificateStack, certificateStackProperties } from '../lib/certificate-stack';
import { Route53Stack, route53tackProperties } from '../lib/route53-stack';

const app = new cdk.App();
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
new FrontendStack(app, 'TodoListFrontendStack', {
  env: frontendStackProperties.env,
  crossRegionReferences: true,
  route53Stack,
  certificateStack,
  ...frontendStackProperties.props,
});
