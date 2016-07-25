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

export const replaceImports = (aliases, input, inputFilePath) => {

  let result = input;

  const importRegex = /(import.+from\s+['"])(@(\w+))(.+)/g;
  result = input.replace(importRegex, (orig, m1, aliasMarker, importedAlias, m4) => {

    // console.log('What marker did we find?', importedAlias);

    // console.log('m1', m1);
    // console.log('aliasMarker', aliasMarker);
    // console.log('importedAlias', importedAlias);
    // console.log('m4', m4);

    // Does the list of aliases have an entry for this?
    const aliasFilePath = aliases[importedAlias];

    if (!aliasFilePath) {
      console.log('aliases', aliases);
      throw new Error(
        `You are trying to import "${aliasMarker}" but it is not defined.`);
    }

    const relativePath = getRelativePath(inputFilePath, aliasFilePath);
    const marker = `// @${importedAlias}`;

    return `${m1}${relativePath}${m4} ${marker}`;
  });

  return result;
};
