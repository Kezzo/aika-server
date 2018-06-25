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

  public static async GetMany(keys: string[]) {
    return new Promise((resolve, reject) => {
      const commandsToExecture = new Array();

      for (const key of keys) {
        commandsToExecture.push(['GET', key]);
      }

      this.redisClient.BATCH(commandsToExecture).exec((error, results) => {
        if (error) {
          return reject (error);
        }

        resolve(results);
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

  public static async SetIfNotExistBatch(keyValuePairs: Array<{ key: string, value: string }>, timeToLife?: number) {
    return new Promise((resolve, reject) => {

      const commandsToExecture = new Array();

      for (const keyValuePair of keyValuePairs) {

        const commands = ['SET', keyValuePair.key, keyValuePair.value, 'NX'];

        if (timeToLife) {
          commands.push('EX');
          commands.push(timeToLife.toString());
        }

        commandsToExecture.push(commands);
      }

      this.redisClient.BATCH(commandsToExecture).exec((error, results) => {
        if (error) {
          return reject (error);
        }

        const addedKeys = new Set();
        for (let i = 0; i < keyValuePairs.length; i++) {
          const keyValuePair = keyValuePairs[i];

          if (i < results.length && results[i] === 'OK') {
            addedKeys.add(keyValuePair.key);
          }
        }

        resolve(addedKeys);
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
