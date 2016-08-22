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
    return Promise.all(files.map(file => {
      return getFileAlias(file);
    })).then(fileAliases => {
      const result = {};
      const dupes = {};

        fileAliases.map((alias, i) => {
            if (alias) {

                if (result[alias]) {
                    dupes[alias] = dupes[alias] || {
                        alias,
                        definitions: [],
                    };

                    dupes[alias].definitions.push(files[i]);
                } else {
                    result[alias] = files[i];
                }
            }
        });

        Object.keys(dupes).map(alias => {
            const dupe = dupes[alias];
            console.log(`"@${alias}" will be ignored.  It was defined multiple times:`);
            const definitions = dupe.definitions;

            definitions.unshift(result[alias]);
            definitions.map(definition => {
                console.log(`* ${definition}`);
            });
            delete result[dupe.alias];
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
  keys.map(alias => {
      console.log(`* ${alias}: ${aliases[alias]}`);
  });
  console.log('');
}

function missingAliasFilePath(inputFilePath, alias) {
  throw new Error(
    `${inputFilePath} is trying to import "@${alias}" but it is not defined.`);
}

export const replaceImports = (aliases, input, inputFilePath) => {
  let result = input;
  const initialImportRegex = /(['"])(@[^\s]+)(['"].*)/g;
  const reImportRegex = /(['"])(.+)(['"].*)(@[^\s]+)/g;


  // TODO: Test for an import using a marker instead of replacing everything.
  result = result.replace(reImportRegex, (orig, a, b, c, d) => {
    const alias = getAliasFromMarker(d);
    const aliasFilePath = aliases[alias];

    if (!alias) {
        return orig;
    }

    if (!aliasFilePath) {
      missingAliasFilePath(inputFilePath, alias);

    }

    const relativePath = getRelativePath(inputFilePath, aliasFilePath);
    return `${a}${relativePath}${c}@${alias}`;
  });

  result = result.replace(initialImportRegex, (orig, a, b, c) => {
    const alias = getAliasFromMarker(b);
    const aliasFilePath = aliases[alias];

    if (!alias) {
        return orig;
    }

    if (!aliasFilePath) {
      missingAliasFilePath(inputFilePath, alias);
    }

    const relativePath = getRelativePath(inputFilePath, aliasFilePath);
    return `${a}${relativePath}${c} // @${alias}`;
  });

  return result;
};

function isVerbose() {
    return process.argv.indexOf('-v') > -1;
}

function logResults(results) {
    logAliases(results.aliases);

    console.log(`${results.transformedFiles.length} transformed files:`);
    results.transformedFiles.map(file => {
        console.log(`* ${file}`);
    });
    console.log('');
}

export function transform(srcDir) {
    const results = {
        transformedFiles: [],
        aliases: {},
    };

  return findAliases(srcDir)
    .then(aliases => {
        results.aliases = aliases;

        if (Object.keys(aliases).length) {
          return findFiles(srcDir).then(files => {

            try {
                files.map(file => {
                    const content = fs.readFileSync(file, 'utf8');
                    const transformed = replaceImports(aliases, content, file);

                    if (transformed !== content) {
                        fs.writeFileSync(file, transformed);
                        results.transformedFiles.push(file)
                        //   console.log(`transformed ${file}`);
                    }
                });
            } catch (e) {
                console.log('\nDang it.\n', e.message);

                if (e.message.match('not defined')) {
                    logAliases(aliases);
                }
            }

          });
        } else {
            console.log('No aliases found.\nhttps://github.com/classflow/import-alias#defining');
        }
      })
    .then(() => {
        if (isVerbose()) {
            logResults(results);
        }
    })
    .catch(e => {
        console.log('error finding aliases', e);
    });
}

// If this is the main module, run it.
if (require.main === module) {
  const srcDir = process.cwd();
  transform(srcDir);
}

export function ignore(dirs) {
  setIgnoredDirs(dirs.slice(0));
}
