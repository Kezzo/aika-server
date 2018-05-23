import _ = require('underscore');
import bcrypt = require('bcryptjs');
import httpStatus = require('http-status-codes');
import uuidv4 = require('uuid/v4');

import to from '../utility/to';
import isMail from '../utility/is-mail';

import { OneTimeTokenProvider } from '../common/ott-provider';
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

    if (_.isNull(password) || _.isUndefined(password) || password.length < 8) {
      return {
        msg: {
          error: 'Password is missing or is too short!',
          errorCode: AccountError.INVALID_PASSWORD
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

    const ott = await OneTimeTokenProvider.GenerateOTT(asyncResult.result.ACCID);

    const response = {
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

    const ott = await OneTimeTokenProvider.GenerateOTT(accountData.ACCID);

    const response: any = {
      oneTimeToken: ott
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

  public static async CompletePasswordReset(logger: AppLogger, accountId: string,
    resetToken: string, newPassword: string) {
    if ((_.isUndefined(accountId) || _.isNull(accountId)) ||
        (_.isUndefined(resetToken) || _.isNull(resetToken))) {
      return {
        msg: {
          error: 'Password reset completion requires an accounId and the valid reset token!',
          errorCode: AccountError.RESET_PARAMS_MISSING
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    if (_.isNull(newPassword) || _.isUndefined(newPassword) || newPassword.length < 8) {
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

    if (_.isUndefined(accountData) || _.isNull(accountData)) {
      return {
        msg: {
          error: 'Account doesn\'t exists!',
          errorCode: AccountError.ACCOUNT_DOESNT_EXISTS
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

    // TODO: Delete existing OTT, user is forced to do a new login anyway so OTT is generated again.

    return {
      msg: 'Password has been successfully reset!',
      statusCode: httpStatus.OK
    };
  }
}
