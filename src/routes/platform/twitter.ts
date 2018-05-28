import { NextFunction } from 'express';

import express = require('express');
const router = express.Router();

import { AppLogger } from '../../logging/app-logger';
import { Response } from '../../common/response';
import { PlatformController } from '../../controller/platform-controller';
import { Platform } from '../../platforms/platforms';

router.get('/logintoken', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);

  PlatformController.GetLoginToken(logger, Platform.Twitter)
  .then((loginToken) => {
    new Response(res, loginToken).Send();
  })
  .catch((error) => {
    new Response(res, null, error).Send();
  });
});

module.exports = router;