import { NextFunction } from 'express';

import express = require('express');
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
  res.redirect('https://itunes.apple.com/bh/app/overcast/id888422857');
});

module.exports = router;
