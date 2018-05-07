import { Router, Request, Response, RequestHandler } from 'express';

import express = require('express');
import expressRequestId = require('express-request-id');
import path = require('path');

import { DatabaseAccess } from './common/db-access';
import { RouteLoader } from './common/route-loader';
import { AccessLogger } from './logging/access-logger';
import { AppLogger } from './logging/app-logger';
import { LogLevel } from './logging/log-level';

const port = 3075;
const app = express();

app.use(expressRequestId({ headerName: 'X-Amzn-Trace-Id', setHeader: true })); // will not overwrite

const logDirectory = path.join(path.resolve(__dirname, '..') + '/logs');

const accessLogger = new AccessLogger(logDirectory, true);
app.use(accessLogger.RequestLogger);
app.use(accessLogger.ResponseLogger);

AppLogger.Init(logDirectory, LogLevel.DEBUG, true);
const appLogger = new AppLogger();

// used for healthcheck
app.get('/', function(req: Request, res: Response) {
  res.send();
});

DatabaseAccess.Init(appLogger);
RouteLoader.LoadRoutes(appLogger, app);

app.listen(port);
appLogger.Info('aika server running on port: ' + port);
