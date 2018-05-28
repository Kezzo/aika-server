import _ = require('underscore');
import httpStatus = require('http-status-codes');

import { Platform } from '../platforms/platforms';
import { TwitterService } from '../platforms/twitter-service';
import { AppLogger } from '../logging/app-logger';
import to, { AsyncResult } from '../utility/to';

export class PlatformController {
  public static async GetLoginToken(logger: AppLogger, platform: Platform) {
    let getLoginTokenResult: AsyncResult;
    switch (platform) {
    case Platform.Twitter:
      getLoginTokenResult = await to(TwitterService.GetOAuthToken(logger));
      break;
    default:
      getLoginTokenResult.error = 'Platform: ' + platform + 'is not implemented!';
      break;
    }

    if (!_.isNull(getLoginTokenResult.error)) {
      throw getLoginTokenResult.error;
    }

    if (_.isNull(getLoginTokenResult.result) || _.isUndefined(getLoginTokenResult.result)) {
      throw new Error('Received login token from ' + platform + ' is null or undefined!');
    }

    return {
      msg: getLoginTokenResult.result,
      statusCode: httpStatus.OK
    };
  }
}
