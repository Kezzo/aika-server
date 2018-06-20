import httpStatus = require('http-status-codes');
import _ = require('underscore');
import fetch from 'node-fetch';
import uuidv4 = require('uuid/v4');

import { AppLogger } from '../logging/app-logger';
import { PodcastError } from '../error-codes/podcast-error';
import { PodcastQuery } from '../queries/podcast-query';
import to, { AsyncResult } from '../utility/to';
import { CacheAccess } from '../common/cache-access';
import { PodcastTasks } from '../tasks/podcast-tasks';

export class PodcastController {
  public static async GetFollowedPodcasts(logger: AppLogger, accountId: string, lastFollowTimestampString?: string) {

    if (!accountId) {
      return {
        msg: {
          error: 'Account id is missing!',
          errorCode: PodcastError.ACCOUNT_ID_MISSING
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    let lastFollowTimestamp;
    if (lastFollowTimestampString) {
      const parsedInt = parseInt(lastFollowTimestampString, 10);

      if (parsedInt && !_.isNaN(parsedInt)) {
        lastFollowTimestamp = parsedInt;
      }
    }

    const followedPodcasts = await PodcastQuery.GetFollowedPodcastEntries(
      logger, accountId, lastFollowTimestamp);

    // Account doesn't follow podcasts.
    if (!followedPodcasts || followedPodcasts.length === 0) {
      return {
        msg: '',
        statusCode: httpStatus.OK
      };
    }

    const podcasts = await PodcastQuery.GetPodcasts(logger, _.pluck(followedPodcasts, 'PID'));

    if (!podcasts || podcasts.length === 0) {
      throw Error('Podcasts with the ids: ' + JSON.stringify(followedPodcasts) + 'couldn\'t be retrieved!');
    }

    let responseMessage: any;

    if (followedPodcasts) {
      responseMessage = PodcastController.GetPodcastResponseMessage(podcasts, followedPodcasts);
    } else {
      responseMessage = '';
    }

    return {
      msg: responseMessage,
      statusCode: httpStatus.OK
    };
  }

  public static async GetEpisodesFromPodcast(logger: AppLogger, podcastId: string,
    lastReleaseTimestampString?: string, oldestReleaseTimestampString?: string) {
    if (!podcastId) {
      return {
        msg: {
          error: 'Podcast id is missing!',
          errorCode: PodcastError.PODCAST_ID_MISSING
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    let lastReleaseTimestamp;
    if (lastReleaseTimestampString) {
      const parsedInt = parseInt(lastReleaseTimestampString, 10);

      if (parsedInt && !_.isNaN(parsedInt)) {
        lastReleaseTimestamp = parsedInt;
      }
    }

    let oldestReleaseTimestamp;
    if (oldestReleaseTimestampString) {
      const parsedInt = parseInt(oldestReleaseTimestampString, 10);

      if (parsedInt && !_.isNaN(parsedInt)) {
        oldestReleaseTimestamp = parsedInt;
      }
    }

    let episodes = await PodcastQuery.GetEpisodes(logger, podcastId, lastReleaseTimestamp, oldestReleaseTimestamp);

    let responseMessage = '';

    if (episodes) {
      episodes = _.map(episodes, (episode: any) => {
        return {
          podcastId: episode.PID,
          name: episode.NAME,
          description: episode.DESC,
          releaseTimestamp: episode.RLSTS,
          duration: episode.DRTN,
          audioUrl: episode.AUDURL,
          likedCount: episode.LKD
        };
      });

      responseMessage = episodes;
    }

    return {
      msg: responseMessage,
      statusCode: httpStatus.OK
    };
  }

  public static async StartPodcastImport(logger: AppLogger, accountId: string, podcastSourceIds: string[]) {
    const isArray = podcastSourceIds && _.isArray(podcastSourceIds);

    if (isArray) {
      podcastSourceIds = _.compact(podcastSourceIds);
    }

    if (!isArray || _.isEmpty(podcastSourceIds)) {
      return {
        msg: {
          error: 'Podcast sources id\'s are missing!',
          errorCode: PodcastError.PODCAST_SRC_IDS_MISSING
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    // 25 is dynamodb batchwrite limit
    if (podcastSourceIds.length > 25) {
      return {
        msg: {
          error: 'More than 25 podcast source id\'s were given!',
          errorCode: PodcastError.TOO_MANY_PODCAST_SRC_IDS
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    const existingPodcasts = await PodcastQuery.GetPodcastsBySourceId(logger, podcastSourceIds);

    let createdPodcastFollowEntries = new Array();

    if (existingPodcasts.length > 0) {
      createdPodcastFollowEntries = await PodcastQuery.CreatePodcastFollowEntries(logger, accountId, existingPodcasts);
    }

    if (existingPodcasts.length === podcastSourceIds.length) {
      return {
        msg: {
          existingPodcasts: PodcastController.GetPodcastResponseMessage(existingPodcasts, createdPodcastFollowEntries),
          podcastImports: ''
        },
        statusCode: httpStatus.OK
      };
    }

    const existingSourceIds = new Set(_.pluck(existingPodcasts, 'SRCID'));

    for (let i = podcastSourceIds.length - 1; i >= 0; i--) {
      const podcastSourceId = podcastSourceIds[i];

      // remove podcast source id's to import if they already exist in db.
      if (existingSourceIds.has(podcastSourceId)) {
        podcastSourceIds.splice(i, 1);
      }
    }

    let iTunesQuery = 'https://itunes.apple.com/lookup?id=';

    for (let i = 0; i < podcastSourceIds.length; i++) {
      const podcastSourceId = podcastSourceIds[i];

      iTunesQuery += podcastSourceId;

      // Add comma if it isn't last id.
      if (i < (podcastSourceIds.length - 1)) {
        iTunesQuery += ',';
      }
    }

    iTunesQuery += '&entity=podcast';

    logger.Info('Fetching podcast entries from iTunes: ' + JSON.stringify(podcastSourceIds));
    const iTunesQueryResult = await to(fetch(iTunesQuery));

    if (iTunesQueryResult.error) {
      throw iTunesQueryResult.error;
    }

    let unzipResult = await iTunesQueryResult.result.text();
    unzipResult = JSON.parse(unzipResult);

    if (!unzipResult || _.isEmpty(unzipResult.results)) {
      throw new Error('Podcast not found in iTunes: ' + unzipResult.error);
    }

    let podcastImportDataList = new Array();

    for (const podcastSourceId of podcastSourceIds) {
      const iTunesPodcastEntry = _.find(unzipResult.results, (entry: any) => {
        return entry.collectionId === podcastSourceId;
      });

      if (!iTunesPodcastEntry) {
        logger.Warn('Podcast with source id: ' + podcastSourceId + ' not returned by iTunes');
        continue;
      }

      if (!iTunesPodcastEntry.feedUrl) {
        logger.Warn('Podcast with source id: ' + podcastSourceId + ' doesn\'t have a feed url!');
        continue;
      }

      podcastImportDataList.push({
        source: 'itunes',
        sourceId: iTunesPodcastEntry.collectionId,
        feedUrl: iTunesPodcastEntry.feedUrl,
        podcastId: uuidv4()
      });
    }

    const podcastCacheSetResult = await to(CacheAccess.SetIfNotExistBatch(_.map(podcastImportDataList, (entry) => {
      return {
        key: 'IMPORT-' + entry.sourceId,
        value: ''
      };
    }), 900));

    if (podcastCacheSetResult.error) {
      throw podcastCacheSetResult.error;
    }

    podcastImportDataList = _.filter(podcastImportDataList, (entry) => {
      return podcastCacheSetResult.result.has('IMPORT-' + entry.sourceId);
    });

    const importStartPromises = new Array<Promise<AsyncResult>>();

    for (const podcastImportData of podcastImportDataList) {
      importStartPromises.push(to(PodcastTasks.InvokePodcastImport(logger, podcastImportData)));
    }

    const importStartedResults = await Promise.all(importStartPromises);

    for (const importStartedResult of importStartedResults) {
      if (importStartedResult.error) {
        logger.Error(importStartedResult.error);
      }
    }

    return {
      msg: {
        existingPodcasts: PodcastController.GetPodcastResponseMessage(existingPodcasts, createdPodcastFollowEntries),
        podcastImports: _.pluck(podcastImportDataList, 'podcastId')
      },
      statusCode: httpStatus.ACCEPTED
    };

  }

  private static GetPodcastResponseMessage(podcasts: any[], followedPodcasts: any[]) {
    const followedPodcastMap = new Map();

    for (const podcast of podcasts) {
      followedPodcastMap.set(podcast.PID, podcast);
    }

    const responseMessage = _.map(followedPodcasts, (followedPodcast: any) => {

      const podcastData = followedPodcastMap.get(followedPodcast.PID);

      if (!podcastData) {
        return null;
      }

      return {
        podcastId: followedPodcast.PID,
        name: podcastData.NAME,
        description: podcastData.DESC,
        author: podcastData.ATHR,
        authorUrl: podcastData.ATHRURL,
        genre: podcastData.GENRE,
        image: podcastData.IMG,
        source: podcastData.SRC,
        sourceId: podcastData.SRCID,
        sourceLink: podcastData.SRCL,
        followTimestamp: followedPodcast.FLWTS,
        lastPlayedTimestamp: followedPodcast.LUTS,
        playedCount: followedPodcast.PLAYD
      };
    });

    return _.compact(responseMessage);
  }
}
