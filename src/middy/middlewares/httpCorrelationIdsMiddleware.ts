/* eslint-disable no-param-reassign */
import middy from '@middy/core';
import { APIGatewayProxyResult } from 'aws-lambda';

const CorrelationIds = require('@dazn/lambda-powertools-correlation-ids');

const X_CORRELATION_ID = 'X-Correlation-Id';

// eslint-disable-next-line import/prefer-default-export
export const
  // eslint-disable-next-line max-len
  httpCorrelationIdsMiddleware: middy.Middleware<any, any, any> = () => ({
    after: (handler, next) => {
      if (handler?.event?.httpMethod) {
        if (!handler?.response?.headers) {
          // eslint-disable-next-line no-param-reassign
          handler.response = handler.response || {} as unknown as APIGatewayProxyResult;
          handler.response.headers = handler.response.headers || {};
        }

        if (!handler.response.headers[X_CORRELATION_ID]) {
          const ids = CorrelationIds.get();

          handler.response.headers[X_CORRELATION_ID] = ids[X_CORRELATION_ID.toLowerCase()];
        }
      }

      return next();
    },
    onError: (handler, next) => {
      if (handler?.event?.httpMethod) {
        if (!handler?.response?.headers) {
          handler.response = (handler.response || {}) as unknown as APIGatewayProxyResult;
          handler.response.headers = handler.response.headers || {};
        }

        if (!handler.response.headers[X_CORRELATION_ID]) {
          const ids = CorrelationIds.get();

          handler.response.headers[X_CORRELATION_ID] = ids[X_CORRELATION_ID.toLowerCase()];
        }
      }

      return next(handler.error);
    },
  });
