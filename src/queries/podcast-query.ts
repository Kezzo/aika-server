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

  public static async GetEpisodes(logger: AppLogger, podcastId: string,
    lastReleaseTimestamp?: number, oldestReleaseTimestamp?: number) {
    if (!podcastId) {
      return null;
    }

    const params: any = {
      TableName: 'EPISODES'
    };

    DatabaseAccess.AddQueryParams(params, 'PID', podcastId, null, false, 100, true);

    // only one can be set at a time.
    if (lastReleaseTimestamp) {
      // Since the release timestamp is never changed this ensures secures non-duplicate pagination.
      DatabaseAccess.AddQuerySecondaryKeyCondition(params, 'RLSTS', lastReleaseTimestamp, '>');
    } else if (oldestReleaseTimestamp) {
      // Since the release timestamp is never changed this ensures secures non-duplicate pagination.
      DatabaseAccess.AddQuerySecondaryKeyCondition(params, 'RLSTS', oldestReleaseTimestamp, '<');
    }

    const asyncResult = await to(DatabaseAccess.Query(logger, params));

    if (asyncResult.error) {
      throw asyncResult.error;
    }

    return asyncResult.result;
  }

  public static async GetFollowedPodcastEntries(logger: AppLogger, accoundId: string, lastFollowTimestamp?: number) {

    const params: any = {
      TableName: 'FLWDPODCASTS'
    };

    DatabaseAccess.AddQueryParams(params, 'ACCID', accoundId, null, false, 100);

    if (lastFollowTimestamp) {
      // Since the followtimestamp is never changed (re-follow is new entry with new ts)
      // this ensures secures non-duplicate pagination.
      DatabaseAccess.AddQuerySecondaryKeyCondition(params, 'FLWTS', lastFollowTimestamp, '>');
    }

    const asyncResult = await to(DatabaseAccess.Query(logger, params));

    if (asyncResult.error) {
      throw asyncResult.error;
    }

    return asyncResult.result;
  }
}
