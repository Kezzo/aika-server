import AWS = require('aws-sdk');
import { InvocationRequest, InvocationResponse } from 'aws-sdk/clients/lambda';
import { AWSError } from 'aws-sdk';
import { EnvironmentHelper } from '../utility/environment-helper';
import { Environment } from '../utility/environment';

export class LambdaAccess {
  public static async InvokeLambda(functionName: string, payload: any) {
    return new Promise((resolve, reject) => {
      const params: InvocationRequest = {
        ClientContext: LambdaAccess.GetClientContext(),
        FunctionName: functionName,
        InvocationType: 'Event',
        Payload: payload
      };

      const lambda = new AWS.Lambda();
      lambda.invoke(params, (error: AWSError, data: InvocationResponse) => {
        if (error) {
          return reject(error);
        }

        return resolve(data);
      });
    });
  }

  private static GetClientContext() {
    switch (EnvironmentHelper.GetEnvironment()) {
    case Environment.LIVE:
      return 'aika-live';
    case Environment.DEV:
      return 'aika-dev';
    case Environment.LOCAL:
      return 'aika-local';
    }
  }
}
