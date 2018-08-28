import AWS = require('aws-sdk');
import _ = require('underscore');
import { EnvironmentHelper } from '../utility/environment-helper';
import { Environment } from '../utility/environment';

export class FirehoseStream {
  private static firehose: AWS.Firehose;
  private static logBuffer;

  public static async Init() {
    this.firehose = new AWS.Firehose(FirehoseStream.GetConfig());
    this.logBuffer = [];
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

  public static PutRecords(dataToPut: string[], onSendCallback?: () => void) {
    this.firehose.putRecordBatch({
      DeliveryStreamName: FirehoseStream.GetDeliveryStreamName(),
      Records: _.map(dataToPut, (entry) => ({ Data: entry }))
    }, (err: AWS.AWSError, data: AWS.Firehose.PutRecordBatchOutput) => {
      if (!_.isNull(err)) {
        // tslint:disable-next-line:no-console
        console.error('Error putting record to kinesis: ' + err);
      }

      if (onSendCallback) {
        onSendCallback();
      }
    });
  }

  public static write(stringToWrite: string) {
    this.logBuffer.push(stringToWrite);

    if (this.logBuffer.length >= 10) {
      FirehoseStream.PutRecords(this.logBuffer.splice(0, 10));
    }
  }

  public static async FlushBuffer() {
    return new Promise((resolve) => {
      FirehoseStream.PutRecords(this.logBuffer, () => {
        return resolve();
      });
      this.logBuffer = [];
    });
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
