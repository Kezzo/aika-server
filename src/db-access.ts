import AWS = require('aws-sdk');
import _ = require('underscore');

export class DatabaseAccess {
    static dynamodb: AWS.DynamoDB.DocumentClient = null;

    public static Init()
    {
        AWS.config.update({
            region: "eu-west-1",
            accessKeyId: "",
            secretAccessKey : ""
          });
        
        this.dynamodb = new AWS.DynamoDB.DocumentClient();

        console.log('DatabaseAccess Init!');
    }

    public static async Get(params)
    {
        console.log('DB Get: ' + JSON.stringify(params));
        console.log('dynamodb undefined? ' + _.isUndefined(this.dynamodb));
        const dynamodb = this.dynamodb;
        return new Promise(function(resolve, reject) {
            dynamodb.get(params, function(error, data) {
                console.log('DB Got data:' + JSON.stringify(data) + ' error: ' + error);
                if(!_.isNull(error)) {
                    return reject(error);
                }

                return resolve(data);
            });
        });
    }
}