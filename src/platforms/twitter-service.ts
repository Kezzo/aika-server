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

  public static async GetBaseProfile(logger: AppLogger, oauthToken: string, oauthVerifier: string) {
    logger.Info('Getting twitter profile!');
    const requestData = {
      url: this.twitterApiEndpoint + 'oauth/access_token' + '?oauth_verifier=' + oauthVerifier,
      method: 'POST'
    };

    const accessTokenRequestResult = await to(this.SendSignedAPIRequest(logger, requestData, {
      key: oauthToken
    }));

    if (!_.isNull(accessTokenRequestResult.error)) {
      throw accessTokenRequestResult.error;
    }

    return accessTokenRequestResult.result;
  }

  public static async GetFullUserProfile(logger: AppLogger, userId: string) {
    logger.Info('Getting full twitter profile of user id: ' + userId);
    const requestData = {
      url: this.twitterApiEndpoint + '1.1/users/show.json' + '?user_id=' + userId,
      method: 'GET'
    };

    const getUserAsyncResult = await to(this.SendSignedAPIRequest(logger, requestData, {}, true));

    if (!_.isNull(getUserAsyncResult.error)) {
      throw getUserAsyncResult.error;
    }

    return getUserAsyncResult.result;
  }

  private static async SendSignedAPIRequest(logger: AppLogger, requestData: any, token: object, isJSON?: boolean) {
    return new Promise((resolve, reject) => {

      const requestObject: any = {
        url: requestData.url,
        method: requestData.method,
        headers: this.oauthClient.toHeader(this.oauthClient.authorize(requestData, token))
      };

      if (requestData.method === 'POST') {
        requestObject.body =  requestData.body;
      }

      request(requestObject, (error, response, body) => {
        if (!_.isNull(error)) {
          error = 'Error response from signed twitter api request: ' + error;
          logger.Error(error);
          reject(error);
        }

        const responseObject = isJSON ? JSON.parse(body) : this.ParseResponseObject(body);

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
