import fileFinder from './file-finder';
import fs from 'fs';
import path from 'path';

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
};

// Returns relative path without file extension.
function getRelativePath(fromFile, toFile) {
  return path.relative(fromFile, toFile)
    .replace(/\.\w+$/, '');
}

function getAliasFromMarker(marker) {
  return marker.replace(/@(\w+)/, '$1');
}

export const replaceImports = (aliases, input, inputFilePath) => {
  let result = input;
  const reImportRegex = /(from ['"])(.+)(['"];?)(.*(@\w+))?/g;
  result = result.replace(reImportRegex, (orig, from, importString, afterString, tailMarker, tailAlias) => {
    let alias;

    // Should we use the tailMarker or the importString?
    if (tailAlias) {
      alias = getAliasFromMarker(tailAlias);
    } else {

      // Is importString an alias?
      if (/@\w+/.test(importString)) {
        alias = getAliasFromMarker(importString);
      } else {

        // TODO: don't replace all imports, update regex to search for marker in
        // importString.

        // Bail, this isn't one we need to change.
        return orig;
      }
    }

    const aliasFilePath = aliases[alias];

    if (!aliasFilePath) {
      console.log('aliases', aliases);
      throw new Error(
        `You are trying to import "@${alias}" but it is not defined.`);
    }

    const relativePath = getRelativePath(inputFilePath, aliasFilePath);
    const result = `${from}${relativePath}${afterString} // @${alias}`;
    return result;
  });

  return result;
};
