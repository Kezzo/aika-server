import fs = require('fs');
import rfs = require('rotating-file-stream');
import express = require('express');
import moment = require('moment');
import _ = require('underscore');

import { LogLevel } from './log-level';

export class AppLogger {
  private static streamToUse;
  private static logLevel;
  private requestId: string;

  constructor(req?: express.Request, res?: express.Response)  {
    if (!_.isUndefined(res) && !_.isNull(res)) {
      this.requestId = res.get('X-Amzn-Trace-Id');
    }
  }

  public static Init(logDirectory: string, logLevel, streamToUse) {
    this.logLevel = logLevel;
    this.streamToUse = streamToUse;
  }

  public Debug(logMessage: string) {
    if (AppLogger.logLevel.order <= LogLevel.DEBUG.order) {
      AppLogger.streamToUse.write(AppLogger.getFormattedLog(LogLevel.DEBUG, this.requestId, logMessage));
    }
  }

  public Info(logMessage: string) {
    if (AppLogger.logLevel.order <= LogLevel.INFO.order) {
      AppLogger.streamToUse.write(AppLogger.getFormattedLog(LogLevel.INFO, this.requestId, logMessage));
    }
  }

  public Warn(logMessage: string) {
    if (AppLogger.logLevel.order <= LogLevel.WARN.order) {
      AppLogger.streamToUse.write(AppLogger.getFormattedLog(LogLevel.WARN, this.requestId, logMessage));
    }
  }

  public Error(logMessage) {
    if (AppLogger.logLevel.order <= LogLevel.ERROR.order) {
      if (!_.isUndefined(logMessage.message) && !_.isUndefined(logMessage.stack)) {
        logMessage = logMessage.message + '\n' + logMessage.stack;
      }

      AppLogger.streamToUse.write(AppLogger.getFormattedLog(LogLevel.ERROR, this.requestId, logMessage));
    }
  }

  private static getFormattedLog(logLevel, requestId: string, logMessage: string) {
    return JSON.stringify({
      message: logMessage,
      dateTime: moment.utc().format('Y/MM/DD HH:mm:ss'),
      level: logLevel.name,
      urid: requestId
    }) + '\n';
  }
}
