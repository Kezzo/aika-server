import { NextFunction } from 'express';
import express = require('express');
import _ = require('underscore');
import uuidv4 = require('uuid/v4');

import { CacheAccess } from './cache-access';
import to from '../utility/to';

export class OneTimeTokenProvider {
  private static nonOTTRequestPaths = new Set([
    '/account/create',
    '/account/login',
    '/account/verify',
    '/account/password/reset',
    '/account/password/change'
  ]);

  public static async CheckOTT(req: express.Request, res: express.Response, next: NextFunction) {
    try {
      if (OneTimeTokenProvider.nonOTTRequestPaths.has(req.path)) {
        next();
        return;
      }

      const accountId = req.get('x-account-id');
      const ott = req.get('x-one-time-token');

      if (_.isNull(accountId) || _.isUndefined(accountId) || _.isNull(ott) || _.isUndefined(ott)) {
        res.statusCode = 400;
        res.send({
          error: 'OneTimeToken or AccountId missing!',
          errorCode: -2
        });
        return;
      }

      const getResult = await to(CacheAccess.Get('OTT-' + accountId));

      if (!_.isNull(getResult.error)) {
        throw getResult.error;
      }

      if (_.isEqual(ott, getResult.result)) {
        const newOTT = await OneTimeTokenProvider.GenerateOTT(accountId);
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

    const setResult = await to(CacheAccess.Set('OTT-' + accountId, newOTT, 900));

    if (!_.isNull(setResult.error)) {
      throw setResult.error;
    }

    return newOTT;
  }
}
