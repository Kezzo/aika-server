import httpStatus = require('http-status-codes');
import _ = require('underscore');

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

    let followedPodcasts = await PodcastQuery.GetPodcasts(logger, followedPodcastIds);

    if (!followedPodcasts || followedPodcasts.length === 0) {
      throw Error('Podcasts with the ids: ' + JSON.stringify(followedPodcastIds) + 'couldn\'t be retrieved!');
    }

    let responseMessage = '';

    if (followedPodcasts) {
      followedPodcasts = _.map(followedPodcasts, (podcast: any) => {
        return {
          podcastId: podcast.PID,
          name: podcast.NAME,
          description: podcast.DESC,
          author: podcast.ATHR,
          authorUrl: podcast.ATHRURL,
          genre: podcast.GENRE,
          image: podcast.IMG,
          rss: podcast.RSS,
          source: podcast.SRC,
          sourceLink: podcast.SRCL
        };
      });

      responseMessage = followedPodcasts;
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
