import fileFinder from './file-finder';

const extensionRegex = /\.(js(x)?|es6)$/;

export const findFiles = (dirPath) =>
  fileFinder(dirPath).then(files => {
    return files.filter(filePath => 
      extensionRegex.test(filePath)
    )
  });
