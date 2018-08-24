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
import { EnvironmentHelper } from '../utility/environment-helper';
import { StaticFileAccess } from '../common/static-file-access';

export class PodcastController {

  public static async GetPodcast(logger: AppLogger, podcastId: string) {
    if (!podcastId) {
      return {
        msg: {
          error: 'Podcast id is missing!',
          errorCode: PodcastError.PODCAST_ID_MISSING
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    const podcast = await PodcastQuery.GetPodcast(logger, podcastId);

    if (!podcast) {
      return {
        msg: {
          error: 'Podcast with id: ' + podcastId + ' was not found!',
          errorCode: PodcastError.PODCAST_NOT_FOUND
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    let responseMessage;

    if (podcast) {
      responseMessage = PodcastController.GetPodcastResponseMessage([podcast], null);
      if (responseMessage && _.isArray(responseMessage) && responseMessage.length > 0) {
        responseMessage = responseMessage[0];
      }

    } else {
      responseMessage = '';
    }

    return {
      msg: responseMessage,
      statusCode: httpStatus.OK
    };
  }

  public static async GetEpisode(logger: AppLogger, episodeId: string) {
    if (!episodeId) {
      return {
        msg: {
          error: 'Episode id is missing!',
          errorCode: PodcastError.EPISODE_ID_MISSING
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    const episode = await PodcastQuery.GetEpisode(logger, episodeId);

    if (!episode) {
      return {
        msg: {
          error: 'Episode with id: ' + episodeId + ' was not found!',
          errorCode: PodcastError.EPISODE_NOT_FOUND
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    let responseMessage;

    if (episode) {
      responseMessage = PodcastController.GetEpisodeResponseMessage([episode]);
      if (responseMessage && _.isArray(responseMessage) && responseMessage.length > 0) {
        responseMessage = responseMessage[0];
      }

    } else {
      responseMessage = '';
    }

    return {
      msg: responseMessage,
      statusCode: httpStatus.OK
    };
  }

  public static async FollowPodcast(logger: AppLogger, accountId: string, podcastId: string) {
    if (!accountId) {
      return {
        msg: {
          error: 'Account id is missing!',
          errorCode: PodcastError.ACCOUNT_ID_MISSING
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    if (!podcastId) {
      return {
        msg: {
          error: 'Podcast id is missing!',
          errorCode: PodcastError.PODCAST_ID_MISSING
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    await PodcastQuery.CreatePodcastFollowEntries(logger, accountId, [podcastId]);

    return {
      msg: {},
      statusCode: httpStatus.OK
    };
  }

  public static async UnfollowPodcast(logger: AppLogger, accountId: string, podcastId: string) {
    if (!accountId) {
      return {
        msg: {
          error: 'Account id is missing!',
          errorCode: PodcastError.ACCOUNT_ID_MISSING
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    if (!podcastId) {
      return {
        msg: {
          error: 'Podcast id is missing!',
          errorCode: PodcastError.PODCAST_ID_MISSING
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    const podcastFollowEntry = await PodcastQuery.GetPodcastFollowEntry(logger, accountId, podcastId);

    if (!podcastFollowEntry) {
      return {
        msg: {
          error: 'Podcast follow entry wasn\'t found!',
          errorCode: PodcastError.PODCAST_FOLLOW_ENTRY_NOT_FOUND
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    await PodcastQuery.RemovePodcastFollowEntry(logger, podcastFollowEntry.ACCID, podcastFollowEntry.FLWTS);

    return {
      msg: {},
      statusCode: httpStatus.OK
    };
  }

  public static async GetFollowedPodcasts(logger: AppLogger, accountId: string, nextToken?: string) {

    if (!accountId) {
      return {
        msg: {
          error: 'Account id is missing!',
          errorCode: PodcastError.ACCOUNT_ID_MISSING
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    let oldestFollowTimestamp;
    if (nextToken) {
      const decodedToken = Buffer.from(nextToken, 'base64').toString('utf8');
      const parsedInt = parseInt(decodedToken, 10);

      if (parsedInt && !_.isNaN(parsedInt)) {
        oldestFollowTimestamp = parsedInt;
      }
    }

    const followedPodcasts = await PodcastQuery.GetFollowedPodcastEntries(
      logger, accountId, oldestFollowTimestamp);

    // Account doesn't follow podcasts.
    if (!followedPodcasts || followedPodcasts.length === 0) {
      return {
        msg: {
          result: []
        },
        statusCode: httpStatus.OK
      };
    }

    const nextOldestFollowTimestamp = followedPodcasts[followedPodcasts.length - 1].FLWTS;
    const nextNextToken = Buffer.from(nextOldestFollowTimestamp.toString()).toString('base64');

    for (const followedPodcast of followedPodcasts) {
      followedPodcast.FLWTS = Math.trunc(followedPodcast.FLWTS / 100000);
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
      msg: {
        result: responseMessage,
        nextToken: nextNextToken
      },
      statusCode: httpStatus.OK
    };
  }

  public static async GetLatestTopPodcastEpisodes(logger: AppLogger, nextToken: string) {
    return await PodcastController.GetLatestTopPodcastEpisodesResponse(logger, nextToken);
  }

  public static async GetFollowedPodcastFeed(logger: AppLogger, accountId: string, nextToken: string) {
    if (!accountId) {
      return {
        msg: {
          error: 'Account id is missing!',
          errorCode: PodcastError.ACCOUNT_ID_MISSING
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    const podcastFeedCacheKey = 'NEW_EPISODES_FEED_' + accountId;
    let timeToLiveForList = 86400;
    let followedPodcastFeedNextToken = nextToken;

    if (!followedPodcastFeedNextToken) {
      await CacheAccess.Delete(podcastFeedCacheKey);
    } else {
      const getTimeToLiveAsyncResult = await to(CacheAccess.GetTimeToLive(podcastFeedCacheKey));

      if (getTimeToLiveAsyncResult.error) {
        throw getTimeToLiveAsyncResult.error;
      }

      // cache entry not existant or too old.
      if (getTimeToLiveAsyncResult.result === -1 || getTimeToLiveAsyncResult.result === -2 ||
        getTimeToLiveAsyncResult.result < 10) {
        followedPodcastFeedNextToken = null;
      } else {
        timeToLiveForList = getTimeToLiveAsyncResult.result;
      }
    }

    const entriesPerPage = 20;
    let decodedToken: any = {};
    if (followedPodcastFeedNextToken) {
      decodedToken = JSON.parse(Buffer.from(followedPodcastFeedNextToken, 'base64').toString('utf8'));
    }

    let followEntries = [];

    if (!followedPodcastFeedNextToken || (followedPodcastFeedNextToken && decodedToken && decodedToken.oldestFollowTimestamp)) {
      followEntries = await PodcastQuery.GetFollowedPodcastEntries(logger, accountId,
        decodedToken.oldestFollowTimestamp, entriesPerPage);
    }

    const entriesToGetFromCache = entriesPerPage - followEntries.length;
    let episodesFromCache: any = [];

    if (followedPodcastFeedNextToken && entriesToGetFromCache > 0) {
      const popAsyncResult = await to(CacheAccess.PopFromStartOfList(podcastFeedCacheKey, entriesToGetFromCache));

      if (popAsyncResult.error) {
        throw popAsyncResult.error;
      }

      episodesFromCache = _.map(popAsyncResult.result, (entry: string) => {
        return entry ? JSON.parse(entry) : null;
      });

      episodesFromCache = _.compact(episodesFromCache);
    }

    if (followEntries.length === 0 && episodesFromCache.length === 0) {
      return await PodcastController.GetLatestTopPodcastEpisodesResponse(logger, nextToken);
    }

    const episodesPerPodcast = Math.max(1, Math.round(entriesPerPage / (followEntries.length + episodesFromCache.length)));

    let nextNextToken: any = {};

    if (followEntries.length === entriesPerPage) {
      nextNextToken.oldestFollowTimestamp = followEntries[followEntries.length - 1].FLWTS;
    }

    const getEpisodesPromises = [];

    for (const followEntry of followEntries) {
      getEpisodesPromises.push(PodcastQuery.GetEpisodesOfPodcast(logger,
        followEntry.PID, null, Number.MAX_SAFE_INTEGER, episodesPerPodcast));
    }

    for (const episodeFromCache of episodesFromCache) {
      getEpisodesPromises.push(PodcastQuery.GetEpisodesOfPodcast(logger,
        episodeFromCache.PID, null, episodeFromCache.INDEX, episodesPerPodcast));
    }

    const episodeAsyncResults = await Promise.all(getEpisodesPromises);

    let episodes = [];
    const episodesToAddToCache = [];

    for (const episodeAsyncResult of episodeAsyncResults) {

      const oldestEpisode = episodeAsyncResult[episodeAsyncResult.length - 1];

      if (oldestEpisode.INDEX > 0) {
        episodesToAddToCache.push(JSON.stringify({
          PID: oldestEpisode.PID,
          INDEX: oldestEpisode.INDEX
        }));
      }

      episodes.push(...episodeAsyncResult);
    }

    if (episodesToAddToCache.length > 0) {
      const addToListAsyncResult = await to(CacheAccess.AddItemsToList(podcastFeedCacheKey, episodesToAddToCache));

      if (addToListAsyncResult.error) {
        throw addToListAsyncResult.error;
      }

      // we have to do it every request, because list could've been empty and therefore removed and lost its TTL.
      const setTimeToLiveAsyncResult = await to(CacheAccess.SetTimeToLive(podcastFeedCacheKey, timeToLiveForList));

      if (setTimeToLiveAsyncResult.error) {
        throw setTimeToLiveAsyncResult.error;
      }

    } else {
      // returned all episodes of all followed podcasts
      nextNextToken = null;
    }

    // sort descending
    episodes = _.sortBy(episodes, (episode) => {
      return -episode.RLSTS;
    });

    const responseMessage = episodes ? this.GetEpisodeResponseMessage(episodes) : [];
    const nextTokenString = nextNextToken ? Buffer.from(JSON.stringify(nextNextToken)).toString('base64') : null;

    return {
      msg: {
        type: 'feed',
        result: responseMessage,
        nextToken: nextTokenString,
        isFirstPage: nextToken ? false : true
      },
      statusCode: httpStatus.OK
    };
  }

  public static async GetEpisodesFromPodcast(logger: AppLogger, podcastId: string,
    biggestIndexString?: string, smallestIndexString?: string) {
    if (!podcastId) {
      return {
        msg: {
          error: 'Podcast id is missing!',
          errorCode: PodcastError.PODCAST_ID_MISSING
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    let biggestIndex;
    if (biggestIndexString) {
      const parsedInt = parseInt(biggestIndexString, 10);

      if (parsedInt && !_.isNaN(parsedInt)) {
        biggestIndex = parsedInt;
      }
    }

    let smallestIndex;
    if (smallestIndexString) {
      const parsedInt = parseInt(smallestIndexString, 10);

      if (parsedInt && !_.isNaN(parsedInt)) {
        smallestIndex = parsedInt;
      }
    }

    const episodes = await PodcastQuery.GetEpisodesOfPodcast(logger,
      podcastId, biggestIndex, smallestIndex, 100);
    const responseMessage = episodes ? this.GetEpisodeResponseMessage(episodes) : [];

    return {
      msg: responseMessage,
      statusCode: httpStatus.OK
    };
  }

  public static async StartPodcastImportForAccount(logger: AppLogger, accountId: string, podcastSourceIds: string[]) {
    if (!accountId) {
      return {
        msg: {
          error: 'Account id is missing!',
          errorCode: PodcastError.ACCOUNT_ID_MISSING
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    return await this.StartPodcastImport(logger, accountId, podcastSourceIds);
  }

  public static async StartRawPodcastImport(logger: AppLogger, importSecret: string, podcastSourceIds: string[]) {
    if (importSecret !== 'dca0e160-6337-4f71-9fb4-5c1373bccd36') {
      return {
        msg: {
          error: 'Import secret is incorrect!',
          errorCode: PodcastError.PODCAST_IMPORT_SECRET_INVALID
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    return await this.StartPodcastImport(logger, null, podcastSourceIds);
  }

  private static async StartPodcastImport(logger: AppLogger, accountId: string, podcastSourceIds: string[]) {
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
    let createdPodcastFollowEntries = [];

    if (existingPodcasts.length === podcastSourceIds.length) {
      if (accountId && existingPodcasts.length > 0) {
        createdPodcastFollowEntries = await PodcastQuery.CreatePodcastFollowEntries(logger, accountId, _.pluck(existingPodcasts, 'PID'));
      }

      logger.Info('All podcasts are already imported. Responding early!');

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
      if (existingSourceIds.has(podcastSourceId.toString())) {
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

    logger.Info('Fetching podcast entries from iTunes: ' + JSON.stringify(podcastSourceIds) +
      ' with url: ' + iTunesQuery);
    const iTunesQueryResult = await to(fetch(iTunesQuery));

    if (iTunesQueryResult.error) {
      throw iTunesQueryResult.error;
    }

    let unzipResult = await iTunesQueryResult.result.text();

    logger.Info('Received podcast import data from iTunes: ' + unzipResult);

    unzipResult = JSON.parse(unzipResult);

    if (!unzipResult || _.isEmpty(unzipResult.results)) {
      throw new Error('Podcast not found in iTunes: ' + unzipResult.error);
    }

    let podcastImportDataList = [];

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
        podcastId: uuidv4(),
        resultPostUrl: EnvironmentHelper.GetServerUrl() + '/podcast/import/episodes',
        taskToken: uuidv4()
      });
    }

    logger.Info('Created podcast import data: ' + JSON.stringify(podcastImportDataList));

    const podcastCacheSetResult = await to(CacheAccess.SetIfNotExistBatch(_.map(podcastImportDataList, (entry) => {
      return {
        key: 'IMPORT-' + entry.sourceId,
        value: entry.podcastId
      };
    }), 900));

    if (podcastCacheSetResult.error) {
      throw podcastCacheSetResult.error;
    }

    const importInProgressSourceIdEntries = [];
    const importRequiredEntries = [];
    for (const podcastImportEntry of podcastImportDataList) {
      if (podcastCacheSetResult.result.has('IMPORT-' + podcastImportEntry.sourceId)) {
        importRequiredEntries.push(podcastImportEntry);
      } else {
        importInProgressSourceIdEntries.push('IMPORT-' + podcastImportEntry.sourceId);
      }
    }

    logger.Info(importInProgressSourceIdEntries.length + ' podcast import are in progress. ' +
      importRequiredEntries.length + ' have to be imported');

    podcastImportDataList = importRequiredEntries;

    const podcastIdsToFollow = [];

    if (importInProgressSourceIdEntries.length > 0) {
      const inProgressCacheAsyncResult = await to(CacheAccess.GetMany(importInProgressSourceIdEntries));

      if (inProgressCacheAsyncResult.error) {
        throw(inProgressCacheAsyncResult.error);
      }

      for (const inProgressPodcastId of inProgressCacheAsyncResult.result) {
        podcastIdsToFollow.push(inProgressPodcastId);
      }
    }

    const importStartPromises = new Array<Promise<AsyncResult>>();

    for (const podcastImportData of podcastImportDataList) {
      const importTokenKey = 'EIMPORTTOKEN-' + podcastImportData.podcastId;
      const setImportTokenAsyncResult = await to(CacheAccess.Set(importTokenKey, podcastImportData.taskToken, 300));

      if (setImportTokenAsyncResult.error) {
        logger.Error(setImportTokenAsyncResult.error);
        continue;
      }

      importStartPromises.push(to(PodcastTasks.InvokePodcastImport(logger, podcastImportData)));
    }

    const importStartedResults = await Promise.all(importStartPromises);

    for (const importStartedResult of importStartedResults) {
      if (importStartedResult.error) {
        logger.Error(importStartedResult.error);
      } else {
        // To only follow podcasts where the import process was started successfully
        podcastIdsToFollow.push(importStartedResult.result.podcastId);
      }
    }

    if (accountId && (podcastIdsToFollow.length > 0 || existingPodcasts.length > 0)) {
      const podcastIdsToForce = new Set(_.pluck(podcastImportDataList, 'podcastId'));
      createdPodcastFollowEntries = await PodcastQuery.CreatePodcastFollowEntries(logger, accountId,
        podcastIdsToFollow.concat(_.pluck(existingPodcasts, 'PID')), podcastIdsToForce);
    }

    return {
      msg: {
        existingPodcasts: PodcastController.GetPodcastResponseMessage(existingPodcasts, createdPodcastFollowEntries),
        podcastImports: podcastIdsToFollow
      },
      statusCode: httpStatus.ACCEPTED
    };

  }

  public static async StartEpisodeImport(logger: AppLogger, podcastId: string,
    taskToken: string, updateToken: string, episodeDatabaseEntries: any[], isLastRequest: string) {

    if (!podcastId || (!taskToken && !updateToken) || !episodeDatabaseEntries || !_.isArray(episodeDatabaseEntries) || episodeDatabaseEntries.length === 0) {
      return {
        msg: {
          error: 'The episode import data is invalid!',
          errorCode: PodcastError.EPISODE_IMPORT_DATA_INVALID
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    let tokenKey = '';
    let token = '';

    if (taskToken) {
      tokenKey = 'EIMPORTTOKEN-' + podcastId;
      token = taskToken;
    } else if (updateToken) {
      tokenKey = 'EUPDATETOKEN-' + podcastId;
      token = updateToken;
    }

    const getImportTokenAsyncResult = await to(CacheAccess.Get(tokenKey));

    // token doesn't exists.
    if (getImportTokenAsyncResult.error || !getImportTokenAsyncResult.result ||
      token !== getImportTokenAsyncResult.result) {
      return {
        msg: {
          error: 'The episode import token is invalid!',
          errorCode: PodcastError.EPISODE_IMPORT_TOKEN_INVALID
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    if (isLastRequest) {
      const removeImportTokenAsyncResult = await to(CacheAccess.Delete(tokenKey));

      if (removeImportTokenAsyncResult.error) {
        throw removeImportTokenAsyncResult.error;
      }

      // token was already consumed.
      if (removeImportTokenAsyncResult.result === 0) {
        return {
          msg: {
            error: 'The episode import token is invalid!',
            errorCode: PodcastError.EPISODE_IMPORT_TOKEN_INVALID
          },
          statusCode: httpStatus.BAD_REQUEST
        };
      }
    }

    const sortedSetItemsToAdd = [];
    for (const episodeDatabaseEntry of episodeDatabaseEntries) {
      sortedSetItemsToAdd.push(episodeDatabaseEntry.INDEX);
      sortedSetItemsToAdd.push(JSON.stringify(episodeDatabaseEntry));
    }

    const addEpsiodeEntriesToCacheAsyncResult = await to(CacheAccess.AddItemsToSortedSet(
      'EPISODES-' + podcastId, sortedSetItemsToAdd));

    if (addEpsiodeEntriesToCacheAsyncResult.error) {
      throw addEpsiodeEntriesToCacheAsyncResult.error;
    }

    if (addEpsiodeEntriesToCacheAsyncResult.result !== episodeDatabaseEntries.length) {
      logger.Warn('Only ' + addEpsiodeEntriesToCacheAsyncResult.result + ' from existing ' + episodeDatabaseEntries.length + ' episodes were added to the cache');
    }

    if (isLastRequest) {
      const startEpisodeImportAsyncResult = await to(PodcastTasks.StartEpisodeImport(logger, podcastId));

      if (startEpisodeImportAsyncResult.error) {
        throw startEpisodeImportAsyncResult.error;
      }

      logger.Info('Successfully start episode import: ' + JSON.stringify(startEpisodeImportAsyncResult.result));
    }

    return {
      msg: {},
      statusCode: httpStatus.OK
    };
  }

  public static GetPodcastResponseMessage(podcasts: any[], podcastFollowEntries: any[]) {
    const podcastFollowEntryMap = new Map();

    if (podcastFollowEntries) {
      for (const podcastFollowEntry of podcastFollowEntries) {
        podcastFollowEntryMap.set(podcastFollowEntry.PID, podcastFollowEntry);
      }
    }

    const responseMessage = _.map(podcasts, (podcast: any) => {
      const existingPodcast: any = {
        podcastId: podcast.PID,
        name: podcast.NAME,
        description: podcast.DESC,
        author: podcast.ATHR,
        authorUrl: podcast.ATHRURL,
        genre: podcast.GENRE,
        image: podcast.IMG,
        source: podcast.SRC,
        sourceId: podcast.SRCID,
        sourceLink: podcast.SRCL
      };

      const podcastFollowData = podcastFollowEntryMap.get(podcast.PID);

      if (podcastFollowData) {
        existingPodcast.followTimestamp = podcastFollowData.FLWTS;
        existingPodcast.lastPlayedTimestamp = podcastFollowData.LUTS;
        existingPodcast.playedCount = podcastFollowData.PLAYD;
      }

      return existingPodcast;
    });

    return _.compact(responseMessage);
  }

  public static GetEpisodeResponseMessage(episodes: any[]) {
    return _.map(episodes, (episode: any) => {
      return {
        episodeId: episode.PID + episode.INDEX,
        podcastId: episode.PID,
        index: episode.INDEX,
        name: episode.NAME,
        description: episode.DESC,
        releaseTimestamp: episode.RLSTS,
        duration: episode.DRTN,
        audioUrl: episode.MEDIA
      };
    });
  }

  private static async GetLatestTopPodcastEpisodesResponse(logger: AppLogger, nextToken: string) {
    const fileData = StaticFileAccess.GetFileData(EnvironmentHelper.GetTopListFileName());
    const pageSize = 17;

    let decodedToken: any = {};
    let nextNextToken: any = {
      index: pageSize,
      size: pageSize
    };

    let startIndex = 0;
    if (nextToken) {
      decodedToken = JSON.parse(Buffer.from(nextToken, 'base64').toString('utf8'));

      startIndex = decodedToken.index;
      nextNextToken.index = decodedToken.index + pageSize;
    }

    const fileEntriesToUse = [];

    // sample out page
    for (let i = startIndex; i < (startIndex + pageSize); i++) {
      if (fileData[i]) {
        fileEntriesToUse.push(fileData[i]);
      }
    }

    let topList = [];
    if (fileEntriesToUse) {
      const episodesRetrievalPromises = [];

      for (const podcastId of fileEntriesToUse) {
        episodesRetrievalPromises.push(PodcastQuery.GetEpisodesOfPodcast(logger, podcastId, null, null, 1));
      }

      const latestTopPodcastEpisodes = await Promise.all(episodesRetrievalPromises);

      for (const latestTopPodcastEpisode of latestTopPodcastEpisodes) {
        if (latestTopPodcastEpisode && _.isArray(latestTopPodcastEpisode) && latestTopPodcastEpisode.length > 0) {
          topList.push(latestTopPodcastEpisode[0]);
        }
      }

      topList = this.GetEpisodeResponseMessage(topList);
      topList = _.sortBy(topList, (topListEntry) => {
        return -topListEntry.releaseTimestamp;
      });
    }

    if (fileEntriesToUse.length < pageSize || nextNextToken.index >= fileData.length) {
      nextNextToken = null;
    }

    const nextTokenString = nextNextToken ? Buffer.from(JSON.stringify(nextNextToken)).toString('base64') : null;

    return {
      msg: {
        type: 'toplist',
        result: topList,
        next: nextTokenString
      },
      statusCode: httpStatus.OK
    };
  }
}
