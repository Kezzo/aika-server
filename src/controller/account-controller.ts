import _ = require('underscore');
import bcrypt = require('bcryptjs');

import { AccountQuery } from '../queries/account-query';
import { AppLogger } from '../logging/app-logger';
import to from '../utility/to';
import { AsyncResult } from '../utility/to';

export class AccountController {
  public static async CreateAccount(logger: AppLogger, mail: string, password: string) {

    const getAccountResult = await AccountQuery.GetAccount(logger, true, null, mail);

    if (!_.isNull(getAccountResult.error)) {
      throw getAccountResult.error;
    }

    // TODO: Create error id system to identify what error happened.
    if (!_.isNull(getAccountResult.result) && !_.isUndefined(getAccountResult.result)) {
      throw new Error('Account with mail already exists!');
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

    return response;
  }
}
