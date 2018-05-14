import { Router, Request, Response, NextFunction } from 'express';

import express = require('express');
const router = express.Router();

import { AccountController } from '../controller/account-controller';
import { AppLogger } from '../logging/app-logger';

router.post('/create', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const mail = req.body.mail;
  const password = req.body.password;

  AccountController.CreateAccount(logger, mail, password)
    .then((userData) => {
      res.statusCode = 201;
      res.send(userData);
    })
    .catch((error) => {
      res.statusCode = 400;
      res.send(JSON.stringify(error));
    });
});

module.exports = router;
