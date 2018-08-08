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
        DatabaseAccess.AddQueryParams(params, 'MAIL', mail, 'MAIL', keyOnly);
      } else if (twitterId) {
        DatabaseAccess.AddQueryParams(params, 'TWITID', twitterId, 'TWITID', keyOnly);
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

  public static async CreateAccountFromMail(logger: AppLogger, mail: string, passwordHash?: string) {
    logger.Info('Creating account for user with mail: ' + mail);
    return await this.CreateAccount(logger, mail, passwordHash);
  }

  public static async CreateAccountFromTwitterProfile(logger: AppLogger, twitterProfile: object) {
    logger.Info('Creating account for user with twitterProfile: ' + twitterProfile);
    return await this.CreateAccount(logger, null, null, twitterProfile);
  }

  // TODO: Add more options like GoogleID & FacebookID
  private static async CreateAccount(logger: AppLogger, mail?: string,
    passwordHash?: string, twitterProfile?: any) {
    const accountId = uuidv4();
    const authToken = uuidv4();

    const itemToCreate: any =  {
      ACCID: accountId,
      AUTHTK: authToken,
      VERF: false
    };

    if (mail) {
      itemToCreate.MAIL = mail;

      if (passwordHash) {
        itemToCreate.PWHASH = passwordHash;
      }

      itemToCreate.USRNM = mail.split('@')[0];

    } else if (twitterProfile) {
      itemToCreate.TWITID = twitterProfile.user_id;
      itemToCreate.USRNM = twitterProfile.screen_name;
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
      ConditionExpression: 'attribute_exists(ACCID)'
    };

    DatabaseAccess.AddUpdateParams(updateParams, fieldsToUpdate);

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
}
