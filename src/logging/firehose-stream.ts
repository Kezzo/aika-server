import AWS = require('aws-sdk');
import _ = require('underscore');

export class FirehoseStream {
  private static firehose: AWS.Firehose;

  public static async Init() {
    this.firehose = new AWS.Firehose({
      endpoint: 'firehose.eu-central-1.amazonaws.com',
      region: 'eu-central-1',
      sslEnabled: true,
      accessKeyId: '',
      secretAccessKey : ''
    });
  }

  public static PutRecord(dataToPut: string) {
    this.firehose.putRecord({
      DeliveryStreamName: 'aika-dev-firehose-delivery-stream',
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
}
