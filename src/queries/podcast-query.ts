import _ = require('underscore');
import moment = require('moment');

import { DatabaseAccess } from '../common/db-access';
import { AppLogger } from '../logging/app-logger';
import to, { AsyncResult } from '../utility/to';

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

  public static async GetPodcastsBySourceId(logger: AppLogger, podcastSourceIds: string[]) {
    if (!podcastSourceIds) {
      return null;
    }

    const queryPromises = new Array();

    for (const podcastSourceId of podcastSourceIds) {
      const params: any = {
        TableName: 'PODCASTS'
      };

      DatabaseAccess.AddQueryParams(params, 'SRCID', podcastSourceId.toString(), 'SRCID', false, 1);
      queryPromises.push(to(DatabaseAccess.Query(logger, params)));
    }

    const asyncResults = await Promise.all<AsyncResult>(queryPromises);

    for (const asyncResult of asyncResults) {
      if (asyncResult.error) {
        throw asyncResult.error;
      }
    }

    let results = _.pluck(asyncResults, 'result');
    results = _.filter(results, (entry) => {
      return entry.length > 0;
    });

    return results;
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

  public static async GetFollowedPodcastEntries(logger: AppLogger, accountId: string, lastFollowTimestamp?: number) {

    const params: any = {
      TableName: 'FLWDPODCASTS'
    };

    DatabaseAccess.AddQueryParams(params, 'ACCID', accountId, null, false, 100);

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

  public static async CreatePodcastFollowEntries(logger: AppLogger, accountId: string, podcastIds: string[]) {
    const isArray = podcastIds && _.isArray(podcastIds);

    if (isArray) {
      podcastIds = _.compact(podcastIds);
    }

    if (!isArray || _.isEmpty(podcastIds)) {
      throw new Error('Given podcastIds are missing or empty!');
    }

    const itemsToCreate = new Array();
    const utcTimestamp = moment.utc().format('X');

    for (const podcastId of podcastIds) {
      itemsToCreate.push({
        PutRequest: {
          ACCID: accountId,
          FLWTS: utcTimestamp,
          PID: podcastId
        }
      });
    }

    const putParams = {
      RequestItems: {
        ACCOUNTS: itemsToCreate
      }
    };

    const asyncResult = await to(DatabaseAccess.WriteMany(logger, putParams));

    if (asyncResult.error) {
      throw asyncResult.error;
    }

    return _.pluck(itemsToCreate, 'PutRequest');
  }
}
