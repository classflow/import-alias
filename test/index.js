import { expect } from 'chai';
import * as app from '../src';
import path from 'path';
import fs from 'fs';
import fixtureCompare, {setLogging} from 'fixture-compare';

setLogging(true);

const fixtures = path.join(__dirname, 'fixtures');
const aliasPaths = {
  A: path.join(fixtures, 'foo/bar/baz/A.js'),
  ANewPath: path.join(fixtures, 'a/b/some/new/path/A.js'),
  B: path.join(fixtures, 'foo/B.js'),
  Component1: path.join(fixtures, 'foo/bar/Component1.es6'),
};

const importingFiles = {
  c: path.join(fixtures, 'a/b/c.js'),
  'unknown-alias': path.join(fixtures, 'importers/unknown-alias'),
};

describe('finding files', () => {
  it('should find all js files recursively', () => {
    return app.findFiles(fixtures).then(files => {
      expect(files.length).to.equal(5);
    });
  });
});

describe('finding alias definitions', () => {
  it('should produce a map of "alias": "absolute_path"', () => {
    return app.findAliases(fixtures).then(aliases => {
      const expected = {
        A: aliasPaths.A,
        B: aliasPaths.B,
        Component1: aliasPaths.Component1,
      };
      return expect(aliases).to.eql(expected);
    });
  });

  it('should warn about duplicate alias definitions');
});

describe('replacing alias imports', () => {
  describe('two imported aliases', () => {
    it('should replace correctly', () => {
      const fixture = 'a/b/import-two-aliases';
      const aliases = {
        A: aliasPaths.A,
        B: aliasPaths.B,
      };
      const inputFilePath = importingFiles.c;

      const transform = (inputTxt) => {
        return app.replaceImports(aliases, inputTxt, inputFilePath);
      };

      expect(fixtureCompare(fixture, transform)).to.equal(true);
    });
  });

  describe('previously replaced imports', () => {
    it('should replace correctly', () => {
      const fixture = 'a/b/re-replacing';
      const aliases = {
        A: aliasPaths.ANewPath,
        B: aliasPaths.B,
      };
      const inputFilePath = importingFiles.c;

      const transform = (inputTxt) => {
        return app.replaceImports(aliases, inputTxt, inputFilePath);
      };

      expect(fixtureCompare(fixture, transform)).to.equal(true);
    });
  });

  describe('when importing an unknown alias', () => {
    it('should throw', () => {
      const inputFilePath = importingFiles['unknown-alias'];
      const aliases = {};
      const inputText = fs.readFileSync(inputFilePath, 'utf8');
      const fn = () => {
        app.replaceImports(aliases, inputText, inputFilePath);
      };

      expect(fn).to
        .throw('You are trying to import "@unknown" but it is not defined.');
    });
  });
});
