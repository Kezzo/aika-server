import { UserQuery } from '../queries/user-query';
import _ = require('underscore');

export class UserController {
  public static async GetOrCreate(userId:string) {
    console.debug('GetOrCreate for id: ' + userId);
    const userData = await UserQuery.GetUser(userId);
    console.debug('Got userData for id: ' + userId + ': ' + JSON.stringify(userData));
    // TODO: Create user when no user was found.
    return userData;
  }
}