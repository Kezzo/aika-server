import { Router, Request, Response } from 'express';

import express = require('express');
import expressRequestId = require('express-request-id');

import { DatabaseAccess } from './common/db-access';
import { RouteLoader } from './common/route-loader';

const app = express();
app.use(expressRequestId());

const port = 3075;

// used for healthcheck
app.get('/', function (req:Request, res: Response) {
  console.log('healthcheck ping received!');
  res.send(); 
  //console.log('request id: ' + req.id);
})

DatabaseAccess.Init();
RouteLoader.LoadRoutes(app);

app.listen(port);
console.log('aika server running on port: ' + port);