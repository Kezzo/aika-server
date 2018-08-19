import sendGridMailer = require('@sendgrid/mail');
import { SecretsProvider } from './secrets-provider';
import { EnvironmentHelper } from '../utility/environment-helper';
import { Environment } from '../utility/environment';
import { AppLogger } from '../logging/app-logger';

export class MailService {
  public static Init() {
    sendGridMailer.setApiKey(SecretsProvider.GetSecret('send-grid-api-key'));
  }

  public static async SendVerificationMail(logger: AppLogger, receiverMail: string, accountId: string) {
    const verificationLink = EnvironmentHelper.GetServerUrl() + '/account/verify?accountId=' + accountId;

    logger.Info('Sending verification mail to: ' + receiverMail + ' with accountId: ' + accountId);

    await sendGridMailer.send({
      to: receiverMail,
      from: 'support@tinkrinc.co',
      subject: 'Verify your Aika account!',
      // tslint:disable-next-line:max-line-length
      html: '<p>Hi! Thanks for creating an Aika account.</p>' +
      '<p>Please open the following link to verify your account:</p>' +
      '<a href="' + verificationLink + '">' + verificationLink + '</a>'
    });
  }

  public static async SendMagicLoginLink(logger: AppLogger, receiverMail: string, loginToken: string) {
    const loginPayload = {
      type: 'login',
      body: {
        mail: receiverMail,
        loginToken
      }
    };

    logger.Info('Sending magic login mail to: ' + receiverMail);

    const encodedPayload = Buffer.from(JSON.stringify(loginPayload)).toString('base64');
    const loginLink = EnvironmentHelper.GetServerUrl() + '/app?token=' + encodedPayload;

    await sendGridMailer.send({
      to: receiverMail,
      from: 'support@tinkrinc.co',
      subject: 'Login to your Aika account!',
      // tslint:disable-next-line:max-line-length
      html: '<p>Hi! Thanks for using Aika.</p>' +
      '<p>Please open the following link on the device with Aika to login into your account:</p>' +
      '<a clicktracking=off href="' + loginLink + '">' + loginLink + '</a>'
    });
  }

  public static async SendResetPasswordMail(logger: AppLogger, receiverMail: string, accountId: string, resetToken: string) {
    const passwordResetLink = this.GetEnvironmentBasedWebsiteUrl()
      + '?accountId=' + accountId + '?token=' + resetToken;

    logger.Info('Sending password reset mail to: ' + receiverMail + ' with accountId: ' + accountId);

    await sendGridMailer.send({
      to: receiverMail,
      from: 'support@tinkrinc.co',
      subject: 'Reset your Aika password!',
      // tslint:disable-next-line:max-line-length
      html: '<p>Hi! You requested to reset your Aika password.</p>' +
      '<p>Please open the following link to reset your password:</p>' +
      '<a href="' + passwordResetLink + '">' + passwordResetLink + '</a>' +
      '<p> If you didn\'t request a password reset just ignore this mail!'
    });
  }

  private static GetEnvironmentBasedWebsiteUrl() {
    switch (EnvironmentHelper.GetEnvironment()) {
    case Environment.LIVE:
      return 'https://tinkrinc.co/reset.html?live=true';
    case Environment.DEV:
      return 'https://tinkrinc.co/reset.html?dev=true';
    case Environment.LOCAL:
      return 'https://tinkrinc.co/reset.html?local=true';
    }
  }
}
