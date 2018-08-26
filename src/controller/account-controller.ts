import _ = require('underscore');
import bcrypt = require('bcryptjs');
import httpStatus = require('http-status-codes');
import uuidv4 = require('uuid/v4');

import to from '../utility/to';
import isMail from '../utility/is-mail';

import { OneTimeTokenService } from '../common/ott-service';
import { AccountQuery } from '../queries/account-query';
import { AppLogger } from '../logging/app-logger';
import { AsyncResult } from '../utility/to';
import { AccountError } from '../error-codes/account-error';
import { MailService } from '../common/mail-service';
import { TwitterService } from '../platforms/twitter-service';
import { CacheAccess } from '../common/cache-access';

export class AccountController {
  public static async CreateAccountFromMail(logger: AppLogger, mail: string, password: string) {

    if (!isMail(mail)) {
      return {
        msg: {
          error: 'Mail has invalid format!',
          errorCode: AccountError.INVALID_MAIL_FORMAT
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    if (!password || password.length < 8) {
      return {
        msg: {
          error: 'Password is missing or is too short!',
          errorCode: AccountError.INVALID_PASSWORD
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    const accountData = await AccountQuery.GetAccount(logger, true, null, mail);

    if (accountData) {
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

    if (asyncResult.error) {
      throw asyncResult.error;
    }

    const verificationMailResult = await to(MailService.SendVerificationMail(
      logger, mail, asyncResult.result.ACCID));

    if (verificationMailResult.error) {
      throw verificationMailResult.error;
    }

    const ott = await OneTimeTokenService.GenerateOTT(asyncResult.result.ACCID);

    const response = {
      userName: accountData.MAIL ? accountData.MAIL : accountData.USRNM,
      accountId: asyncResult.result.ACCID,
      authToken: asyncResult.result.AUTHTK,
      oneTimeToken: ott
    };

    return {
      msg: response,
      statusCode: httpStatus.CREATED
    };
  }

  public static async VerifyAccount(logger: AppLogger, accountId: string) {
    if (!accountId || accountId.length === 0) {
      return {
        msg: {
          error: 'The account verification requires an accountId!',
          errorCode: AccountError.VERF_ID_MISSING
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    const updateSuccesful = await AccountQuery.UpdateAccount(logger, accountId, { VERF: true });

    if (!updateSuccesful) {
      return {
        msg: {
          error: '<p> Account to verify doesn\'t exist!</p>',
          errorCode: AccountError.ACCOUNT_DOESNT_EXIST
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    } else {
      return {
        raw: '<p> Account verification successful!</p>',
        statusCode: httpStatus.OK
      };
    }
  }

  public static async LoginAccountViaMail(logger: AppLogger, mail: string, password: string) {
    if (!mail || !password) {
      return {
        msg: {
          error: 'Login via mail requires mail and password!',
          errorCode: AccountError.LOGIN_DETAILS_MISSING
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    return await this.LoginAccount(logger, null, mail, null, true, (accountData) => {
      return bcrypt.compare(password, accountData.PWHASH);
    });
  }

  public static async SendMagicLink(logger: AppLogger, mail: string) {
    if (!isMail(mail)) {
      return {
        msg: {
          error: 'Mail has invalid format!',
          errorCode: AccountError.INVALID_MAIL_FORMAT
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    let accountData = await AccountQuery.GetAccount(logger, false, null, mail);

    if (!accountData) {
      const asyncResult = await to(AccountQuery.CreateAccountFromMail(logger, mail));

      if (asyncResult.error) {
        throw asyncResult.error;
      }

      accountData = asyncResult.result;
    }

    const loginToken = uuidv4();
    const setResult = await to(CacheAccess.Set('ONE-TIME-LOGIN-' + accountData.ACCID, loginToken, 900));

    if (!_.isNull(setResult.error)) {
      throw setResult.error;
    }

    const sendMagicLinkMailResult = await to(MailService.SendMagicLoginLink(
      logger, mail, loginToken));

    if (sendMagicLinkMailResult.error) {
      throw sendMagicLinkMailResult.error;
    }

    return {
      msg: {},
      statusCode: httpStatus.CREATED
    };
  }

  public static async LoginAccountViaMagicLink(logger: AppLogger, mail: string, loginToken: string) {
    if (!mail || !loginToken) {
      return {
        msg: {
          error: 'Login via magic link requires mail and logintoken!',
          errorCode: AccountError.LOGIN_DETAILS_MISSING
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    const loginResult = await this.LoginAccount(logger, null, mail, null, true, (accountData) => {
      return this.IsLoginTokenValid(logger, accountData.ACCID, loginToken);
    });

    if (loginResult.statusCode === httpStatus.OK && loginResult.msg && loginResult.msg.accountId) {
      const accountId = loginResult.msg.accountId;

      const updateSuccesful = await AccountQuery.UpdateAccount(logger, accountId, {
        VERF: true
      });

      if (!updateSuccesful) {
        logger.Error('Account update unsuccessful!');
      }

      const deleteAsyncResult = await to(CacheAccess.Delete('ONE-TIME-LOGIN-' + accountId));

      if (deleteAsyncResult.error) {
        logger.Error(deleteAsyncResult.error);
      }
    }

    return loginResult;
  }

  private static async IsLoginTokenValid(logger: AppLogger, accountId, loginToken: string) {
    const getAsyncResult = await to(CacheAccess.Get('ONE-TIME-LOGIN-' + accountId));

    if (getAsyncResult.error) {
      throw JSON.stringify(getAsyncResult.error);
    }

    return getAsyncResult.result && getAsyncResult.result === loginToken;
  }

  public static async LoginAccountViaAuthToken(logger: AppLogger, accountId: string, authToken: string) {
    if (!accountId || !authToken) {
      return {
        msg: {
          error: 'Login requires accountId and authToken!',
          errorCode: AccountError.LOGIN_DETAILS_MISSING
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    return await this.LoginAccount(logger, accountId, null, null, false, (accountData) => {
      return new Promise((resolve) => {
        resolve(_.isEqual(accountData.AUTHTK, authToken));
      });
    });
  }

  private static async LoginAccount(logger: AppLogger, accountId: string, mail: string, twitterId: string,
    isInitialSignIn: boolean, authVerificationCallback: (accountData) => Promise<boolean>) {
    const accountData = await AccountQuery.GetAccount(logger, false, accountId, mail, twitterId);

    if (!accountData) {
      return {
        msg: {
          error: 'Account doesn\'t exist!',
          errorCode: AccountError.ACCOUNT_DOESNT_EXIST
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    let authSuccessful: boolean = false;

    if (authVerificationCallback) {
      authSuccessful = await authVerificationCallback(accountData);
    }

    if (!authSuccessful) {
      return {
        msg: {
          error: 'Authentication parameters are not correct!',
          errorCode: AccountError.AUTH_PARAM_INCORRECT
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    const ott = await OneTimeTokenService.GenerateOTT(accountData.ACCID);

    const response: any = {
      oneTimeToken: ott
    };

    if (isInitialSignIn) {
      response.userName = accountData.MAIL ? accountData.MAIL : accountData.USRNM;
      response.accountId = accountData.ACCID;
      response.authToken = accountData.AUTHTK;
    }

    return {
      msg: response,
      statusCode: httpStatus.OK
    };
  }

  public static async LoginAccountViaTwitterAuth(logger: AppLogger, oauthToken: string, oauthVerifier: string) {
    if (!oauthToken || !oauthVerifier) {
      return {
        msg: {
          error: 'OauthToken or OauthVerifier missing!',
          errorCode: AccountError.TWITTER_AUTH_PARAMS_MISSING
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    // TODO: Also get access tokens and store them!
    const twitterProfile = await TwitterService.GetTwitterProfile(logger, oauthToken, oauthVerifier);

    if (!twitterProfile) {
      return {
        msg: {
          error: 'Couldn\'t retrieve twitter profile with given tokens!',
          errorCode: AccountError.TWITTER_AUTH_FAILED
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    let accountData = await AccountQuery.GetAccount(logger, false, null, null, twitterProfile.user_id);

    if (!accountData) {
      const asyncResult = await to(AccountQuery.CreateAccountFromTwitterProfile(logger, twitterProfile));

      if (asyncResult.error) {
        throw asyncResult.error;
      }

      accountData = asyncResult.result;
    }
    const ott = await OneTimeTokenService.GenerateOTT(accountData.ACCID);

    const response = {
      userName: accountData.USRNM,
      accountId: accountData.ACCID,
      authToken: accountData.AUTHTK,
      oneTimeToken: ott
    };

    return {
      msg: response,
      statusCode: httpStatus.OK
    };
  }

  public static async InitiatePasswordReset(logger: AppLogger, mail: string) {
    if (!mail) {
      return {
        msg: {
          error: 'Password reset requires mail of the account!',
          errorCode: AccountError.RESET_PARAMS_MISSING
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    const accountData = await AccountQuery.GetAccount(logger, false, null, mail);

    if (!accountData) {
      return {
        msg: {
          error: 'Account doesn\'t exists!',
          errorCode: AccountError.ACCOUNT_DOESNT_EXIST
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    const resetToken = await AccountQuery.StorePasswordResetToken(accountData.ACCID);

    if (!resetToken) {
      throw new Error('Reset token couldn\'nt be generated!');
    }

    const resetPasswordMailResult = await to(MailService.SendResetPasswordMail(
      logger, mail, accountData.ACCID, resetToken));

    if (resetPasswordMailResult.error) {
      throw resetPasswordMailResult.error;
    }

    return {
      msg: {},
      statusCode: httpStatus.OK
    };
  }

  public static async CompletePasswordReset(logger: AppLogger, accountId: string,
    resetToken: string, newPassword: string) {
    if (!accountId || !resetToken) {
      return {
        msg: {
          error: 'Password reset completion requires an accounId and the valid reset token!',
          errorCode: AccountError.RESET_PARAMS_MISSING
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    if (!newPassword || newPassword.length < 8) {
      return {
        msg: {
          error: 'Password is missing or is too short!',
          errorCode: AccountError.INVALID_PASSWORD
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    const storedResetToken = await AccountQuery.GetPasswordResetToken(accountId);

    if (!_.isEqual(resetToken, storedResetToken)) {
      return {
        msg: {
          error: 'Password reset token is invalid or has ran out!',
          errorCode: AccountError.RESET_TOKEN_INVALID
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    const accountData = await AccountQuery.GetAccount(logger, false, accountId, null);

    if (!accountData) {
      return {
        msg: {
          error: 'Account doesn\'t exists!',
          errorCode: AccountError.ACCOUNT_DOESNT_EXIST
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    const isOldPassword = await bcrypt.compare(newPassword, accountData.PWHASH);

    if (isOldPassword) {
      return {
        msg: {
          error: 'The new password can\'t be the old one!',
          errorCode: AccountError.NEW_PASSWORD_IS_OLD
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const authToken = uuidv4();

    const updateSuccesful = await AccountQuery.UpdateAccount(logger, accountId, {
      PWHASH: passwordHash,
      AUTHTK: authToken,
      VERF: true
    });

    if (!updateSuccesful) {
      throw new Error('Account update unsuccessful!');
    }

    await AccountQuery.InvalidatePasswordResetToken(accountId);
    await OneTimeTokenService.InvalidateOTT(accountData.ACCID);

    return {
      msg: 'Password has been successfully reset!',
      statusCode: httpStatus.OK
    };
  }
}
