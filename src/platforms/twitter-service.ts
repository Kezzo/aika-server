import * as OAuth from 'oauth-1.0a';

import crypto = require('crypto');
import request = require('request');
import _ = require('underscore');

import to from '../utility/to';
import { AppLogger } from '../logging/app-logger';
import { SecretsProvider } from '../common/secrets-provider';

export class TwitterService {
  private static oauthClient;
  private static twitterApiEndpoint = 'https://api.twitter.com/';

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
    const requestData = {
      url: this.twitterApiEndpoint + 'oauth/request_token',
      method: 'POST'
    };

    logger.Info('Getting OAuth token!');
    const loginTokenRequestResult = await to(this.SendSignedAPIRequest(logger, requestData, {}));

    if (!_.isNull(loginTokenRequestResult.error)) {
      throw loginTokenRequestResult.error;
    }

    logger.Info('Successfully got OAuth token: ' + loginTokenRequestResult.result.oauth_token);

    return loginTokenRequestResult.result.oauth_token;
  }

  public static async GetTwitterId(logger: AppLogger, oauthToken: string, oauthVerifier: string) {
    logger.Info('Getting twitter id!');
    const requestData = {
      url: this.twitterApiEndpoint + '/oauth/access_token' + '?oauth_verifier=' + oauthVerifier,
      method: 'POST'
    };

    const accessTokenRequestResult = await to(this.SendSignedAPIRequest(logger, requestData, {
      key: oauthToken
    }));

    if (!_.isNull(accessTokenRequestResult.error)) {
      throw accessTokenRequestResult.error;
    }

    return accessTokenRequestResult.result.user_id;
  }

  private static async SendSignedAPIRequest(logger: AppLogger, requestData: any, token: object) {
    return new Promise((resolve, reject) => {
      request({
        url: requestData.url,
        method: requestData.method,
        body: requestData.body,
        headers: this.oauthClient.toHeader(this.oauthClient.authorize(requestData, token))
      }, (error, response, body) => {
        if (!_.isNull(error)) {
          error = 'Error response from signed twitter api request: ' + error;
          logger.Error(error);
          reject(error);
        }

        const responseObject = this.ParseResponseObject(body);

        logger.Info('Successfully got response from signed twitter api request');

        resolve(responseObject);
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
