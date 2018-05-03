import { Express, Router } from 'express';
import fs = require('fs');

export class RouteLoader {
    public static LoadRoutes (expressApp: Express) {
        fs.readdirSync(__dirname + '/routes').forEach(routeFile => {
            const routeName = routeFile.split('.')[0]; // to ignore file endings.
            const router = require('./routes/' + routeName);
            expressApp.use('/'+routeName, router);
        });
    }
};