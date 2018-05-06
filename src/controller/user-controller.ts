import _ = require('underscore');

import { UserQuery } from '../queries/user-query';
import { AppLogger } from '../logging/app-logger';

export class UserController {
  public static async GetOrCreate(logger: AppLogger, userId: string) {
    const userData = await UserQuery.GetUser(logger, userId);
    // TODO: Create user when no user was found.
    return userData;
  }
}
