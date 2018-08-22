import { Morgan, token, FormatFn, TokenIndexer } from 'morgan';

import morgan = require('morgan');
import rfs = require('rotating-file-stream');
import fs = require('fs');
import express = require('express');
import moment = require('moment');
import _ = require('underscore');

export class AccessLogger {
  public RequestLogger: express.RequestHandler;
  public ResponseLogger: express.RequestHandler;

  constructor(logDirectory: string, streamToUse) {
    this.RequestLogger = morgan(function(tokens: TokenIndexer,
      req: express.Request, res: express.Response) {

      const body = Object.assign({}, req.body);
      if (body.password) {
        body.password = 'X';
      }

      const endpoint = req.path.endsWith('/') ? req.path.substring(0, req.path.length - 1) : req.path; // to remove last slash

      const logObject = {
        message: tokens.method(req, res) + ' request to ' + tokens.url(req, res),
        dateTime: moment.utc().format('Y/MM/DD HH:mm:ss'),
        httpMethod: tokens.method(req, res),
        endpoint,
        urid: res.get('X-Amzn-Trace-Id'),
        headers: JSON.stringify(req.headers),
        requestBody: JSON.stringify(body),
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
      stream: streamToUse
    });

    this.ResponseLogger = morgan(function(tokens: TokenIndexer,
      req: express.Request, res: express.Response) {

      const responseTime = parseInt(tokens['response-time'](req, res), 10);
      let endpoint = req.baseUrl + req.path;
      endpoint = endpoint.endsWith('/') ? endpoint.substring(0, endpoint.length - 1) : endpoint; // to remove last slash

      const logObject = {
        message: 'Response ' + tokens.status(req, res) + ' for ' + tokens.url(req, res),
        dateTime: moment.utc().format('Y/MM/DD HH:mm:ss'),
        responseCode: tokens.status(req, res),
        endpoint,
        responseTime: Math.round(responseTime),
        urid: res.get('X-Amzn-Trace-Id'),
        responseBody: req.rawHeaders[req.rawHeaders.length - 1],
        type: 'response'
      };

      return JSON.stringify(logObject);
    }, {
      stream: streamToUse
    });
  }
}
