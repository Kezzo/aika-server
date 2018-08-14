import _ = require('underscore');
import fs = require('fs');
import path = require('path');

export class StaticFileAccess {
  private static loadFileData = new Map();

  public static async LoadFiles(pathsToLoad: string[]) {
    return new Promise((resolve, reject) => {
      Promise.all(_.map(pathsToLoad, (pathToLoad) => {
        return this.LoadFile(pathToLoad);
      }))
      .then((loadedData) => {
        for (let i = 0; i < pathsToLoad.length; i++) {
          StaticFileAccess.loadFileData.set(pathsToLoad[i], loadedData[i]);
        }

        return resolve();
      })
      .catch((error) => {
        return reject(error);
      });
    });
  }

  public static GetFileData(pathOfFile: string) {
    return this.loadFileData.get(pathOfFile);
  }

  private static async LoadFile(pathToLoad: string) {
    return new Promise((resolve, reject) => {
      const topListPath = path.join(__dirname, '/../../', pathToLoad);
      fs.readFile(topListPath, (error, data) => {

        if (error) {
          return reject(error);
        }

        let dataToReturn = data.toString();

        if (pathToLoad.endsWith('json')) {
          dataToReturn = JSON.parse(dataToReturn);
        }

        return resolve(dataToReturn);
      });
    });
  }
}
