import _ = require('underscore');

import { DatabaseAccess } from '../common/db-access';
import { AppLogger } from '../logging/app-logger';
import to from '../utility/to';
import { AsyncResult } from '../utility/to';

export class PodcastQuery {
  public static async GetPodcasts(logger: AppLogger, podcastIds: string[]) {
    if (!podcastIds) {
      return null;
    }

    const keys = new Array();

    for (const podcastId of podcastIds) {
      keys.push({ PID: podcastId });
    }

    const params = {
      RequestItems: {
        PODCASTS: {
          Keys: keys
        }
      }
    };

    const asyncResult = await to(DatabaseAccess.GetMany(logger, params));

    if (asyncResult.error) {
      throw asyncResult.error;
    }

    return asyncResult.result.PODCASTS;
  }

  public static async GetFollowedPodcastIds(logger: AppLogger, accoundId: string) {

    const params: any = {
      TableName: 'FLWDPODCASTS'
    };

    // TODO: Add start from relevance sort key (greater than)
    DatabaseAccess.AddQueryParams(params, 'ACCID', accoundId, false, 40);

    const asyncResult = await to(DatabaseAccess.Query(logger, params));

    if (asyncResult.error) {
      throw asyncResult.error;
    }

    const podcastIds = _.pluck(asyncResult.result, 'PID');

    return podcastIds;
  }
}
