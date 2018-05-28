import _ = require('underscore');
import AWS = require('aws-sdk');

export class SecretsProvider {
  private static secretsMap = new Map();

  public static async LoadSecrets(secretsToLoad: string[]) {
    const secretsManagerClient = new AWS.SecretsManager({
      endpoint: 'https://secretsmanager.eu-west-1.amazonaws.com',
      region: 'eu-west-1'
    });

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
}
