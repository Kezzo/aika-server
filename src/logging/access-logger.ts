import { Morgan, token, FormatFn, TokenIndexer } from 'morgan';

import morgan = require('morgan');
import rfs = require('rotating-file-stream');
import fs = require('fs');
import express = require('express');
import moment = require('moment');
import _ = require('underscore');
import path = require('path');

export class AccessLogger {
  public RequestLogger: express.RequestHandler;
  public ResponseLogger: express.RequestHandler;

  constructor(logFolderName: string, logToConsole?: boolean) {
    logFolderName = path.join(__dirname, logFolderName);

    if (!fs.existsSync(logFolderName)) {
      fs.mkdirSync(logFolderName);
    }

    const filestream = rfs('access.log', {
      path: logFolderName,
      size: '100MB',
      compress: 'gzip',
      maxFiles: 1
    });

    this.RequestLogger = morgan(function(tokens: TokenIndexer,
      req: express.Request, res: express.Response) {

      const logObject = {
        message: tokens.method(req, res) + ' request to ' + tokens.url(req, res),
        dateTime: moment.utc().format('Y/MM/DD HH:mm:ss'),
        httpMethod: tokens.method(req, res),
        endpoint: tokens.url(req, res),
        urid: res.get('X-Amzn-Trace-Id'),
        headers: req.headers,
        requestBody: req.body,
        type: 'request'
      };

      // This is a hack, but express just isn't providing the response body.
      const send = res.send;
      res.send = function(responseBodyToSend) {
        req.rawHeaders.push(JSON.stringify(responseBodyToSend));
        res.send = send;
        send.call(this, responseBodyToSend);
        return res;
      };

      return JSON.stringify(logObject);
    }, {
      immediate: true,
      stream: filestream
    });

    this.ResponseLogger = morgan(function(tokens: TokenIndexer,
      req: express.Request, res: express.Response) {

      const responseTime = parseFloat(tokens['response-time'](req, res));

      const logObject = {
        message: 'Response ' + tokens.status(req, res) + ' for ' + tokens.url(req, res),
        dateTime: moment.utc().format('Y/MM/DD HH:mm:ss'),
        responseCode: tokens.status(req, res),
        endpoint: tokens.url(req, res),
        responseTime: Math.round(responseTime),
        urid: res.get('X-Amzn-Trace-Id'),
        responseBody: req.rawHeaders[req.rawHeaders.length - 1],
        type: 'response'
      };

      return JSON.stringify(logObject);
    }, {
      stream: filestream
    });
  }
}
