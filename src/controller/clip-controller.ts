import httpStatus = require('http-status-codes');
import _ = require('underscore');
import moment = require('moment');

import { AppLogger } from '../logging/app-logger';
import { ClipError } from '../error-codes/clip-error';
import { PodcastQuery } from '../queries/podcast-query';
import { ClipQuery } from '../queries/clip-query';

export class ClipController {
  public static async CreateClip(logger: AppLogger, accountId: string, episodeId: string, clipData: any) {
    if (!accountId) {
      return {
        msg: {
          error: 'Account id is missing!',
          errorCode: ClipError.ACCOUNT_ID_MISSING
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    if (!episodeId) {
      return {
        msg: {
          error: 'Episode is missing!',
          errorCode: ClipError.EPISODE_ID_MISSING
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    if (!clipData ||
      !_.has(clipData, 'title') || clipData.title.length === 0 ||
      !_.has(clipData, 'startTime') || _.isNaN(clipData.startTime) ||
      !_.has(clipData, 'endTime') || _.isNaN(clipData.endTime)) {
      return {
        msg: {
          error: 'Clip data is incomplete! Title, start- and end-time is required.',
          errorCode: ClipError.CLIP_DATA_INCOMPLETE
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    // check if start time is smaller than end time
    if (clipData.startTime < 0 || clipData.startTime >= clipData.endTime) {
      return {
        msg: {
          error: 'Clip times are incorrect. Must be above zero and end time must be bigger than start time.',
          errorCode: ClipError.CLIP_TIMES_ARE_INCORRECT
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    const podcastId = episodeId.substring(0, 36);
    const index = parseInt(episodeId.substring(36), 10);

    // get episode and therefore check if it exists
    const episodes = await PodcastQuery.GetEpisodes(logger, [{podcastId, index}]);

    if (!episodes || !_.isArray(episodes) || episodes.length === 0 || !episodes[0]) {
      return {
        msg: {
          error: 'Episode to create clip from doesn\'t exist!',
          errorCode: ClipError.EPISODE_DOESNT_EXIST
        },
        statusCode: httpStatus.BAD_REQUEST
      };
    }

    const episodeData = episodes[0];

    // TODO: check if start and end time are in the duration of the episode when durations can be trusted.

    // get last recorded clip of that episode of that user for index
    const lastEpisodeClipFromUser = await ClipQuery.GetEpisodeClipsFromUser(logger, accountId, episodeId, 1);

    let clipTimestamp = parseInt(moment.utc().format('X'), 10);

    let clipIndex = 0;
    if (lastEpisodeClipFromUser && _.isArray(lastEpisodeClipFromUser) &&
      lastEpisodeClipFromUser.length > 0 && lastEpisodeClipFromUser[0]) {

      const splitAccountWithIndex = lastEpisodeClipFromUser[0].ACCIDX.split('+');
      clipIndex = parseInt(splitAccountWithIndex[1], 10) + 1;

      if (lastEpisodeClipFromUser[0].CLPTS >= clipTimestamp) {
        clipTimestamp = lastEpisodeClipFromUser[0].CLPTS + 1;
      }
    }

    // construct clip db object
    const clipDatabaseObject: any = {
      ACCID: accountId,
      ACCIDX: accountId + '+' + clipIndex,
      CLPTS: clipTimestamp,
      EID: episodeId,
      ENDT: clipData.endTime,
      STRT: clipData.startTime,
      TITL: clipData.title
    };

    if (clipData.notes) {
      clipDatabaseObject.NTS = clipData.notes;
    }

    // store clip object
    await ClipQuery.StoreClip(logger, clipDatabaseObject);

    // return clip object to client
    return {
      msg: this.CreateClipResonseMessage(clipDatabaseObject),
      statusCode: httpStatus.CREATED
    };
  }

  private static CreateClipResonseMessage(clipDatabaseObject: any) {
    return {
      clipId: clipDatabaseObject.EID + clipDatabaseObject.ACCIDX,
      creatorAccountId: clipDatabaseObject.ACCID,
      episodeId: clipDatabaseObject.EID,
      creationTimestamp: clipDatabaseObject.CLPTS,
      startTime: clipDatabaseObject.STRT,
      endTime: clipDatabaseObject.ENDT,
      title: clipDatabaseObject.TITL,
      notes: clipDatabaseObject.NTS ? clipDatabaseObject.NTS : ''
    };
  }
}
