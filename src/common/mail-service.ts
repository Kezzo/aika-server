import sendGridMailer = require('@sendgrid/mail');
import { SecretsProvider } from './secrets-provider';
import { EnvironmentHelper } from '../utility/environment-helper';
import { Environment } from '../utility/environment';

export class MailService {
  public static Init() {
    sendGridMailer.setApiKey(SecretsProvider.GetSecret('send-grid-api-key'));
  }

  public static async SendVerificationMail(receiverMail: string, accountId: string) {
    const verificationLink = EnvironmentHelper.GetServerUrl() + '/account/verify?accountId=' + accountId;

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

  public static async SendResetPasswordMail(receiverMail: string, accountId: string, resetToken: string) {
    const passwordResetLink = this.GetEnvironmentBasedWebsiteUrl()
      + '?accountId=' + accountId + '?token=' + resetToken;

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
    case Environment.DEV:
      return 'https://tinkrinc.co/reset.html?dev=true';
    case Environment.LOCAL:
      return 'https://tinkrinc.co/reset.html?local=true';
    }
  }
}
