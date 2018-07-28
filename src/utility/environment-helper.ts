import { Environment } from './environment';

export class EnvironmentHelper {
  public static GetServerUrl() {
    switch (EnvironmentHelper.GetEnvironment()) {
    case Environment.DEV:
      return 'https://dev.aika.cloud.tinkrinc.co';
    case Environment.LOCAL:
      return 'http://localhost:3075';
    }
  }

  public static GetEnvironment() {
    switch (process.env.NODE_ENV) {
    case 'LIVE':
      return Environment.LIVE;
    case 'DEV':
      return Environment.DEV;
    case 'LOCAL':
      return Environment.LOCAL;
    }
  }
}
