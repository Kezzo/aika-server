import { Router, Request, Response, RequestHandler } from 'express';

import _ = require('underscore');
import express = require('express');
import bodyParser = require('body-parser');
import expressRequestId = require('express-request-id');
import path = require('path');

import { FirehoseStream } from './logging/firehose-stream';
import { ConsoleStream } from './logging/console-stream';

import { SecretsProvider } from './common/secrets-provider';
import { DatabaseAccess } from './common/db-access';
import { RouteLoader } from './common/route-loader';
import { AccessLogger } from './logging/access-logger';
import { AppLogger } from './logging/app-logger';
import { LogLevel } from './logging/log-level';
import { MailService } from './common/mail-service';

let appLogger: AppLogger;

const startup = async function() {
  const port = 3075;
  const app = express();

  // TODO: Change when gzip and protobuf is used. Maybe only use for dev?
  app.use(bodyParser.json());
  app.use(expressRequestId({ headerName: 'X-Amzn-Trace-Id', setHeader: true })); // will not overwrite

  const logDirectory = path.join(path.resolve(__dirname, '..') + '/logs');

  // used for healthcheck
  app.get('/', function(req: Request, res: Response) {
    res.send();
  });

  let logStreamToUse;
  if (process.env.NODE_ENV === 'LOCAL') {
    logStreamToUse = ConsoleStream;
  } else {
    FirehoseStream.Init();
    logStreamToUse = FirehoseStream;
  }

  const accessLogger = new AccessLogger(logDirectory, logStreamToUse);
  app.use(accessLogger.RequestLogger);
  app.use(accessLogger.ResponseLogger);

  AppLogger.Init(logDirectory, LogLevel.DEBUG, logStreamToUse);
  appLogger = new AppLogger();

  await SecretsProvider.LoadSecrets(['send-grid-api-key']);

  DatabaseAccess.Init(appLogger);
  MailService.Init();
  RouteLoader.LoadRoutes(appLogger, app);

  app.listen(port);
  appLogger.Info('aika server running on port: ' + port);
};

startup()
.then((result) => {
  appLogger.Info('Startup completed!');
})
.catch((error) => {
  if (_.isNull(appLogger) || _.isUndefined(appLogger)) {
    // tslint:disable-next-line:no-console
    console.error('Error in startup: ' + error);
  } else {
    appLogger.Error('Error in startup: ' + error);
  }
});
