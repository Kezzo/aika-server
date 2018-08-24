import { AppLogger } from '../logging/app-logger';
import to from '../utility/to';
import { StepFunctionsAccess } from '../common/step-functions-access';
import { EnvironmentHelper } from '../utility/environment-helper';
import { Environment } from '../utility/environment';

export class PodcastTasks {
  public static async InvokePodcastImport(logger: AppLogger) {
    return new Promise(async (resolve, reject) => {
      logger.Info('Invoking podcast import step function');

      const podcastImportStartAsyncResult = await to(StepFunctionsAccess.StartExecution(PodcastTasks.GetPodcastImportArn(), ''));

      if (podcastImportStartAsyncResult.error) {
        return reject(podcastImportStartAsyncResult.error);
      }

      return resolve();
    });
  }

  public static async StartEpisodeImport(logger: AppLogger, podcastId: string) {
    logger.Info('Invoking episode import step function with podcastId: ' + podcastId);

    return StepFunctionsAccess.StartExecution(PodcastTasks.GetEpisodeImportArn(), JSON.stringify({ podcastId }));
  }

  private static GetPodcastImportArn() {
    switch (EnvironmentHelper.GetEnvironment()) {
    case Environment.LIVE:
      return 'arn:aws:states:us-east-1:503165322814:stateMachine:aika-live-podcast-import';
    case Environment.DEV:
      return 'arn:aws:states:eu-west-1:503165322814:stateMachine:aika-podcast-import';
    case Environment.LOCAL:
      return 'arn:aws:states:eu-west-1:503165322814:stateMachine:aika-podcast-import';
    }
  }

  private static GetEpisodeImportArn() {
    switch (EnvironmentHelper.GetEnvironment()) {
    case Environment.LIVE:
      return 'arn:aws:states:us-east-1:503165322814:stateMachine:aika-live-continuous-episode-import';
    case Environment.DEV:
      return 'arn:aws:states:eu-west-1:503165322814:stateMachine:aika-continuous-episode-import';
    case Environment.LOCAL:
      return 'arn:aws:states:eu-west-1:503165322814:stateMachine:aika-continuous-episode-import';
    }
  }
}
