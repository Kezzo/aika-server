import _ = require('underscore');
import uuidv4 = require('uuid/v4');

import { DatabaseAccess } from '../common/db-access';
import { CacheAccess } from '../common/cache-access';
import { AppLogger } from '../logging/app-logger';
import to from '../utility/to';
import { AsyncResult } from '../utility/to';

export class AccountQuery {
  public static async GetAccount(logger: AppLogger, keyOnly: boolean,
    accountId?: string, mail?: string, twitterId?: string) {
    logger.Info('GetAccount for id: ' + accountId);

    let asyncResult: AsyncResult;
    const params: any = {
      TableName: 'ACCOUNTS'
    };

    if (accountId) {
      params.Key = { ACCID: accountId };
      asyncResult = await to(DatabaseAccess.Get(logger, params));
    } else {
      if (mail) {
        this.AddQueryParams(params, 'MAIL', mail, keyOnly);
      } else if (twitterId) {
        this.AddQueryParams(params, 'TWITID', twitterId, keyOnly);
      }

      asyncResult = await to(DatabaseAccess.Query(logger, params));

      if (asyncResult.result && _.isArray(asyncResult.result)) {
        asyncResult.result = asyncResult.result[0];
      }
    }

    if (asyncResult.error) {
      throw asyncResult.error;
    } else {
      logger.Info('Got data with id: ' + accountId + ': ' + JSON.stringify(asyncResult.result));
    }

    return asyncResult.result;
  }

  public static async CreateAccountFromMail(logger: AppLogger, mail: string, passwordHash: string) {
    logger.Info('Creating account for user with mail: ' + mail);
    return await this.CreateAccount(logger, mail, passwordHash);
  }

  public static async CreateAccountFromTwitterId(logger: AppLogger, twitterId: string) {
    logger.Info('Creating account for user with twitterId: ' + twitterId);
    return await this.CreateAccount(logger, null, null, twitterId);
  }

  // TODO: Add more options like GoogleID, FacebookID or TwitterID
  private static async CreateAccount(logger: AppLogger, mail?: string, passwordHash?: string, twitterId?: string) {
    const accountId = uuidv4();
    const authToken = uuidv4();

    const itemToCreate: any =  {
      ACCID: accountId,
      AUTHTK: authToken,
      VERF: false
    };

    if (mail) {
      itemToCreate.MAIL = mail;
      itemToCreate.PWHASH = passwordHash;
    } else if (twitterId) {
      itemToCreate.TWITID = twitterId;
    } else {
      throw new Error('Creating an account require a mail or a twitterId!');
    }

    const queryParams = {
      TableName: 'ACCOUNTS',
      Item: itemToCreate
    };

    const asyncResult = await to(DatabaseAccess.Put(logger, queryParams));

    if (asyncResult.error) {
      throw asyncResult.error;
    } else {
      logger.Info('Account created successfully: ' + JSON.stringify(asyncResult.result));
    }

    return itemToCreate;
  }

  public static async UpdateAccount(logger: AppLogger, accountId: string,
    fieldsToUpdate: object) {
    const updateParams: any = {
      TableName: 'ACCOUNTS',
      Key: { ACCID: accountId },
      ExpressionAttributeNames: {},
      ExpressionAttributeValues: {},
      UpdateExpression: 'SET ',
      ConditionExpression: 'attribute_exists(ACCID)'
    };

    let index: number = 0;
    for (const property in fieldsToUpdate) {
      if (fieldsToUpdate.hasOwnProperty(property)) {
        updateParams.ExpressionAttributeNames['#' + index] = property;
        updateParams.ExpressionAttributeValues[':' + index] = fieldsToUpdate[property];

        if (index > 0) {
          updateParams.UpdateExpression += ', ';
        }

        updateParams.UpdateExpression += '#' + index + ' = :' + index;

        index++;
      }
    }

    const asyncResult = await to(DatabaseAccess.Update(logger, updateParams));

    if (asyncResult.error) {
      if (asyncResult.error.code === 'ConditionalCheckFailedException') {
        return false;
      } else {
        throw asyncResult.error;
      }
    } else {
      logger.Info('Account item successfully update with: ' + JSON.stringify(fieldsToUpdate));
    }

    return true;
  }

  public static async StorePasswordResetToken(accountId: string) {
    if (!accountId) {
      return null;
    }

    const resetToken = uuidv4();
    const setResult = await to(CacheAccess.Set(this.GetResetTokenKey(accountId), resetToken, 900));

    if (setResult.error) {
      throw setResult.error;
    }

    return resetToken;
  }

  public static async GetPasswordResetToken(accountId: string) {
    if (!accountId) {
      return null;
    }

    const getResult = await to(CacheAccess.Get(this.GetResetTokenKey(accountId)));

    if (getResult.error) {
      throw getResult.error;
    }

    return getResult.result;
  }

  public static async InvalidatePasswordResetToken(accountId: string) {
    if (!accountId) {
      return false;
    }

    const getResult = await to(CacheAccess.Delete(this.GetResetTokenKey(accountId)));

    if (getResult.error) {
      throw getResult.error;
    }

    return getResult.result;
  }

  private static GetResetTokenKey(accountId: string) {
    return 'RESET-' + accountId;
  }

  private static AddQueryParams(params: any, indexName: string, queryValue: string, keyOnly: boolean) {
    params.IndexName = indexName;
    params.ExpressionAttributeNames = { '#key': indexName };
    params.ExpressionAttributeValues = { ':value': queryValue };
    params.KeyConditionExpression = '#key = :value';
    params.Limit = 1;

    if (keyOnly) {
      params.ProjectionExpression = indexName;
    }
  }
}
