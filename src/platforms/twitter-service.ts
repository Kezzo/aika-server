import * as OAuth from 'oauth-1.0a';

import crypto = require('crypto');
import request = require('request');
import _ = require('underscore');

import to from '../utility/to';
import { url } from 'inspector';
import { AppLogger } from '../logging/app-logger';
import { SecretsProvider } from '../common/secrets-provider';

export class TwitterService {
  private static oauthClient;

  public static Init() {
    const apiKeys = SecretsProvider.GetSecret('aika-twitter-api-keys');

    this.oauthClient = new OAuth({
      consumer: {
        key: apiKeys['aika-twitter-consumer-key'],
        secret: apiKeys['aika-twitter-secret-key']
      },
      realm: '',
      signature_method: 'HMAC-SHA1',
      hash_function(baseString, key) {
        return crypto.createHmac('sha1', key).update(baseString).digest('base64');
      }
    });
  }

  public static async GetOAuthToken(logger: AppLogger) {
    return new Promise((resolve, reject) => {
      const requestData = {
        url: 'https://api.twitter.com/oauth/request_token',
        method: 'POST'
      };

      logger.Info('Getting OAuth token!');

      request({
        url: requestData.url,
        method: requestData.method,
        headers: this.oauthClient.toHeader(this.oauthClient.authorize(requestData, {}))
      }, (error, response, body) => {
        if (!_.isNull(error)) {
          error = 'Error getting OAuth token: ' + error;
          logger.Error(error);
          reject(error);
        }

        const responseObject = this.ParseResponseObject(body);

        logger.Info('Successfully got OAuth token: ' + responseObject.oauth_token);

        resolve(responseObject.oauth_token);
      });
    });
  }

  private static ParseResponseObject(responseBody: string) {
    const responseObject: any = {};

    const responseEntries = responseBody.split('&');

    for (const responseEntry of responseEntries) {
      const keyValuePair = responseEntry.split('=');

      if (keyValuePair.length === 2) {
        responseObject[keyValuePair[0]] = keyValuePair[1];
      }
    }

    return responseObject;
  }
}
