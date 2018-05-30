import { NextFunction } from 'express';

import express = require('express');
const router = express.Router();

import { AccountController } from '../controller/account-controller';
import { AppLogger } from '../logging/app-logger';
import { Response } from '../common/response';

router.put('/create/mail', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const mail = req.body.mail;
  const password = req.body.password;

  AccountController.CreateAccountFromMail(logger, mail, password)
    .then((accountData) => {
      new Response(res, accountData).Send();
    })
    .catch((error) => {
      new Response(res, null, error).Send();
    });
});

router.put('/create/twitter', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const oauthToken = req.body.oauthToken;
  const oauthVerifier = req.body.oauthVerifier;

  AccountController.CreateAccountFromTwitterAuth(logger, oauthToken, oauthVerifier)
    .then((accountData) => {
      new Response(res, accountData).Send();
    })
    .catch((error) => {
      new Response(res, null, error).Send();
    });
});

router.post('/login/mail', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const mail = req.body.mail;
  const password = req.body.password;

  AccountController.LoginAccountViaMail(logger, mail, password)
  .then((accountData) => {
    new Response(res, accountData).Send();
  })
  .catch((error) => {
    new Response(res, null, error).Send();
  });
});

router.post('/login/twitter', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const oauthToken = req.body.oauthToken;
  const oauthVerifier = req.body.oauthVerifier;

  AccountController.LoginAccountViaTwitter(logger, oauthToken, oauthVerifier)
  .then((accountData) => {
    new Response(res, accountData).Send();
  })
  .catch((error) => {
    new Response(res, null, error).Send();
  });
});

router.post('/login/accountid', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const accountId = req.body.accountId;
  const authToken = req.body.authToken;

  AccountController.LoginAccountViaAuthToken(logger, accountId, authToken)
  .then((accountData) => {
    new Response(res, accountData).Send();
  })
  .catch((error) => {
    new Response(res, null, error).Send();
  });
});

router.get('/verify', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const accountId = req.param('accountId');

  AccountController.VerifyAccount(logger, accountId)
  .then((resultData) => {
    new Response(res, resultData).Send();
  })
  .catch((error) => {
    new Response(res, null, error).Send();
  });
});

router.post('/password/reset', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const mail = req.body.mail;

  AccountController.InitiatePasswordReset(logger, mail)
  .then((resultData) => {
    new Response(res, resultData).Send();
  })
  .catch((error) => {
    new Response(res, null, error).Send();
  });
});

router.post('/password/change', function(req: express.Request, res: express.Response, next: NextFunction) {
  const logger = new AppLogger(req, res);
  const accountId = req.body.accountId;
  const resetToken = req.body.resetToken;
  const newPassword = req.body.newPassword;

  AccountController.CompletePasswordReset(logger, accountId, resetToken, newPassword)
  .then((resultData) => {
    new Response(res, resultData).Send();
  })
  .catch((error) => {
    new Response(res, null, error).Send();
  });
});

module.exports = router;
