import httpStatus = require('http-status-codes');
import _ = require('underscore');

import { AppLogger } from '../logging/app-logger';
import { PodcastError } from '../error-codes/podcast-error';
import { PodcastQuery } from '../queries/podcast-query';

export class PodcastController {
  public static async GetFollowedPodcasts(logger: AppLogger, accountId: string, oldestFollowTimestampString?: string) {

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
    if (oldestFollowTimestampString) {
      const parsedInt = parseInt(oldestFollowTimestampString, 10);

      if (parsedInt && !_.isNaN(parsedInt)) {
        oldestFollowTimestamp = parsedInt;
      }
    }

    const followedPodcasts = await PodcastQuery.GetFollowedPodcastEntries(
      logger, accountId, oldestFollowTimestamp);

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

    const followedPodcastMap = new Map();

    for (const podcast of podcasts) {
      followedPodcastMap.set(podcast.PID, podcast);
    }

    let responseMessage: any;

    if (followedPodcasts) {
      responseMessage = _.map(followedPodcasts, (followedPodcast: any) => {

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
          sourceLink: podcastData.SRCL,
          followTimestamp: followedPodcast.FLWTS,
          lastPlayedTimestamp: followedPodcast.LUTS,
          playedCount: followedPodcast.PLAYD
        };
      });

      responseMessage = _.compact(responseMessage);
    } else {
      responseMessage = '';
    }

    return {
      msg: responseMessage,
      statusCode: httpStatus.OK
    };
  }

  public static async GetEpisodesFromPodcast(logger: AppLogger, podcastId: string) {
    if (!podcastId) {
      return {
        msg: {
          error: 'Podcast id is missing!',
          errorCode: PodcastError.PODCAST_ID_MISSING
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    let episodes = await PodcastQuery.GetEpisodes(logger, podcastId);

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
}
