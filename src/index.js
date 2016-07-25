import fileFinder from './file-finder';
import fs from 'fs';

const extensionRegex = /\.(js(x)?|es6)$/;

export const findFiles = (dirPath) =>
  fileFinder(dirPath).then(files => {
    return files.filter(filePath =>
      extensionRegex.test(filePath)
    )
  });

/**
* Produces alias defined in filePath, if present.
* @param {String} filePath
* @return {Promise} - {String/undefined}
*/
function getFileAlias(filePath) {
  const aliasDefinitionRegex = /@alias\s+(\w+)/g;

  return new Promise((resolve, reject) => {

    // TODO: split out find in file
    fs.readFile(filePath, 'utf8', (err, contents) => {
      if (err) {
        reject(err);
      }

      aliasDefinitionRegex.lastIndex = 0;
      const result = aliasDefinitionRegex.exec(contents);

      if (result !== null) {
        resolve(result[1]);
      } else {
        resolve();
      }
    });
  });
}

/**
* Produces a map of alias: absolute_path for all files in dirPath.
* @param {String} dirPath
* @return {Promise} - resolves with { alias: absolute_path }
*/
export const findAliases = (dirPath) => {
  return findFiles(dirPath).then(files => {

    return Promise.all(files.map(file => {
      return getFileAlias(file);
    })).then(fileAliases => {
      const result = {};

      fileAliases.map((alias, i) => {
        if (alias) {
          result[alias] = files[i];
        }
      });

      return result;
    });
  });
}
