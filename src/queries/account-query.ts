import _ = require('underscore');
import uuidv4 = require('uuid/v4');

import { DatabaseAccess } from '../common/db-access';
import { AppLogger } from '../logging/app-logger';
import to from '../utility/to';
import { AsyncResult } from '../utility/to';

export class AccountQuery {
  public static async GetAccount(logger: AppLogger, keyOnly: boolean, accountId?: string, mail?: string) {
    logger.Info('GetAccount for id: ' + accountId);

    let asyncResult: AsyncResult;
    const params: any = {
      TableName: 'ACCOUNTS'
    };

    if (!_.isNull(accountId) && !_.isUndefined(accountId)) {
      params.Key = { ACCID: accountId };
      asyncResult = await to(DatabaseAccess.Get(logger, params));
    } else if (!_.isNull(mail) && !_.isUndefined(mail)) {
      params.IndexName = 'MAIL';
      params.ExpressionAttributeNames = { '#key': 'MAIL' };
      params.ExpressionAttributeValues = { ':value': mail };
      params.KeyConditionExpression = '#key = :value';
      params.Limit = 1;

      if (keyOnly) {
        params.ProjectionExpression = 'MAIL';
      }

      asyncResult = await to(DatabaseAccess.Query(logger, params));

      if (!_.isNull(asyncResult.result) && _.isArray(asyncResult.result)) {
        asyncResult.result = asyncResult.result[0];
      }
    }

    if (!_.isNull(asyncResult.error)) {
      logger.Error('Error getting account with id: ' + accountId);
    } else {
      logger.Info('Got data with id: ' + accountId + ': ' + JSON.stringify(asyncResult.result));
    }

    return asyncResult;
  }

  public static async CreateAccountFromMail(logger: AppLogger, mail: string, passwordHash: string) {
    logger.Info('Creating account for user with mail: ' + mail);
    return await this.CreateAccount(logger, mail, passwordHash);
  }

  // TODO: Add more options like GoogleID, FacebookID or TwitterID
  private static async CreateAccount(logger: AppLogger, mail?: string, passwordHash?: string) {
    const accoundId = uuidv4();
    const authToken = uuidv4();

    const itemToCreate =  {
      ACCID: accoundId,
      MAIL: '',
      PWHASH: '',
      AUTHTK: authToken,
    };

    if (!_.isUndefined(mail)) {
      itemToCreate.MAIL = mail;
      itemToCreate.PWHASH = passwordHash;
    }

    const queryParams = {
      TableName: 'ACCOUNTS',
      Item: itemToCreate
    };

    const asyncResult = await to(DatabaseAccess.Put(logger, queryParams));

    if (!_.isNull(asyncResult.error)) {
      throw asyncResult.error;
    } else {
      logger.Info('Account created successfully: ' + JSON.stringify(asyncResult.result));
    }

    return itemToCreate;
  }
}
