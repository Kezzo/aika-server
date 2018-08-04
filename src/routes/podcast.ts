import { NextFunction } from 'express';

import express = require('express');
const router = express.Router();

import { PodcastController } from '../controller/podcast-controller';
import { AppLogger } from '../logging/app-logger';
import { Response } from '../common/response';

/**
 * @api {get} /podcast?id /?id
 * @apiName /podcast?id
 * @apiDescription Gets the podcast data with the given PID.
 * @apiGroup Podcast
 *
 * @apiParamExample {json} Request-Example:
 *     GET /podcast?id=34754fd1-6c41-49bc-8172-f65d8e7dd5fe
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "podcastId": "34754fd1-6c41-49bc-8172-f65d8e7dd5fe",
 *       "name": "The best Podcast in the World",
 *       "description": "But this is just a tribute",
 *       "author": "Jack Green",
 *       "authorUrl": "www.podcastauthor2.com",
 *       "genre": "SCIENCE",
 *       "image": "https://assets.radiox.co.uk/2014/42/tenacious-d---tribute-video-1414069428-list-handheld-0.jpg",
 *       "source": "itunes",
 *       "sourceLink": "itunes.com",
 *       "followTimestamp": 15283420140000,
 *       "lastPlayedTimestamp": 1528642014,
 *     }
 */
router.get('/', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const podcastId = req.param('id');

  PodcastController.GetPodcast(logger, podcastId)
    .then((podcastData) => {
      new Response(res, podcastData).Send();
    })
    .catch((error) => {
      new Response(res, null, error).Send();
    });
});

/**
 * @api {post} /podcast/follow /follow
 * @apiName /podcast/follow
 * @apiDescription Follow the given podcast with the given podcastId.
 * @apiGroup Podcast
 *
 * @apiParamExample {json} Request-Example:
 *     POST /podcast/follow
 *     Headers: [
 *        "x-account-id": 34754fd1-6c41-49bc-8172-f65d8e7dd5fe
 *     ]
 *     {
 *        "podcastId": "c2a145ce-c568-485d-91da-fdeaf2357927"
 *     }
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {}
 */
router.post('/follow', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const accountId = req.get('x-account-id');
  const podcastId = req.body.podcastId;

  PodcastController.FollowPodcast(logger, accountId, podcastId)
    .then((followPodcastResult) => {
      new Response(res, followPodcastResult).Send();
    })
    .catch((error) => {
      new Response(res, null, error).Send();
    });
});

/**
 * @api {post} /podcast/unfollow /unfollow
 * @apiName /podcast/unfollow
 * @apiDescription Unfollow the given podcast with the given podcastId.
 * @apiGroup Podcast
 *
 * @apiParamExample {json} Request-Example:
 *     POST /podcast/unfollow
 *     Headers: [
 *        "x-account-id": 34754fd1-6c41-49bc-8172-f65d8e7dd5fe
 *     ]
 *     {
 *        "podcastId": "c2a145ce-c568-485d-91da-fdeaf2357927"
 *     }
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {}
 */
router.post('/unfollow', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const accountId = req.get('x-account-id');
  const podcastId = req.body.podcastId;

  PodcastController.UnfollowPodcast(logger, accountId, podcastId)
    .then((unfollowPodcastResult) => {
      new Response(res, unfollowPodcastResult).Send();
    })
    .catch((error) => {
      new Response(res, null, error).Send();
    });
});

/**
 * @api {get} /podcast/followed /followed
 * @apiName /podcast/followed
 * @apiDescription Gets the a set of the podcasts a user follows, sorted by relevance to the user.
 * @apiGroup Podcast
 *
 * @apiParam {String} next Optional. Can be set get the next page of results.
 *
 * @apiParamExample {json} Request-Example:
 *     GET /podcast/followed
 *     GET /podcast/followed?next=eyJ0ZXJtIjoicG9kY2FzdCIsImZyb20iOjIwfQ==
 *     Headers: [
 *        "x-account-id": 34754fd1-6c41-49bc-8172-f65d8e7dd5fe
 *     ]
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *        "result": [
 *           {
 *              "podcastId": "c2a145ce-c568-485d-91da-fdeaf2357927",
 *              "name": "The best Podcast in the World",
 *              "description": "But this is just a tribute",
 *              "author": "Jack Green",
 *              "authorUrl": "www.podcastauthor2.com",
 *              "genre": "SCIENCE",
 *              "image": "https://assets.radiox.co.uk/2014/42/tenacious-d---tribute-video-1414069428-list-handheld-0.jpg",
 *              "source": "itunes",
 *              "sourceLink": "itunes.com",
 *              "followTimestamp": 1528342014,
 *              "lastPlayedTimestamp": 1528642014,
 *           }
 *        ],
 *        "nextToken": "eyJ0ZXJtIjoicG9kY2FzdCIsImZyb20iOjIwfQ=="
 *     }
 */
router.get('/followed', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const accountId = req.get('x-account-id');
  const nextToken = req.param('next');

  PodcastController.GetFollowedPodcasts(logger, accountId, nextToken)
    .then((followedPodcastsData) => {
      new Response(res, followedPodcastsData).Send();
    })
    .catch((error) => {
      new Response(res, null, error).Send();
    });
});

/**
 * @api {get} /podcast/episodes?podcastId /episodes?podcastId
 * @apiName /podcast/episodes?podcastId
 * @apiDescription Gets the a set of the episodes of a podcast, sorted by release timestamp.
 * @apiGroup Podcast
 *
 * @apiParam {Number} biggestIndex Optional. Can be set to only get episodes released after the index. (to get latest episodes, not cached yet)
 * @apiParam {Number} smallestIndex Optional. Can be set to only get episodes released before the index. (can be used for pagination)
 *
 * @apiParamExample {json} Request-Example:
 *     GET /podcast/episodes?podcastId=c2a145ce-c568-485d-91da-fdeaf2357927
 *     GET /podcast/episodes?podcastId=c2a145ce-c568-485d-91da-fdeaf2357927?biggestIndex=1528639577
 *     GET /podcast/episodes?podcastId=c2a145ce-c568-485d-91da-fdeaf2357927?smallestIndex=1528639577
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     [
 *       {
 *          "episodeId": "c2a145ce-c568-485d-91da-fdeaf23579271528639577",
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
router.get('/episodes', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const accountId = req.param('podcastId');
  const biggestIndex = req.param('biggestIndex');
  const smallestIndex = req.param('smallestIndex');

  PodcastController.GetEpisodesFromPodcast(logger, accountId, biggestIndex, smallestIndex)
    .then((episodesData) => {
      new Response(res, episodesData).Send();
    })
    .catch((error) => {
      new Response(res, null, error).Send();
    });
});

/**
 * @api {post} /podcast/import /import
 * @apiName /podcast/import
 * @apiDescription Initiates the import process for the given podcast source id's for a given user.
 * @apiGroup Podcast
 *
 * @apiParamExample {json} Request-Example:
 *     POST /podcast/import
 *     {
 *       "podcastSourceIds": [
 *         1054815950,
 *         793067475,
 *   	     360084272
 *       ]
 *     }
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 202 ACCEPTED
 *     {
 *       "existingPodcasts": [],
 *       "podcastImports": [
 *         "dba6e4d2-cf45-4710-8ff8-ff252d5aa856",
 *         "ca359a98-210d-41dd-839e-2b0a20f034a9",
 *         "af4de685-49ca-4555-9658-6620a3ba664f"
 *       ]
 *     }
 */
router.post('/import', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const accountId = req.get('x-account-id');
  const podcastSourceIds = req.body.podcastSourceIds;

  PodcastController.StartPodcastImportForAccount(logger, accountId, podcastSourceIds)
    .then((podcastImportStartResult) => {
      new Response(res, podcastImportStartResult).Send();
    })
    .catch((error) => {
      new Response(res, null, error).Send();
    });
});

/**
 * @api {post} /podcast/import/raw /import/raw
 * @apiName /podcast/import/raw
 * @apiDescription Initiates the raw import process for the given podcast source id's without a required account id.
 * @apiGroup Podcast
 *
 * @apiParamExample {json} Request-Example:
 *     POST /podcast/import/raw
 *     {
 *       "podcastSourceIds": [
 *         1054815950,
 *         793067475,
 *   	     360084272
 *       ]
 *     }
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 202 ACCEPTED
 *     {
 *       "existingPodcasts": [],
 *       "podcastImports": [
 *         "dba6e4d2-cf45-4710-8ff8-ff252d5aa856",
 *         "ca359a98-210d-41dd-839e-2b0a20f034a9",
 *         "af4de685-49ca-4555-9658-6620a3ba664f"
 *       ]
 *     }
 */
router.post('/import/raw', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const importSecret = req.get('x-import-secret');
  const podcastSourceIds = req.body.podcastSourceIds;

  PodcastController.StartRawPodcastImport(logger, importSecret, podcastSourceIds)
    .then((rawPodcastImportStartResult) => {
      new Response(res, rawPodcastImportStartResult).Send();
    })
    .catch((error) => {
      new Response(res, null, error).Send();
    });
});

/**
 * @api {post} /podcast/import/episodes /import/episodes
 * @apiName /podcast/import/episodes
 * @apiDescription Initiates the import process for the given episode database entries recieved from a lambda podcast import task.
 * @apiGroup Podcast
 *
 * @apiParamExample {json} Request-Example:
 *     POST /podcast/import/episodes
 *     {}
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {}
 */
router.post('/import/episodes', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const podcastId = req.get('x-podcast-id');
  const taskToken = req.get('x-task-token');
  const updateToken = req.get('x-update-token');
  const isLastRequest = req.get('x-is-last-request');
  const episodeDatabaseEntries = req.body;

  PodcastController.StartEpisodeImport(logger, podcastId, taskToken, updateToken, episodeDatabaseEntries, isLastRequest)
    .then((episodeImportStartResult) => {
      new Response(res, episodeImportStartResult).Send();
    })
    .catch((error) => {
      new Response(res, null, error).Send();
    });
});

module.exports = router;
