import { Router, Request, Response } from 'express';

import express = require('express');
import expressRequestId = require('express-request-id');
import AWS = require('aws-sdk');

AWS.config.update({
  region: "eu-west-1"/*,
  accessKeyId: process.env.DYNAMODB_ACCESS_KEY_ID,
  secretAccessKey : process.env.DYNAMODB_SECRET_ACCESS_KEY*/
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

const app = express();

app.use(expressRequestId());

const port = 3075;

app.get('/', function (req:Request, res: Response) {

  dynamodb.get({
    TableName: "users",
    Key: { "ID": "12345" }
  }, function(error, data){
    res.send('Pong! Loaded data: ' + JSON.stringify(data));
  });
  //console.log('request id: ' + req.id);
})

app.listen(port);
console.log('aika server running on port: ' + port);