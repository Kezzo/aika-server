import { Router, Request, Response, NextFunction } from 'express';

import express = require('express');
const router = express.Router();

import { UserController } from '../controller/user-controller';
import { AppLogger } from '../logging/app-logger';

router.get('/', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  UserController.GetOrCreate(logger, req.get('x-user-id'))
    .then((userData) => {
      res.send(userData);
    })
    .catch((error) => {
      res.send(error);
    });
});

module.exports = router;
