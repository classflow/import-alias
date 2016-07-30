#!/usr/bin/env node

import fileFinder, {setIgnoredDirs} from './file-finder';
import fs from 'fs';
import path from 'path';

const extensionRegex = /\.(js(x)?|es6)$/;
const aliasDefinitionRegex = /@alias\s+([^\s'"]+)/g;

export const findFiles = (dirPath) =>
  fileFinder(dirPath).then(files => {
        return files.filter(filePath =>
          extensionRegex.test(filePath)
      );
  });

/**
* Produces alias defined in filePath, if present.
* @param {String} filePath
* @return {Promise} - {String/undefined}
*/

function getFileAlias(filePath) {
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
    console.log('files to check for aliases');
    console.log(files);
    return Promise.all(files.map(file => {
      return getFileAlias(file);
    })).then(fileAliases => {
      const result = {};

      fileAliases.map((alias, i) => {
        if (alias) {

          if (result[alias]) {
            console.warn(`"${alias}" has already been defined as an alias.\n${alias}: ${result[alias]}`)
          }

          result[alias] = files[i];
        }
      });

      return result;
    });
  });
};

const indexRegex = /[\/\\]index$/;

// Returns relative path without file extension.
function getRelativePath(fromFile, toFile) {
  let newPath = path.relative(path.join(fromFile, '..'), toFile)
    .replace(/\.\w+$/, '')
    .replace(indexRegex, '');

  if (newPath[0] !== '.') {
    newPath = `.${path.sep}${newPath}`;
  }

  return newPath;
}

function getAliasFromMarker(marker) {
    if (marker[0] === '@') {
        return marker.replace(/@([^\s'"]+)/, '$1');
    }
}

function logAliases(aliases) {
  const keys = Object.keys(aliases).sort();
  console.log(`\n${keys.length} known aliases:`);
  keys.map((alias, i) => {
    console.log(`${i + 1}. ${alias}\n   ${aliases[alias]}`);
  })
}

export const replaceImports = (aliases, input, inputFilePath) => {
  let result = input;
  const reImportRegex = /(from ['"])(.+)(['"];?)(.*(@[^\s'"]+))?/g;

  // TODO: Test for an import using a marker instead of replacing everything.
  result = result.replace(reImportRegex, (orig, from, importString, afterString, tailMarker, tailAlias) => {
      const alias = getAliasFromMarker(tailAlias || importString);
      const aliasFilePath = aliases[alias];

      if (!alias) {
          return orig;
      }

      if (!aliasFilePath) {
          if (process.env.NODE_ENV !== 'test') {
              logAliases(aliases);
          }
          throw new Error(
              `You are trying to import "@${alias}" but it is not defined.`);
          }

          const relativePath = getRelativePath(inputFilePath, aliasFilePath);
          const result = `${from}${relativePath}${afterString} // @${alias}`;

          return result;
      });

  return result;
};

export function transform(srcDir) {
  console.log(`running import-alias on ${srcDir}`);
  return findAliases(srcDir).then(aliases => {
      logAliases(aliases);

    if (Object.keys(aliases).length) {
      findFiles(srcDir).then(files => {

          try {
              files.map(file => {
                  const content = fs.readFileSync(file, 'utf8');
                  const transformed = replaceImports(aliases, content, file);

                  if (transformed !== content) {
                      fs.writeFileSync(file, transformed);
                      console.log(`transformed ${file}`);
                  }
              });
          } catch (e) {
              console.log('Dang it.', e);
          }
      });
    } else {
        console.log('No aliases found.\nhttps://github.com/classflow/import-alias#defining');
    }
  }).catch(e => {
      console.log('error finding aliases', e);
  });
}

// If this is the main module, run it.
if (require.main === module) {
  const srcDir = process.cwd();
  transform(srcDir);
}

export function ignore(dirs) {
  setIgnoredDirs(dirs);
}
