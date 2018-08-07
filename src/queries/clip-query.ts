import { AppLogger } from '../logging/app-logger';
import { DatabaseAccess } from '../common/db-access';
import to from '../utility/to';

export class ClipQuery {
  public static async StoreClip(logger: AppLogger, clipData: string) {
    const params: any = {
      TableName: 'CLIPS',
      Item: clipData
    };

    const storeClipAsyncResult = await to(DatabaseAccess.Put(logger, params));

    if (storeClipAsyncResult.error) {
      throw storeClipAsyncResult.error;
    }

    return storeClipAsyncResult.result;
  }

  public static async GetClipsFromUser(logger: AppLogger, accountId: string,
    oldestCreationTimestamp?: number, count?: number) {

    const params: any = {
      TableName: 'CLIPS'
    };

    DatabaseAccess.AddQueryParams(params, 'ACCID', accountId, 'ACCID-CLPTS', false, count, true);

    if (oldestCreationTimestamp) {
      DatabaseAccess.AddQuerySecondaryKeyCondition(params, 'CLPTS', oldestCreationTimestamp, '<');
    }

    const getClipsAsyncResult = await to(DatabaseAccess.Query(logger, params));

    if (getClipsAsyncResult.error) {
      throw getClipsAsyncResult.error;
    }

    return getClipsAsyncResult.result;
  }

  public static async GetEpisodeClipsFromUser(logger: AppLogger, accountId: string,
    episodeId: string, count?: number, lastEvaluatedKeyToUse?: string, includeLastEvaluatedKey?: boolean) {
    const params: any = {
      TableName: 'CLIPS'
    };

    DatabaseAccess.AddQueryParams(params, 'EID', episodeId, null, false, count, true);
    DatabaseAccess.AddQuerySecondaryKeyCondition(params, 'ACCIDX', accountId, 'begins_with');

    if (lastEvaluatedKeyToUse) {
      params.ExclusiveStartKey = lastEvaluatedKeyToUse;
    }

    const getClipsAsyncResult = await to(DatabaseAccess.Query(logger, params, includeLastEvaluatedKey));

    if (getClipsAsyncResult.error) {
      throw getClipsAsyncResult.error;
    }

    return getClipsAsyncResult.result;
  }
}
