import { NextFunction } from 'express';

import express = require('express');
import { EnvironmentHelper } from '../utility/environment-helper';
import { Environment } from '../utility/environment';
const router = express.Router();

/**
 * @api {get} /app /
 * @apiName /app
 * @apiDescription Redirects to the app's appstore page
 * @apiGroup App
 *
 * @apiParamExample {json} Request-Example:
 *     GET /app
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 302 Found
 *
 */
router.get('/', function(req: express.Request, res: express.Response, next: NextFunction) {
  let urlToRedirectTo = 'https://getaika.co/app/index.html?token=' + req.params('token');

  if (EnvironmentHelper.GetEnvironment() === Environment.DEV) {
    urlToRedirectTo += '?dev=true';
  }

  res.redirect(urlToRedirectTo);
});

module.exports = router;
