import AWS = require('aws-sdk');
import { AWSError } from 'aws-sdk';
import { StartExecutionInput, StartExecutionOutput } from 'aws-sdk/clients/stepfunctions';

export class StepFunctionsAccess {
  public static async StartExecution(stateMachineArn: string, input: string) {
    return new Promise((resolve, reject) => {
      const params: StartExecutionInput = {
        stateMachineArn,
        input
      };

      const stepFunctions = new AWS.StepFunctions();
      stepFunctions.startExecution(params, (error: AWSError, data: StartExecutionOutput) => {
        if (error) {
          return reject(error);
        }

        return resolve(data);
      });
    });
  }
}
