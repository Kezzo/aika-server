import { AppLogger } from '../logging/app-logger';
import { LambdaAccess } from '../common/lambda-access';
import to from '../utility/to';
import { StepFunctionsAccess } from '../common/step-functions-access';

export class PodcastTasks {
  public static async InvokePodcastImport(logger: AppLogger, payload: object) {
    return new Promise(async (resolve, reject) => {
      logger.Info('Invoking podcast import task with payload: ' + JSON.stringify(payload));

      const lambdaStartAsyncResult = await to(LambdaAccess.InvokeLambda('aika-dev-podcast-import', JSON.stringify(payload)));

      if (lambdaStartAsyncResult.error) {
        return reject(lambdaStartAsyncResult.error);
      }

      return resolve(payload);
    });
  }

  public static async StartEpisodeImport(logger: AppLogger, podcastId: string) {
    logger.Info('Invoking episode import step function with podcastId: ' + podcastId);

    return StepFunctionsAccess.StartExecution(
      'arn:aws:states:eu-west-1:503165322814:stateMachine:aika-continuous-episode-import', podcastId);
  }
}
