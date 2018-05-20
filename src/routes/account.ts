import { NextFunction } from 'express';

import express = require('express');
const router = express.Router();

import { AccountController } from '../controller/account-controller';
import { AppLogger } from '../logging/app-logger';
import { Response } from '../common/response';

router.put('/create', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const mail = req.body.mail;
  const password = req.body.password;

  AccountController.CreateAccount(logger, mail, password)
    .then((userData) => {
      new Response(res, userData).Send();
    })
    .catch((error) => {
      new Response(res, null, error).Send();
    });
});

router.post('/login', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const mail = req.body.mail;
  const accountId = req.body.accountId;
  const password = req.body.password;
  const authToken = req.body.authToken;

  AccountController.LoginAccount(logger, mail, accountId, password, authToken)
  .then((userData) => {
    new Response(res, userData).Send();
  })
  .catch((error) => {
    new Response(res, null, error).Send();
  });
});

router.get('/verify', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const accountId = req.param('accountId');

  AccountController.VerifyAccount(logger, accountId)
  .then((userData) => {
    new Response(res, userData).Send();
  })
  .catch((error) => {
    new Response(res, null, error).Send();
  });
});

module.exports = router;