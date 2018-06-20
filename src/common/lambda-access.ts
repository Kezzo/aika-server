import AWS = require('aws-sdk');
import { InvocationRequest, InvocationResponse } from 'aws-sdk/clients/lambda';
import { AWSError } from 'aws-sdk';

export class LambdaAccess {
  public static async InvokeLambda(functionName: string, payload: any) {
    return new Promise((resolve, reject) => {
      const params: InvocationRequest = {
        ClientContext: 'aika-dev',
        FunctionName: functionName,
        InvocationType: 'Event',
        Payload: payload
      };

      const lambda = new AWS.Lambda();
      lambda.invoke(params, (error: AWSError, data: InvocationResponse) => {
        if (error) {
          reject(error);
        }

        resolve(data);
      });
    });
  }
}
