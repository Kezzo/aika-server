import path = require('path');
import fs = require('fs');
import rfs = require('rotating-file-stream');
import express = require('express');
import moment = require('moment');
import _ = require('underscore');

import { LogLevel } from './log-level';

export class AppLogger {
  private static rfsToUse;
  private static logLevel;
  private requestId: string;

  constructor(req?: express.Request, res?: express.Response)  {
    if (!_.isUndefined(res) && !_.isNull(res)) {
      this.requestId = res.get('X-Amzn-Trace-Id');
    }
  }

  public static Init(logFolderName: string, logLevel, logToConsole?: boolean) {
    this.logLevel = logLevel;
    logFolderName = path.join(__dirname, logFolderName);

    if (!fs.existsSync(logFolderName)) {
      fs.mkdirSync(logFolderName);
    }

    this.rfsToUse = rfs('app.log', {
      path: logFolderName,
      size: '100MB',
      compress: 'gzip',
      maxFiles: 1
    });
  }

  public Debug(logMessage: string) {
    if (AppLogger.logLevel.order <= LogLevel.DEBUG.order) {
      AppLogger.rfsToUse.write(AppLogger.getFormattedLog(LogLevel.DEBUG, this.requestId, logMessage));
    }
  }

  public Info(logMessage: string) {
    if (AppLogger.logLevel.order <= LogLevel.INFO.order) {
      AppLogger.rfsToUse.write(AppLogger.getFormattedLog(LogLevel.INFO, this.requestId, logMessage));
    }
  }

  public Warn(logMessage: string) {
    if (AppLogger.logLevel.order <= LogLevel.WARN.order) {
      AppLogger.rfsToUse.write(AppLogger.getFormattedLog(LogLevel.WARN, this.requestId, logMessage));
    }
  }

  public Error(logMessage, callback) {
    if (AppLogger.logLevel.order <= LogLevel.ERROR.order) {
      if (!_.isUndefined(logMessage.message) && !_.isUndefined(logMessage.stack)) {
        logMessage = logMessage.message + '\n' + logMessage.stack;
      }

      AppLogger.rfsToUse.write(AppLogger.getFormattedLog(LogLevel.ERROR, this.requestId, logMessage), callback);
    }
  }

  private static getFormattedLog(logLevel, requestId: string, logMessage: string) {
    return JSON.stringify({
      message: logMessage,
      datetime: moment.utc().format('Y/MM/DD HH:mm:ss'),
      level: logLevel.name,
      urid: requestId
    }) + '\n';
  }
}
