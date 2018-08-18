import AWS = require('aws-sdk');
import _ = require('underscore');
import { EnvironmentHelper } from '../utility/environment-helper';
import { Environment } from '../utility/environment';

export class FirehoseStream {
  private static firehose: AWS.Firehose;

  public static async Init() {
    this.firehose = new AWS.Firehose(FirehoseStream.GetConfig());
  }

  public static PutRecord(dataToPut: string) {
    this.firehose.putRecord({
      DeliveryStreamName: FirehoseStream.GetDeliveryStreamName(),
      Record: {
        Data: dataToPut
      }
    }, (err: AWS.AWSError, data: AWS.Firehose.PutRecordOutput) => {
      if (!_.isNull(err)) {
        // tslint:disable-next-line:no-console
        console.error('Error putting record to kinesis: ' + err);
      }
    });
  }

  public static write(stringToWrite: string) {
    this.PutRecord(stringToWrite);
  }

  private static GetDeliveryStreamName() {
    switch (EnvironmentHelper.GetEnvironment()) {
    case Environment.LIVE:
      return 'aika-live-firehose-log-delivery-stream';
    case Environment.DEV:
      return 'aika-dev-firehose-delivery-stream';
    case Environment.LOCAL:
      return 'aika-dev-firehose-delivery-stream';
    }
  }

  private static GetConfig() {
    switch (EnvironmentHelper.GetEnvironment()) {
    case Environment.LIVE:
      return {
        endpoint: 'firehose.us-east-1.amazonaws.com',
        region: 'us-east-1',
        sslEnabled: true,
        accessKeyId: '',
        secretAccessKey : ''
      };
    case Environment.DEV:
      return {
        endpoint: 'firehose.eu-west-1.amazonaws.com',
        region: 'eu-west-1',
        sslEnabled: true,
        accessKeyId: '',
        secretAccessKey : ''
      };
    case Environment.LOCAL:
      return {
        endpoint: 'firehose.eu-west-1.amazonaws.com',
        region: 'eu-west-1',
        sslEnabled: true,
        accessKeyId: '',
        secretAccessKey : ''
      };
    }
  }
}
