import { NextFunction } from 'express';

import express = require('express');
const router = express.Router();

import { AppLogger } from '../logging/app-logger';
import { Response } from '../common/response';
import { ClipController } from '../controller/clip-controller';

/**
 * @api {put} /clip /
 * @apiName /clip
 * @apiDescription Creates a new clip of an episode created by a user.
 * @apiGroup Clip
 *
 * @apiParamExample {json} Request-Example:
 *     PUT /clip
 *     Headers: [
 *        "x-account-id": 34754fd1-6c41-49bc-8172-f65d8e7dd5fe
 *     ]
 *     {
 *        "episodeId": "c2a145ce-c568-485d-91da-fdeaf23579275",
 *        "clipData": {
 *          "title": "This is a nice clip!",
 *          "notes": "In this clip the podcast host said something really interesting.",
 *          "startTime": 1000,
 *          "endTime": 1500,
 *        }
 *     }
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 201 CREATED
 *     {
 *        "clipId": "baeccada-d102-4e95-9ee1-74f48332578108ce5540b-0676-41a4-a4dc-04ffa83f847b+2",
 *        "creatorAccountId": "8ce5540b-0676-41a4-a4dc-04ffa83f847b",
 *        "episodeId": "baeccada-d102-4e95-9ee1-74f4833257810",
 *        "creationTimestamp": 1533589723,
 *        "startTime": 1500,
 *        "endTime": 2000,
 *        "title": "This is a nice clip!",
 *        "notes": "In this clip the podcast host said something really interesting."
 *     }
 */
router.put('/', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const accountId = req.get('x-account-id');
  const episodeId = req.body.episodeId;
  const clipData = req.body.clipData;

  ClipController.CreateClip(logger, accountId, episodeId, clipData)
    .then((createdClipData) => {
      new Response(res, createdClipData).Send();
    })
    .catch((error) => {
      new Response(res, null, error).Send();
    });
});

/**
 * @api {put} /clip/change /change
 * @apiName /clip/change
 * @apiDescription Changes an existing clip of the user and returns the updated clip data.
 * @apiGroup Clip
 *
 * @apiParamExample {json} Request-Example:
 *     POST /clip/change
 *     Headers: [
 *        "x-account-id": 34754fd1-6c41-49bc-8172-f65d8e7dd5fe
 *     ]
 *     {
 *        "clipId": "baeccada-d102-4e95-9ee1-74f4833257810+8ce5540b-0676-41a4-a4dc-04ffa83f847b+2",
 *        "changedClipData": {
 *          "title": "This is a nice clip!",
 *          "notes": "In this clip the podcast host said something really interesting."
 *        }
 *     }
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *        "clipId": "baeccada-d102-4e95-9ee1-74f4833257810+8ce5540b-0676-41a4-a4dc-04ffa83f847b+2",
 *        "creatorAccountId": "8ce5540b-0676-41a4-a4dc-04ffa83f847b",
 *        "episodeId": "baeccada-d102-4e95-9ee1-74f4833257810",
 *        "creationTimestamp": 1533589723,
 *        "startTime": 1500,
 *        "endTime": 2000,
 *        "title": "This is a nice clip!",
 *        "notes": "In this clip the podcast host said something really interesting."
 *     }
 */
router.post('/change', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const accountId = req.get('x-account-id');
  const clipId = req.body.clipId;
  const changedClipData = req.body.changedClipData;

  ClipController.ChangeClipData(logger, accountId, clipId, changedClipData)
    .then((createdClipData) => {
      new Response(res, createdClipData).Send();
    })
    .catch((error) => {
      new Response(res, null, error).Send();
    });
});

/**
 * @api {get} /clip/user /user
 * @apiName /clip/user
 * @apiDescription Get the clips of a user with the given accountId.
 * @apiGroup Clip
 *
 * @apiParamExample {json} Request-Example:
 *     GET /clip/user?next=eyJ0ZXJtIjoicG9kY2FzdCIsImZyb20iOjIwfQ==
 *     Headers: [
 *        "x-account-id": 34754fd1-6c41-49bc-8172-f65d8e7dd5fe
 *     ]
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     "result": [
 *        {
 *            "clipId": "baeccada-d102-4e95-9ee1-74f4833257810+8ce5540b-0676-41a4-a4dc-04ffa83f847b+2",
 *            "creatorAccountId": "8ce5540b-0676-41a4-a4dc-04ffa83f847b",
 *            "episodeId": "baeccada-d102-4e95-9ee1-74f4833257810",
 *            "creationTimestamp": 1533589723,
 *            "startTime": 1500,
 *            "endTime": 2000,
 *            "title": "This is a nice clip!",
 *            "notes": "In this clip the podcast host said something really interesting."
 *        }
 *     ],
 *     "next": "eyJ0ZXJtIjoicG9kY2FzdCIsImZyb20iOjIwfQ=="
 */
router.get('/user', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const accountId = req.get('x-account-id');
  const nextToken = req.param('next');

  ClipController.GetClipsCreatedByUser(logger, accountId, nextToken)
    .then((createdClipData) => {
      new Response(res, createdClipData).Send();
    })
    .catch((error) => {
      new Response(res, null, error).Send();
    });
});

/**
 * @api {get} /clip/episode /episode
 * @apiName /clip/episode
 * @apiDescription Get the clips of a episode created by a user with the given accountId.
 * @apiGroup Clip
 *
 * @apiParamExample {json} Request-Example:
 *     GET /clip/episode?episodeId=baeccada-d102-4e95-9ee1-74f4833257810&next=eyJ0ZXJtIjoicG9kY2FzdCIsImZyb20iOjIwfQ==
 *     Headers: [
 *        "x-account-id": 34754fd1-6c41-49bc-8172-f65d8e7dd5fe
 *     ]
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     "result": [
 *        {
 *            "clipId": "baeccada-d102-4e95-9ee1-74f4833257810+8ce5540b-0676-41a4-a4dc-04ffa83f847b+2",
 *            "creatorAccountId": "8ce5540b-0676-41a4-a4dc-04ffa83f847b",
 *            "episodeId": "baeccada-d102-4e95-9ee1-74f4833257810",
 *            "creationTimestamp": 1533589723,
 *            "startTime": 1500,
 *            "endTime": 2000,
 *            "title": "This is a nice clip!",
 *            "notes": "In this clip the podcast host said something really interesting."
 *        }
 *     ],
 *     "next": "eyJ0ZXJtIjoicG9kY2FzdCIsImZyb20iOjIwfQ=="
 */
router.get('/episode', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const accountId = req.get('x-account-id');
  const episodeId = req.param('episodeId');
  const nextToken = req.param('next');

  ClipController.GetClipsOfEpisodeCreatedByUser(logger, accountId, episodeId, nextToken)
    .then((createdClipData) => {
      new Response(res, createdClipData).Send();
    })
    .catch((error) => {
      new Response(res, null, error).Send();
    });
});

module.exports = router;
