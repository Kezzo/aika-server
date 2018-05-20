import sendGridMailer = require('@sendgrid/mail');
import { SecretsProvider } from './secrets-provider';

export class MailService {
  public static Init() {
    sendGridMailer.setApiKey(SecretsProvider.GetSecret('send-grid-api-key'));
  }

  public static async SendVerificationMail(receiverMail: string, accountId: string) {
    const verificationLink = this.GetEnvironmentBasedUrl() + '/account/verify?accountId=' + accountId;

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

  private static GetEnvironmentBasedUrl() {
    switch (process.env.NODE_ENV) {
    case 'DEV':
      return 'https://dev.aika.cloud.tinkrinc.co:443';
    case 'LOCAL':
      return 'http://localhost:3075';
    }
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
    switch (process.env.NODE_ENV) {
    case 'DEV':
      return 'https://tinkrinc.co/reset.html?dev=true';
    case 'LOCAL':
      return 'https://tinkrinc.co/reset.html?local=true';
    }
  }
}
