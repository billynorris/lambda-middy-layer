import httpEventNormalizer from '@middy/http-event-normalizer';
import httpHeaderNormalizer from '@middy/http-header-normalizer';
import jsonBodyParser from '@middy/http-json-body-parser';

import middy from '@middy/core';

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

// This wrapper is almost the same as AWS_PROXY but authorisers
// should not be trying to handle http errors gracefully or using CORS
// eslint-disable-next-line import/prefer-default-export
export const authorizationHandler = (
  handler: middy.Middy<any, any, any>,
): middy.Middy<any, any, any> => {
  handler
    .use(httpEventNormalizer())
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

  return handler;
};
