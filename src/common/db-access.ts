import AWS = require('aws-sdk');
import _ = require('underscore');

import { AppLogger } from '../logging/app-logger';

export class DatabaseAccess {
  private static dynamodb: AWS.DynamoDB.DocumentClient = null;

  public static Init(appLogger: AppLogger) {
    AWS.config.update({
      region: 'eu-central-1',
      accessKeyId: '',
      secretAccessKey : ''
    });

    this.dynamodb = new AWS.DynamoDB.DocumentClient();

    appLogger.Info('DatabaseAccess Init!');
  }

  public static async Create(logger: AppLogger, params) {
    logger.Info('DB Create: ' + JSON.stringify(params));

    const dynamodb = this.dynamodb;
    return new Promise(function(resolve, reject) {
      dynamodb.put(params, function(error, data) {
        logger.Info('DB Created data:' + JSON.stringify(data) + ' error: ' + error);
        if (!_.isNull(error)) {
          return reject(error);
        }

        return resolve(data.Attributes);
      });
    });
  }

  public static async Get(logger: AppLogger, params) {
    logger.Info('DB Get: ' + JSON.stringify(params));
    const dynamodb = this.dynamodb;
    return new Promise(function(resolve, reject) {
      dynamodb.get(params, function(error, data) {
        logger.Info('DB Got data:' + JSON.stringify(data) + ' error: ' + error);
        if (!_.isNull(error)) {
          return reject(error);
        }

        return resolve(data.Item);
      });
    });
  }

  public static async Update(logger: AppLogger, params) {
    logger.Info('DB Update: ' + JSON.stringify(params));
    const dynamodb = this.dynamodb;
    return new Promise(function(resolve, reject) {
      dynamodb.update(params, function(error, data) {
        logger.Info('DB Updated data:' + JSON.stringify(data) + ' error: ' + error);
        if (!_.isNull(error)) {
          return reject(error);
        }

        return resolve(data.Attributes);
      });
    });
  }

  public static async Delete(logger: AppLogger, params) {
    logger.Info('DB Delete: ' + JSON.stringify(params));

    const dynamodb = this.dynamodb;
    return new Promise(function(resolve, reject) {
      dynamodb.delete(params, function(error, data) {
        logger.Info('DB Deleted data:' + JSON.stringify(data) + ' error: ' + error);
        if (!_.isNull(error)) {
          return reject(error);
        }

        return resolve(data.Attributes);
      });
    });
  }
}
