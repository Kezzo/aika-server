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
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 201 OK
 *     [
 *       {
 *         "RSS":"www.podcastauthor2.com/rss",
 *         "ATHR":"Jack White",
 *         "SRC":"itunes",
 *         "IMG":"https://assets.radiox.co.uk/2014/42/tenacious-d---tribute-video-1414069428-list-handheld-0.jpg",
 *         "PID":"55a3f2e0-808e-45c3-ae3f-6ad0f5e30775",
 *         "ATHRURL":"www.podcastauthor2.com",
 *         "DESC":"But this is just a tribute",
 *         "SRCL":"itunes.com",
 *         "NAME":"The best Podcast in the World2",
 *         "GENRE":"COMEDY"
 *       }
 *    ]
 */
router.get('/followed', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const accountId = req.get('x-account-id');

  PodcastController.GetFollowedPodcasts(logger, accountId)
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
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 201 OK
 *     [
 *       {
 *          "AUDURL": "https://9to5mac.files.wordpress.com/2018/06/9to5mac-happy-hour-06-08-2018.mp3",
 *          "DESC": "This is just a tribute too",
 *          "DRTN": "02:56:44",
 *          "LKD": 1337,
 *          "NAME": "The best Episode 1",
 *          "PID": "c2a145ce-c568-485d-91da-fdeaf2357927",
 *          "RLSTS": 1528639598
 *       }
 *    ]
 */
router.get('/episodes/:podcastId', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const accountId = req.param('podcastId');

  PodcastController.GetEpisodesFromPodcast(logger, accountId)
    .then((accountData) => {
      new Response(res, accountData).Send();
    })
    .catch((error) => {
      new Response(res, null, error).Send();
    });
});

module.exports = router;
