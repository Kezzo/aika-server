import _ = require('underscore');
import bcrypt = require('bcryptjs');
import httpStatus = require('http-status-codes');

import to from '../utility/to';
import isMail from '../utility/is-mail';
import { AccountQuery } from '../queries/account-query';
import { AppLogger } from '../logging/app-logger';
import { AsyncResult } from '../utility/to';
import { AccountError } from '../error-codes/account-error';
import { MailService } from '../common/mail-service';

export class AccountController {
  public static async CreateAccount(logger: AppLogger, mail: string, password: string) {

    if (!isMail(mail)) {
      return {
        msg: {
          error: 'Mail has invalid format!',
          errorCode: AccountError.INVALID_MAIL_FORMAT
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    const accountData = await AccountQuery.GetAccount(logger, true, null, mail);

    if (!_.isNull(accountData) && !_.isUndefined(accountData)) {
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

    const verificationMailResult = await to(MailService.SendVerificationMail(
      mail, asyncResult.result.ACCID));

    if (!_.isNull(verificationMailResult.error)) {
      throw verificationMailResult.error;
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

  public static async VerifyAccount(logger: AppLogger, accountId: string) {
    if (_.isUndefined(accountId) || _.isNull(accountId) || accountId.length === 0) {
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
          errorCode: AccountError.ACCOUNT_DOESNT_EXISTS
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

    const accountData = await AccountQuery.GetAccount(logger, false, accountId, mail);

    if (_.isNull(accountData) || _.isUndefined(accountData)) {
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
      authSuccessful = _.isEqual(accountData.AUTHTK, authToken);
    } else if (!mailOrPasswordMissing) {
      authSuccessful = await bcrypt.compare(password, accountData.PWHASH);
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
      response.accountId = accountData.ACCID;
      response.authToken = accountData.AUTHTK;
    }

    return {
      msg: response,
      statusCode: httpStatus.OK
    };
  }

  public static async InitiatePasswordReset(logger: AppLogger, mail: string) {
    if (_.isUndefined(mail) || _.isNull(mail)) {
      return {
        msg: {
          error: 'Password reset requires mail of the account!',
          errorCode: AccountError.RESET_PARAMS_MISSING
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    const accountData = await AccountQuery.GetAccount(logger, false, null, mail);

    if (_.isUndefined(accountData) || _.isNull(accountData)) {
      return {
        msg: {
          error: 'Account doesn\'t exists!',
          errorCode: AccountError.ACCOUNT_DOESNT_EXISTS
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    const resetToken = await AccountQuery.StorePasswordResetToken(accountData.ACCID);

    if (_.isNull(resetToken)) {
      throw new Error('Reset token couldn\'nt be generated!');
    }

    const resetPasswordMailResult = await to(MailService.SendResetPasswordMail(
      mail, accountData.ACCID, resetToken));

    if (!_.isNull(resetPasswordMailResult.error)) {
      throw resetPasswordMailResult.error;
    }

    return {
      msg: '',
      statusCode: httpStatus.OK
    };
  }
}
