import path from 'path';
import fs from 'fs';

function statFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (err, stats) => {
      return err
        ? reject(err)
        : resolve(stats);
    });
  });
}

export const findFiles = (dirPath) => {
  return new Promise((resolve, reject) => {
    fs.readdir(dirPath, (err, files) => {
      if (err) {
        reject(err);
      }

      // stat each file
      const statPromises = files.map(file => {
        const filePath = path.join(dirPath, file);
        return statFile(filePath);
      });

      const dirPromises = [];
      const resolvedFiles = [];

      return Promise.all(statPromises).then(fileStats => {
        fileStats.map((stats, i) => {
          if (stats.isDirectory()) {
            dirPromises.push(
              findFiles(path.join(dirPath, files[i]))
            )
          } else {
            resolvedFiles.push(path.join(dirPath, files[i]));
          }
        });

        return Promise.all(dirPromises).then(dirs => {
          let results = resolvedFiles.slice(0);

          dirs.map(dirResult => {
            results = results.concat(dirResult);
          });

          resolve(results)
        }, reject);

      }, reject);
    });
  });
};
