import _ = require('underscore');
import AWS = require('aws-sdk');
import { EnvironmentHelper } from '../utility/environment-helper';
import { Environment } from '../utility/environment';

export class SecretsProvider {
  private static secretsMap = new Map();

  public static async LoadSecrets(secretsToLoad: string[]) {
    const secretsManagerClient = new AWS.SecretsManager(SecretsProvider.GetConfig());

    for (const secretName of secretsToLoad) {
      const getSecretResponse = await secretsManagerClient.getSecretValue({SecretId: secretName}).promise();

      if (!_.isNull(getSecretResponse.$response.error)) {
        throw getSecretResponse.$response.error;
      }

      const secretJSON = JSON.parse(getSecretResponse.SecretString);

      if (_.isUndefined(secretJSON[secretName]) || _.isNull(secretJSON[secretName])) {
        this.secretsMap.set(secretName, secretJSON);
      } else {
        this.secretsMap.set(secretName, secretJSON[secretName]);
      }
    }
  }

  public static GetSecret(secretName: string) {
    return this.secretsMap.get(secretName);
  }

  private static GetConfig() {
    switch (EnvironmentHelper.GetEnvironment()) {
    case Environment.LIVE:
      return {
        endpoint: 'https://secretsmanager.us-east-1.amazonaws.com',
        region: 'us-east-1'
      };
    case Environment.DEV:
      return {
        endpoint: 'https://secretsmanager.eu-west-1.amazonaws.com',
        region: 'eu-west-1'
      };
    case Environment.LOCAL:
      return {
        endpoint: 'https://secretsmanager.eu-west-1.amazonaws.com',
        region: 'eu-west-1'
      };
    }
  }
}
