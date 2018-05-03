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

    public static async Create(params)
    {
        console.log('DB Create: ' + JSON.stringify(params));

        const dynamodb = this.dynamodb;
        return new Promise(function(resolve, reject) {
            dynamodb.put(params, function(error, data) {
                console.log('DB Created data:' + JSON.stringify(data) + ' error: ' + error);
                if(!_.isNull(error)) {
                    return reject(error);
                }

                return resolve(data);
            });
        });
    }

    public static async Get(params)
    {
        console.log('DB Get: ' + JSON.stringify(params));
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

    public static async Update(params)
    {
        console.log('DB Update: ' + JSON.stringify(params));
        const dynamodb = this.dynamodb;
        return new Promise(function(resolve, reject) {
            dynamodb.update(params, function(error, data) {
                console.log('DB Updated data:' + JSON.stringify(data) + ' error: ' + error);
                if(!_.isNull(error)) {
                    return reject(error);
                }

                return resolve(data);
            });
        });
    }

    public static async Delete(params)
    {
        console.log('DB Delete: ' + JSON.stringify(params));

        const dynamodb = this.dynamodb;
        return new Promise(function(resolve, reject) {
            dynamodb.delete(params, function(error, data) {
                console.log('DB Deleted data:' + JSON.stringify(data) + ' error: ' + error);
                if(!_.isNull(error)) {
                    return reject(error);
                }

                return resolve(data);
            });
        });
    }
}