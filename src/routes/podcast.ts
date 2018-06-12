import { NextFunction } from 'express';

import express = require('express');
const router = express.Router();

import { PodcastController } from '../controller/podcast-controller';
import { AppLogger } from '../logging/app-logger';
import { Response } from '../common/response';

/**
 * @api {get} /podcast/followed /followed
 * @apiName /podcast/followed
 * @apiDescription Gets the a set of the podcasts a user follows, sorted by relevance to the user.
 * @apiGroup Podcast
 *
 * @apiParam {Number} lastFollowTimestamp Optional. UTC-Timestamp. Can be set to only get podcast the user started following after the time of the timestamp. (to get latest podcasts, not cached yet)
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 201 OK
 *     [
 *       {
 *          "podcastId": "34754fd1-6c41-49bc-8172-f65d8e7dd5fe",
 *          "name": "The best Podcast in the World",
 *          "description": "But this is just a tribute",
 *          "author": "Jack Green",
 *          "authorUrl": "www.podcastauthor2.com",
 *          "genre": "SCIENCE",
 *          "image": "https://assets.radiox.co.uk/2014/42/tenacious-d---tribute-video-1414069428-list-handheld-0.jpg",
 *          "rss": "www.podcastauthor2.com/rss",
 *          "source": "itunes",
 *          "sourceLink": "itunes.com"
 *       }
 *    ]
 */
router.get('/followed', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const accountId = req.get('x-account-id');
  const lastFollowTimestamp = req.param('lastFollowTimestamp');

  PodcastController.GetFollowedPodcasts(logger, accountId, lastFollowTimestamp)
    .then((accountData) => {
      new Response(res, accountData).Send();
    })
    .catch((error) => {
      new Response(res, null, error).Send();
    });
});

/**
 * @api {get} /podcast/episodes /episodes
 * @apiName /podcast/episodes
 * @apiDescription Gets the a set of the episodes of a podcast, sorted by release timestamp.
 * @apiGroup Podcast
 *
 * @apiParam {Number} lastReleaseTimestamp Optional. UTC-Timestamp. Can be set to only get episodes released after the timestamp. (to get latest episodes, not cached yet)
 * @apiParam {Number} oldestReleaseTimestamp Optional. UTC-Timestamp. Can be set to only get episodes released before the timestamp. (can be used for pagination)
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 201 OK
 *     [
 *       {
 *          "podcastId": "c2a145ce-c568-485d-91da-fdeaf2357927",
 *          "name": "The best Episode 2",
 *          "description": "This is just a tribute too",
 *          "releaseTimestamp": 1528639577,
 *          "duration": "01:14:33",
 *          "audioUrl": "https://9to5mac.files.wordpress.com/2018/06/9to5mac-happy-hour-06-08-2018.mp3",
 *          "likedCount": 2448
 *       }
 *    ]
 */
router.get('/episodes/:podcastId', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const accountId = req.param('podcastId');
  const lastReleaseTimestamp = req.param('lastReleaseTimestamp');
  const oldestReleaseTimestamp = req.param('oldestReleaseTimestamp');

  PodcastController.GetEpisodesFromPodcast(logger, accountId, lastReleaseTimestamp, oldestReleaseTimestamp)
    .then((accountData) => {
      new Response(res, accountData).Send();
    })
    .catch((error) => {
      new Response(res, null, error).Send();
    });
});

module.exports = router;
