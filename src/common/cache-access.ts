import _ = require('underscore');
import redis = require('redis');

import { AppLogger } from '../logging/app-logger';

export class CacheAccess {
  private static redisClient: redis.RedisClient;

  public static Init(logger: AppLogger) {
    this.redisClient = redis.createClient({
      host: this.GetCacheEndpoint(),
      port: 6379
    });
  }

  public static async Get(key: string) {
    return new Promise((resolve, reject) => {
      this.redisClient.GET(key, (error, data) => {
        if (!_.isNull(error)) {
          return reject (error);
        }

        resolve(data);
      });
    });
  }

  public static async Set(key: string, value: string, timeToLife?: number) {
    return new Promise((resolve, reject) => {
      this.redisClient.SET(key, value, 'EX', timeToLife, (error, success) => {
        if (!_.isNull(error)) {
          return reject (error);
        }

        resolve(success);
      });
    });
  }

  public static async Delete(...keys: string[]) {
    return new Promise((resolve, reject) => {
      this.redisClient.DEL(keys, (error, success) => {
        if (!_.isNull(error)) {
          return reject (error);
        }

        resolve(success);
      });
    });
  }

  private static GetCacheEndpoint() {
    switch (process.env.NODE_ENV) {
    case 'DEV':
      return 'dev-aika-redis.nyrfwx.0001.euw1.cache.amazonaws.com';
    case 'LOCAL':
      return 'localhost';
    }
  }
}
