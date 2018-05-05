import { Express, Router } from 'express';
import fs = require('fs');
import path = require('path');

export class RouteLoader {
  public static LoadRoutes(expressApp: Express) {
    fs.readdirSync(path.join(__dirname + '/..' + '/routes')).forEach((routeFile) => {
      const routeName = routeFile.split('.')[0]; // to ignore file endings.
      const router = require(path.join('..' + '/routes/' + routeName));
      expressApp.use('/' + routeName, router);
    });
  }
}
