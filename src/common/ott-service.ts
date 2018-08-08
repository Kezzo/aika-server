import { NextFunction } from 'express';
import express = require('express');
import _ = require('underscore');
import uuidv4 = require('uuid/v4');

import { CacheAccess } from './cache-access';
import to from '../utility/to';

export class OneTimeTokenService {
  private static nonOTTRequestPaths = new Set([
    '/app',
    '/apple-app-site-association',
    '/account/create/mail',
    '/account/send/magiclink',
    '/account/login/mail',
    '/account/login/twitter',
    '/account/login/accountid',
    '/account/login/magiclink',
    '/account/verify',
    '/account/password/reset',
    '/account/password/change',
    '/platform/twitter/logintoken',
    '/podcast',
    '/podcast/episode',
    '/podcast/episodes',
    '/podcast/import/episodes',
    '/podcast/import/raw',
    '/search/podcasts',
    '/search/episodes',
    '/search/suggestions',
    '/clip',
  ]);

  public static async CheckOTT(req: express.Request, res: express.Response, next: NextFunction) {
    try {
      if (OneTimeTokenService.nonOTTRequestPaths.has(req.path)) {
        next();
        return;
      }

      const accountId = req.get('x-account-id');
      const ott = req.get('x-one-time-token');

      if (!accountId || !ott) {
        res.statusCode = 400;
        res.send({
          error: 'OneTimeToken or AccountId missing!',
          errorCode: -2
        });
        return;
      }

      const getResult = await to(CacheAccess.Get(OneTimeTokenService.GetOTTKey(accountId)));

      if (getResult.error) {
        throw getResult.error;
      }

      if (_.isEqual(ott, getResult.result)) {
        const newOTT = await OneTimeTokenService.GenerateOTT(accountId);
        res.set('x-one-time-token', newOTT);
        next();
      } else {
        res.statusCode = 400;
        res.send({
          error: 'OneTimeToken invalid!',
          errorCode: -1
        });
      }
    } catch (err) {
      res.statusCode = 500;
      res.send({
        error: err,
        errorCode: -2
      });
    }
  }

  public static async GenerateOTT(accountId: string) {
    const newOTT = uuidv4();

    const setResult = await to(CacheAccess.Set(this.GetOTTKey(accountId), newOTT, 900));

    if (!_.isNull(setResult.error)) {
      throw setResult.error;
    }

    return newOTT;
  }

  public static async InvalidateOTT(accountId: string) {
    const deleteResult = await to(CacheAccess.Delete(this.GetOTTKey(accountId)));

    if (!_.isNull(deleteResult.error)) {
      throw deleteResult.error;
    }

    return deleteResult;
  }

  private static GetOTTKey(accountId: string) {
    return 'OTT-' + accountId;
  }
}
