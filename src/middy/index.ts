import middy from '@middy/core';

import ssm from '@middy/ssm';
import secretsManager from '@middy/secrets-manager';
import { awsProxyHandler, AwsProxyHandlerOptions } from './handlers/awsProxyHandler';
import { authorizationHandler } from './handlers/authorizationHandler';

import { capturePackageDetailsMiddleware } from './middlewares';

import { Options } from './Options';

const captureCorrelationIds = require('@dazn/lambda-powertools-middleware-correlation-ids');
const sampleLogging = require('@dazn/lambda-powertools-middleware-sample-logging');

const defaultSampleRate: number = 0.1;

module.exports = (__handler: any,
  handlerType: 'AUTHORISER' | 'AWS_PROXY' | 'STEP_FUNCTIONS',
  options?: Options | AwsProxyHandlerOptions) => {
  const handler = middy(__handler);

  handler
    .use(captureCorrelationIds({
      sampleDebugLogRate: options?.sampleRate ?? defaultSampleRate,
    }))
    .use(sampleLogging({
      sampleRate: options?.sampleRate ?? defaultSampleRate,
    }))
    .use(capturePackageDetailsMiddleware());

  switch (handlerType) {
    case 'AUTHORISER':
      authorizationHandler(handler);
      break;
    case 'AWS_PROXY':
      awsProxyHandler(handler, options);
      break;
    case 'STEP_FUNCTIONS':
    default:
      break;
  }

  if (options?.ssm) {
    handler.use(
      ssm({
        cache: true,
        names: options.ssm,
      }),
    );
  }

  if (options?.secrets) {
    handler.use(
      secretsManager({
        cache: true,
        secrets: options.secrets,
      }),
    );
  }

  return handler;
};
