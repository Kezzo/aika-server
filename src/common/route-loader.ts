import _ = require('underscore');
import fs = require('fs');
import path = require('path');

import { Express, Router } from 'express';
import { AppLogger } from '../logging/app-logger';

export class RouteLoader {
  public static LoadRoutes(logger: AppLogger, expressApp: Express) {
    this.LoadRoutesFromDirectory('', logger, expressApp);
  }

  private static LoadRoutesFromDirectory(sourceDirectory: string, logger: AppLogger, expressApp: Express) {
    const filesInDirectory = fs.readdirSync(path.join(__dirname + '/..' + '/routes' + sourceDirectory));

    for (const file of filesInDirectory) {
      // to ignore file endings.
      const splitFileNames = file.split('.');
      const fileName = splitFileNames[0];
      const filePath = sourceDirectory + '/' + fileName;
      // if no file ending than it's a directory.
      if (splitFileNames.length === 1) {
        this.LoadRoutesFromDirectory(filePath, logger, expressApp);
      } else {
        const fullFilePath = path.join('..' + '/routes/' + filePath);
        const router = require(fullFilePath);
        expressApp.use(filePath, router);
        logger.Info('Loaded ' + fileName + ' routes');
      }
    }
  }
}
