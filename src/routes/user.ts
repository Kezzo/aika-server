import { Router, Request, Response, NextFunction } from 'express';

import express = require('express');
const router = express.Router();

router.get('/', function (req:Request, res:Response, next:NextFunction) {
    res.send('User endpoint called!');
});

module.exports = router;