import { AppLogger } from '../logging/app-logger';
import { LambdaAccess } from '../common/lambda-access';

export class PodcastTasks {
  public static async InvokePodcastImport(logger: AppLogger, payload: object) {
    logger.Info('Invoking podcast import task with payload: ' + JSON.stringify(payload));
    return await LambdaAccess.InvokeLambda('aika-dev-podcast-import', JSON.stringify(payload));
  }
}
