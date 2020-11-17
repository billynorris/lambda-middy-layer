import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpHeaderNormalizer from '@middy/http-header-normalizer';
import jsonBodyParser from '@middy/http-json-body-parser';

import middy from '@middy/core';
import { httpCorrelationIdsMiddleware } from '../middlewares';
import { Options } from '../Options';

const obfuscatedLogging = require('@dazn/lambda-powertools-middleware-obfuscater');

const defaultObfuscatedKeys: Array<string> = [
  'headers.api-key',
  'headers.Api-Key',
  'headers.Authorization',
  'multiValueHeaders.api-key',
  'multiValueHeaders.Api-Key',
  'multiValueHeaders.Authorization',
  'rawHeaders.api-key',
  'rawHeaders.Api-Key',
  'rawHeaders.Authorization',
  'rawMultiValueHeaders.api-key',
  'rawMultiValueHeaders.Api-Key',
  'rawMultiValueHeaders.Authorization',
  'requestContext.authorizer.authHeader',
  'requestContext.authorizer.header',
];

export interface AwsProxyHandlerOptions extends Options {
  cors?: boolean;
}

export const awsProxyHandler = (
  handler: middy.Middy<any, any, any>,
  options?: AwsProxyHandlerOptions,
): middy.Middy<any, any, any> => {
  handler.use(httpEventNormalizer())
    .use(httpHeaderNormalizer({
      canonical: true,
    }));

  if (process.env.ENVIRONMENT === 'dev') {
    handler.use(obfuscatedLogging.obfuscaterMiddleware({
      obfuscationFilters: defaultObfuscatedKeys,
      filterOnError: true,
    }));
  } else {
    handler.use(obfuscatedLogging.obfuscaterMiddleware({
      obfuscationFilters: [
        'body'].concat(defaultObfuscatedKeys),
      filterOnError: true,
    }));
  }

  handler
    .use(jsonBodyParser());

  handler.use(httpErrorHandler());

  handler.use(httpCorrelationIdsMiddleware());

  if (options?.cors) {
    handler.use(cors());
  }

  return handler;
};
