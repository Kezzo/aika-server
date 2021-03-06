import { Router, Request, Response, RequestHandler } from 'express';

import _ = require('underscore');
import express = require('express');
import bodyParser = require('body-parser');
import expressRequestId = require('express-request-id');
import path = require('path');

import { EnvironmentHelper } from './utility/environment-helper';
import { Environment } from './utility/environment';

import { FirehoseStream } from './logging/firehose-stream';
import { ConsoleStream } from './logging/console-stream';

import { SecretsProvider } from './common/secrets-provider';
import { DatabaseAccess } from './common/db-access';
import { CacheAccess } from './common/cache-access';

import { OneTimeTokenService } from './common/ott-service';
import { RouteLoader } from './common/route-loader';
import { AccessLogger } from './logging/access-logger';
import { AppLogger } from './logging/app-logger';
import { LogLevel } from './logging/log-level';
import { MailService } from './common/mail-service';

import { TwitterService } from './platforms/twitter-service';
import { SearchAccess } from './common/search-access';
import { StaticFileAccess } from './common/static-file-access';

let appLogger: AppLogger;
let logStreamToUse;

const startup = async function() {
  const logDirectory = path.join(path.resolve(__dirname, '..') + '/logs');

  if (EnvironmentHelper.GetEnvironment() === Environment.LOCAL) {
    logStreamToUse = ConsoleStream;
  } else {
    FirehoseStream.Init();
    logStreamToUse = FirehoseStream;
  }

  AppLogger.Init(logDirectory, LogLevel.DEBUG, logStreamToUse);
  appLogger = new AppLogger();

  process.on('uncaughtException', async (err) => {
    appLogger.Error('Uncaught exception: ' + err);
    await logStreamToUse.FlushBuffer();
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, p) => {
    appLogger.Error('Unhandled rejection at:' + p + 'reason:' + reason);
  });

  const port = 3075;
  const app = express();

  // TODO: Change when gzip and protobuf is used. Maybe only use for dev?
  app.use(bodyParser.json({
    limit: '1mb'
  }));
  app.use(expressRequestId({ headerName: 'X-Amzn-Trace-Id', setHeader: true })); // will not overwrite

  // used for healthcheck
  app.get('/', function(req: Request, res: Response) {
    res.send();
  });

  if (EnvironmentHelper.GetEnvironment() !== Environment.LIVE) {
    // api documentation
    app.use('/api', express.static(path.join(__dirname, '../apidoc')));
  }

  const accessLogger = new AccessLogger(logDirectory, logStreamToUse);
  app.use(accessLogger.RequestLogger);
  app.use(accessLogger.ResponseLogger);

  app.use(OneTimeTokenService.CheckOTT);

  DatabaseAccess.Init(appLogger);
  await Promise.all([SecretsProvider.LoadSecrets(['send-grid-api-key', 'aika-twitter-api-keys']),
    CacheAccess.Init(appLogger), SearchAccess.Init(appLogger), StaticFileAccess.LoadFiles([EnvironmentHelper.GetTopListFileName()])]);

  MailService.Init();
  TwitterService.Init();
  RouteLoader.LoadRoutes(appLogger, app);

  app.listen(port);
  appLogger.Info('aika server running on port: ' + port);
};

startup()
.then((result) => {
  appLogger.Info('Startup completed!');
})
.catch(async (error) => {
  if (_.isNull(appLogger) || _.isUndefined(appLogger)) {
    // tslint:disable-next-line:no-console
    console.error('Error in startup: ' + error);
  } else {
    appLogger.Error('Error in startup: ' + error);
    await logStreamToUse.FlushBuffer();
    process.exit(1);
  }
});
