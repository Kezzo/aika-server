import { NextFunction } from 'express';

import express = require('express');
const router = express.Router();

import { AppLogger } from '../logging/app-logger';
import { Response } from '../common/response';
import { SearchController } from '../controller/search-controller';

/**
 * @api {get} /search/podcasts/?term?next /podcasts/?term?next
 * @apiName /search/podcasts/?term?next
 * @apiDescription Returns podcasts based on a given search term.
 * @apiGroup Search
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
 *          "source": "itunes",
 *          "sourceLink": "itunes.com"
 *        }
 *     ]
 */
router.get('/podcasts/', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const searchTerm = req.param('term');
  const nextToken = req.param('next');

  SearchController.SearchForPodcasts(logger, searchTerm, nextToken)
    .then((searchResults) => {
      new Response(res, searchResults).Send();
    })
    .catch((error) => {
      new Response(res, null, error).Send();
    });
});

/**
 * @api {get} /search/episodes/?term?next /episodes/?term?next
 * @apiName /search/episodes/?term?next
 * @apiDescription Returns episodes based on a given search term.
 * @apiGroup Search
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
 *       }
 *   ]
 */
router.get('/episodes/', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const searchTerm = req.param('term');
  const nextToken = req.param('next');

  SearchController.SearchForEpisodes(logger, searchTerm, nextToken)
    .then((searchResults) => {
      new Response(res, searchResults).Send();
    })
    .catch((error) => {
      new Response(res, null, error).Send();
    });
});

module.exports = router;
