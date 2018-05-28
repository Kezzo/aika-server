import express = require('express');
import _ = require('underscore');
import httpStatus = require('http-status-codes');

export class Response {
  private res: express.Response;
  private result;
  private error;

  constructor(res: express.Response, result?, error?) {
    this.res = res;
    this.result = result;
    this.error = error;
  }

  public Send() {
    let responseMessage: string = '';

    if (!_.isNull(this.result) && !_.isUndefined(this.result)) {
      if (!_.isUndefined(this.result.statusCode)) {
        this.res.statusCode = this.result.statusCode;
      } else {
        this.res.statusCode = httpStatus.OK;
      }

      if (!_.isUndefined(this.result.raw)) {
        responseMessage = this.result.raw;
      } else {
        if (!_.isUndefined(this.result.msg)) {
          responseMessage = JSON.stringify(this.result.msg);
        } else {
          responseMessage = JSON.stringify(this.result);
        }
      }
    } else if (!_.isNull(this.error) && !_.isUndefined(this.error)) {
      if (!_.isUndefined(this.error.statusCode)) {
        this.res.statusCode = this.error.statusCode;
      } else {
        this.res.statusCode = httpStatus.INTERNAL_SERVER_ERROR;
      }

      if (!_.isUndefined(this.error.msg)) {
        responseMessage = JSON.stringify(this.error.msg);
      } else if (!_.isUndefined(this.error.message)) {
        responseMessage = JSON.stringify(this.error.message);
      } else {
        // TODO: Do not send error+stack in live environment!
        if (!_.isUndefined(this.error.stack)) {
          responseMessage = this.error.stack;
        } else {
          responseMessage = this.error.toString();
        }
      }
    } else {
      this.res.statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    }

    this.res.send(responseMessage);
  }
}
