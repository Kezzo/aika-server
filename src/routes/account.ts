import { NextFunction } from 'express';

import express = require('express');
const router = express.Router();

import { AccountController } from '../controller/account-controller';
import { AppLogger } from '../logging/app-logger';
import { Response } from '../common/response';

/**
 * @api {put} /account/create/mail /create/mail
 * @apiName /account/create/mail
 * @apiDescription Create a user account with a mail and password.
 * @apiGroup Account
 *
 * @apiParamExample {json} Request-Example:
 *     {
 *       "mail" : "jon@tinkrinc.co",
 *       "password" : "password1234"
 *     }
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 201 CREATED
 *     {
 *       "accountId": "b4cb9cc3-830f-46be-9adc-984562d5aa2d",
 *       "authToken": "b31f8379-caef-4dc4-857e-ff1755d7de4f",
 *       "oneTimeToken": "6085b143-660f-4985-ae65-85f2aeebcf92"
 *     }
 */
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

/**
 * @api {put} /account/create/twitter /create/twitter
 * @apiName /account/create/twitter
 * @apiDescription Create a user account with twitter oauth tokens.
 * @apiGroup Account
 *
 * @apiParamExample {json} Request-Example:
 *     {
 *       "oauthToken": "K6pvHkAAACAA5UiLAADDSY7Iugzo",
 *       "oauthVerifier": "fBObTFO3Uf6YdAIEUtAAtVfkwel1KJt7C"
 *     }
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 201 CREATED
 *     {
 *       "accountId": "b4cb9cc3-830f-46be-9adc-984562d5aa2d",
 *       "authToken": "b31f8379-caef-4dc4-857e-ff1755d7de4f",
 *       "oneTimeToken": "6085b143-660f-4985-ae65-85f2aeebcf92"
 *     }
 */
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

/**
 * @api {post} /account/login/mail /login/mail
 * @apiName /account/login/mail
 * @apiDescription Login to user account with a mail and password.
 * @apiGroup Account
 *
 * @apiParamExample {json} Request-Example:
 *     {
 *       "mail" : "jon@tinkrinc.co",
 *       "password" : "password1234"
 *     }
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "accountId": "b4cb9cc3-830f-46be-9adc-984562d5aa2d",
 *       "authToken": "b31f8379-caef-4dc4-857e-ff1755d7de4f",
 *       "oneTimeToken": "6085b143-660f-4985-ae65-85f2aeebcf92"
 *     }
 */
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

/**
 * @api {post} /account/login/twitter /login/twitter
 * @apiName /account/login/twitter
 * @apiDescription Login to user account with twitter oauth tokens.
 * @apiGroup Account
 *
 * @apiParamExample {json} Request-Example:
 *     {
 *       "oauthToken": "K6pvHkAAACAA5UiLAADDSY7Iugzo",
 *       "oauthVerifier": "fBObTFO3Uf6YdAIEUtAAtVfkwel1KJt7C"
 *     }
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "accountId": "b4cb9cc3-830f-46be-9adc-984562d5aa2d",
 *       "authToken": "b31f8379-caef-4dc4-857e-ff1755d7de4f",
 *       "oneTimeToken": "6085b143-660f-4985-ae65-85f2aeebcf92"
 *     }
 */
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

/**
 * @api {post} /account/login/accountid /login/accountid
 * @apiName /account/login/accountid
 * @apiDescription Login to user account with accountId.
 * @apiGroup Account
 *
 * @apiParamExample {json} Request-Example:
 *     {
 *       "accountId" : "2c5a0361-8745-4a41-fke2-f03d67ec3152",
 *       "authToken" : "40391a96-0be7-436e-b109-5dfb05944c45"
 *     }
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "oneTimeToken": "6085b143-660f-4985-ae65-85f2aeebcf92"
 *     }
 */
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

/**
 * @api {get} /account/verify /verify
 * @apiName /account/verify
 * @apiDescription Verify account created with mail.
 * @apiGroup Account
 *
 * @apiParam {String} accountId The account id of the created account. Sent via mail.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     <p> Account verification successful!</p>
 */
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

/**
 * @api {post} /account/password/reset /password/reset
 * @apiName /account/password/reset
 * @apiDescription Starts the password reset flow.
 * @apiGroup Account
 *
 * @apiParamExample {json} Request-Example:
 *     {
 *       "mail" : "jelinski.jon@gmail.com"
 *     }
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 */
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

/**
 * @api {post} /account/password/change /password/change
 * @apiName /account/password/change
 * @apiDescription Completes the password reset flow.
 * @apiGroup Account
 *
 * @apiParamExample {json} Request-Example:
 *     {
 *      "accountId" : "2c5a0361-8745-4a31-aad2-f93d89ec3152",
 * 	    "resetToken" : "c07eadb3-3fad-4251-ac07-3fd9434dccd6",
 * 	    "newPassword" : "thisIsABetterPassword"
 *     }
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     "Password has been successfully reset!"
 */
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
