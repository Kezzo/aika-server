import { DatabaseAccess } from '../common/db-access';

export class UserQuery {
    public static async GetUser(userId) {
        console.debug('GetUser for id: ' + userId);
        const userData = await DatabaseAccess.Get({
            TableName: "users",
            Key: { "ID": userId }
          });

          console.debug('Got data for id: ' + userId + ': ' + JSON.stringify(userData));
          return userData;
    }
}