import httpStatus = require('http-status-codes');

import { AppLogger } from '../logging/app-logger';
import { PodcastError } from '../error-codes/podcast-error';
import { PodcastQuery } from '../queries/podcast-query';

export class PodcastController {
  public static async GetFollowedPodcasts(logger: AppLogger, accountId: string) {

    if (!accountId) {
      return {
        msg: {
          error: 'Account id is missing!',
          errorCode: PodcastError.ACCOUNT_ID_MISSING
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }
    // TODO: Add last pid from previous query for pagination.
    const followedPodcastIds = await PodcastQuery.GetFollowedPodcastIds(logger, accountId);

    // Account doesn't follow podcasts.
    if (!followedPodcastIds || followedPodcastIds.length === 0) {
      return {
        msg: '',
        statusCode: httpStatus.OK
      };
    }

    const followedPodcasts = await PodcastQuery.GetPodcasts(logger, followedPodcastIds);

    if (!followedPodcasts || followedPodcasts.length === 0) {
      throw Error('Podcasts with the ids: ' + JSON.stringify(followedPodcastIds) + 'couldn\'t be retrieved!');
    }

    return {
      msg: JSON.stringify(followedPodcasts),
      statusCode: httpStatus.OK
    };
  }
}
