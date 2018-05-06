import { DatabaseAccess } from '../common/db-access';
import { AppLogger } from '../logging/app-logger';

export class UserQuery {
  public static async GetUser(logger: AppLogger, userId) {
    logger.Info('GetUser for id: ' + userId);
    const userData = await DatabaseAccess.Get(logger, {
      TableName: 'users',
      Key: { ID: userId }
    });

    logger.Info('Got data for id: ' + userId + ': ' + JSON.stringify(userData));
    return userData;
  }
}
