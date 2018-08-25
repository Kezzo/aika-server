import { NextFunction } from 'express';

import express = require('express');
const router = express.Router();

import { PodcastController } from '../controller/podcast-controller';
import { AppLogger } from '../logging/app-logger';
import { Response } from '../common/response';

/**
 * @api {get} /podcast /
 * @apiName /podcast
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
      logger.Error(error);
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
      logger.Error(error);
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
      logger.Error(error);
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
      logger.Error(error);
      new Response(res, null, error).Send();
    });
});

/**
 * @api {get} /podcast/followed/episode/feed /followed/episode/feed
 * @apiName /podcast/followed/episode/feed
 * @apiDescription Gets the latest released episodes of the podcasts a user follows or the latest episodes of the top podcasts, if the user doesn't follow any podcasts.
 * @apiGroup Podcast
 *
 * @apiParam {String} next Optional. Can be set get the next page of results.
 *
 * @apiParamExample {json} Request-Example:
 *     GET /podcast/followed/episode/feed
 *     GET /podcast/followed/episode/feed?next=e30=
 *     Headers: [
 *        "x-account-id": 34754fd1-6c41-49bc-8172-f65d8e7dd5fe
 *     ]
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *        "type": "feed",
 *        "result": [
 *          {
 *            "episodeId": "9f80db8d-6ba9-4e8c-8128-5779e74aa314204",
 *            "podcastId": "9f80db8d-6ba9-4e8c-8128-5779e74aa314",
 *            "index": 204,
 *            "name": "Andy Warhol - Pop Art für Schallplatten",
 *            "description": "Andy Warhols Werke der Popart sind heute millionenschwere Objekte auf internationalen Auktionen. Es gibt aber auch kostengünstige Arbeiten von Warhol, die sich jeder leisten kann: Cover von Langspielplatten. - AutorIn: Albert Wiedenhöfer",
 *            "releaseTimestamp": 1533542747,
 *            "duration": 1140,
 *            "audioUrl": "https://wdrmedien-a.akamaihd.net/medp/podcast/weltweit/fsk0/170/1705437/wdr5neugiergenuegtdasfeature_2018-08-06_andywarholpopartfuerschallplatten_wdr5.mp3"
 *          }
 *        ],
 *        "nextToken": "e30=",
 *        "isFirstPage": true
 *     }
 *
 *     OR if user is not following any podcasts yet:
 *
 *     {
 *    	  "type": "toplist",
 *        "result": [
 *          {
 *             "podcastId": "3869a33f-f97c-45cd-a33f-bff52aa2e392",
 *             "name": "Slow Burn: A Podcast About Watergate",
 *             "description": "You think you know the story, or maybe you don’t. But Watergate was stranger, wilder, and more exciting than you can imagine. What did it feel like to live through the scandal that brought down President Nixon? Find out on this eight-episode podcast miniseries hosted by Leon Neyfakh.\r\n\r\nThis podcast is made possible by Slate Plus members, who get a full-length bonus episode every week. Find out more at http://slate.com/slowburn.",
 *             "author": "Slate",
 *             "authorUrl": "https://feeds.megaphone.fm/slate.com/watergate",
 *             "genre": [
 *                 "Society & Culture",
 *                 "News & Politics"
 *             ],
 *             "image": "http://static.megaphone.fm/podcasts/86fe6492-bb2a-11e7-873d-cf56b25e8a62/image/uploads_2F1516104959069-juhjwii8cfc-a13142fbe63f810dd5a31fca9562b7af_2F01_Slate_Redux_Podcast_Cover_Slow-Burn.jpg",
 *             "source": "itunes",
 *             "sourceId": "1315040130",
 *             "sourceLink": "http://feeds.megaphone.fm/watergate"
 *          }
 *        ],
 *        "nextToken": "eyJpbmRleCI6MzQsInNpemUiOjE3fQ=="
 *     }
 */
router.get('/followed/episode/feed', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const accountId = req.get('x-account-id');
  const nextToken = req.param('next');

  PodcastController.GetFollowedPodcastFeed(logger, accountId, nextToken)
    .then((followedPodcastsData) => {
      new Response(res, followedPodcastsData).Send();
    })
    .catch((error) => {
      logger.Error(error);
      new Response(res, null, error).Send();
    });
});

/**
 * @api {get} /podcast/top/episode/feed /top/episode/feed
 * @apiName /podcast/top/episode/feed
 * @apiDescription Gets the latest released episodes of the top podcasts.
 * @apiGroup Podcast
 *
 * @apiParamExample {json} Request-Example:
 *     GET /podcast/top/episode/feed
 *     GET /podcast/top/episode/feed?next=eyJpbmRleCI6MzQsInNpemUiOjE3fQ==
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *    	  "type": "toplist",
 *        "result": [
 *          {
 *             "podcastId": "3869a33f-f97c-45cd-a33f-bff52aa2e392",
 *             "name": "Slow Burn: A Podcast About Watergate",
 *             "description": "You think you know the story, or maybe you don’t. But Watergate was stranger, wilder, and more exciting than you can imagine. What did it feel like to live through the scandal that brought down President Nixon? Find out on this eight-episode podcast miniseries hosted by Leon Neyfakh.\r\n\r\nThis podcast is made possible by Slate Plus members, who get a full-length bonus episode every week. Find out more at http://slate.com/slowburn.",
 *             "author": "Slate",
 *             "authorUrl": "https://feeds.megaphone.fm/slate.com/watergate",
 *             "genre": [
 *                 "Society & Culture",
 *                 "News & Politics"
 *             ],
 *             "image": "http://static.megaphone.fm/podcasts/86fe6492-bb2a-11e7-873d-cf56b25e8a62/image/uploads_2F1516104959069-juhjwii8cfc-a13142fbe63f810dd5a31fca9562b7af_2F01_Slate_Redux_Podcast_Cover_Slow-Burn.jpg",
 *             "source": "itunes",
 *             "sourceId": "1315040130",
 *             "sourceLink": "http://feeds.megaphone.fm/watergate"
 *          }
 *        ],
 *        "nextToken": "eyJpbmRleCI6MzQsInNpemUiOjE3fQ=="
 *     }
 */
router.get('/top/episode/feed', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const nextToken = req.param('next');

  PodcastController.GetLatestTopPodcastEpisodes(logger, nextToken)
    .then((followedPodcastsData) => {
      new Response(res, followedPodcastsData).Send();
    })
    .catch((error) => {
      logger.Error(error);
      new Response(res, null, error).Send();
    });
});

/**
 * @api {get} /podcast/episodes /episodes
 * @apiName /podcast/episodes
 * @apiDescription Gets the a set of the episodes of a podcast, sorted by release timestamp.
 * @apiGroup Podcast
 *
 * @apiParam {Number} biggestIndex Optional. Can be set to only get episodes released after the index. (to get latest episodes, not cached yet)
 * @apiParam {Number} smallestIndex Optional. Can be set to only get episodes released before the index. (can be used for pagination)
 *
 * @apiParamExample {json} Request-Example:
 *     GET /podcast/episodes?podcastId=c2a145ce-c568-485d-91da-fdeaf2357927
 *     GET /podcast/episodes?podcastId=c2a145ce-c568-485d-91da-fdeaf2357927?biggestIndex=5
 *     GET /podcast/episodes?podcastId=c2a145ce-c568-485d-91da-fdeaf2357927?smallestIndex=1
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     [
 *       {
 *          "episodeId": "c2a145ce-c568-485d-91da-fdeaf23579275",
 *          "index": 5
 *          "podcastId": "c2a145ce-c568-485d-91da-fdeaf2357927",
 *          "name": "The best Episode 2",
 *          "description": "This is just a tribute too",
 *          "releaseTimestamp": 1528639577,
 *          "duration": 1383,
 *          "audioUrl": "https://9to5mac.files.wordpress.com/2018/06/9to5mac-happy-hour-06-08-2018.mp3"
 *       }
 *    ]
 */
router.get('/episodes', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const podcastId = req.param('podcastId');
  const biggestIndex = req.param('biggestIndex');
  const smallestIndex = req.param('smallestIndex');

  PodcastController.GetEpisodesFromPodcast(logger, podcastId, biggestIndex, smallestIndex)
    .then((episodesData) => {
      new Response(res, episodesData).Send();
    })
    .catch((error) => {
      logger.Error(error);
      new Response(res, null, error).Send();
    });
});

/**
 * @api {get} /podcast/episode /episode
 * @apiName /podcast/episode
 * @apiDescription Gets a specific episode with the given id.
 * @apiGroup Podcast
 *
 * @apiParamExample {json} Request-Example:
 *     GET /podcast/episode?episodeId=baeccada-d102-4e95-9ee1-74f4833257815
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *        "episodeId": "baeccada-d102-4e95-9ee1-74f4833257815",
 *        "index": 5
 *        "podcastId": "baeccada-d102-4e95-9ee1-74f483325781",
 *        "name": "Take Me As I Am, Whoever I Am | With Rebecca Hall",
 *        "description": "Rebecca Hall who stars in the new drama \"Christine,\" reads a story about dating -- while manic.",
 *        "releaseTimestamp": 1528639577,
 *        "duration": 1383,
 *        "audioUrl": "https://dts.podtrac.com/redirect.mp3/traffic.megaphone.fm/BUR7743908905.mp3"
 *     }
 */
router.get('/episode', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const episodeId = req.param('episodeId');

  PodcastController.GetEpisode(logger, episodeId)
    .then((episodesData) => {
      new Response(res, episodesData).Send();
    })
    .catch((error) => {
      logger.Error(error);
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
      logger.Error(error);
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
      logger.Error(error);
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
  const isPartOfPodcastImport = req.get('x-is-part-of-podcast-import');
  const episodeDatabaseEntries = req.body;

  PodcastController.StartEpisodeImport(logger, podcastId, taskToken, updateToken, episodeDatabaseEntries, isLastRequest, isPartOfPodcastImport)
    .then((episodeImportStartResult) => {
      new Response(res, episodeImportStartResult).Send();
    })
    .catch((error) => {
      logger.Error(error);
      new Response(res, null, error).Send();
    });
});

module.exports = router;
