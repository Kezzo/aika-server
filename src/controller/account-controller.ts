import _ = require('underscore');
import bcrypt = require('bcryptjs');
import httpStatus = require('http-status-codes');

import to from '../utility/to';
import { AccountQuery } from '../queries/account-query';
import { AppLogger } from '../logging/app-logger';
import { AsyncResult } from '../utility/to';
import { AccountError } from '../error-codes/account-error';

export class AccountController {
  public static async CreateAccount(logger: AppLogger, mail: string, password: string) {

    const getAccountResult = await AccountQuery.GetAccount(logger, true, null, mail);

    if (!_.isNull(getAccountResult.error)) {
      throw getAccountResult.error;
    }

    if (!_.isNull(getAccountResult.result) && !_.isUndefined(getAccountResult.result)) {
      return {
        msg: {
          error: 'Account with mail already exists!',
          errorCode: AccountError.ACCOUNT_ALREADY_EXISTS
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const asyncResult = await to(AccountQuery.CreateAccountFromMail(logger, mail, passwordHash));

    if (!_.isNull(asyncResult.error)) {
      throw asyncResult.error;
    }

    // TODO: Generate login token here and put into cache.

    const response = {
      accountId: asyncResult.result.ACCID,
      authToken: asyncResult.result.AUTHTK,
      oneTimeToken: 'TODO'
    };

    return {
      msg: response,
      statusCode: httpStatus.CREATED
    };
  }

  public static async LoginAccount(logger: AppLogger, mail: string, accountId: string,
    password: string, authToken: string) {

    const mailOrPasswordMissing = (_.isUndefined(mail) || _.isNull(mail)) ||
      (_.isUndefined(password) || _.isNull(password));

    const accountIdOrAuthTokenMissing = (_.isUndefined(accountId) || _.isNull(accountId)) ||
      (_.isUndefined(authToken) || _.isNull(authToken));

    if (mailOrPasswordMissing && accountIdOrAuthTokenMissing) {
      return {
        msg: {
          error: 'Login requires either mail&password or accountId&authToken!',
          errorCode: AccountError.LOGIN_DETAILS_MISSING
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    const getAccountResult = await AccountQuery.GetAccount(logger, false, accountId, mail);

    if (_.isNull(getAccountResult.result) || _.isUndefined(getAccountResult.result)) {
      return {
        msg: {
          error: 'Account with mail/accountId doesn\'t exists!',
          errorCode: AccountError.ACCOUNT_DOESNT_EXISTS
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    let authSuccessful: boolean = false;

    if (!accountIdOrAuthTokenMissing) {
      authSuccessful = _.isEqual(getAccountResult.result.AUTHTK, authToken);
    } else if (!mailOrPasswordMissing) {
      authSuccessful = await bcrypt.compare(password, getAccountResult.result.PWHASH);
    }

    if (!authSuccessful) {
      return {
        msg: {
          error: 'Password or authToken is not correct!',
          errorCode: AccountError.AUTH_PARAM_INCORRECT
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    // TODO: Generate login token here and put into cache.

    const response: any = {
      oneTimeToken: 'TODO'
    };

    if (!mailOrPasswordMissing) {
      response.accountId = getAccountResult.result.ACCID;
      response.authToken = getAccountResult.result.AUTHTK;
    }

    return {
      msg: response,
      statusCode: httpStatus.OK
    };
  }
}
