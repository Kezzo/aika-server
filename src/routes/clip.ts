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

module.exports = router;
