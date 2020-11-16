import fs from 'fs';
import path from 'path';

import middy from '@middy/core';

const CorrelationIds = require('@dazn/lambda-powertools-correlation-ids');

const lambdaNameEnvironmentVariable = 'LAMBDA_PACKAGE_NAME';
const lambdaVersionEnvironmentVariable = 'LAMBDA_PACKAGE_VERSION';

// eslint-disable-next-line import/prefer-default-export
export const
  // eslint-disable-next-line max-len
  capturePackageDetailsMiddleware: middy.Middleware<any, any, any> = () => ({
    before: (handler, next) => {
      if (!process.env[lambdaNameEnvironmentVariable] && process.env.PWD) {
        const packagePath = path.resolve(process.env.PWD, 'package.json');

        if (fs.existsSync(packagePath)) {
          const packageJson = fs.readFileSync(packagePath, 'utf8');

          const pkg = JSON.parse(packageJson);

          process.env[lambdaNameEnvironmentVariable] = pkg.name;
          process.env[lambdaVersionEnvironmentVariable] = pkg.version;
        }
      }

      const ids = CorrelationIds.get();

      ids.lambdaPackageName = process.env[lambdaNameEnvironmentVariable];
      ids.lambdaPackageVersion = process.env[lambdaVersionEnvironmentVariable];

      return next();
    },
    after: (handler, next) => next(),
    onError: (handler, next) => next(handler.error),
  });
