import { Router, Request, Response, NextFunction } from 'express';

import express = require('express');
const router = express.Router();

import { UserController } from '../controller/user-controller';

router.get('/', function (req:Request, res:Response, next:NextFunction) {
    console.log('/user called!');
    UserController.GetOrCreate(req.get('x-user-id'))
    .then(userData => {
        console.log('UserController.GetOrCreate then: ' + JSON.stringify(userData));
        res.send(userData);
    })
    .catch(error => {
        console.log('UserController.GetOrCreate catch: ' + error);
        res.send(error);
    });
});

module.exports = router;