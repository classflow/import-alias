import chai, { expect } from 'chai';
import * as app from '../src';
import path from 'path';
import fs from 'fs';
import fixtureCompare, {setLogging} from 'fixture-compare';

chai.should();
setLogging(true);

const fixtures = path.join(__dirname, 'fixtures');
const aliasPaths = {
  A: path.join(fixtures, 'foo/bar/baz/A.js'),
  ANewPath: path.join(fixtures, 'a/b/some/new/path/A.js'),
  B: path.join(fixtures, 'foo/B.js'),
  Component1: path.join(fixtures, 'foo/bar/Component1.es6'),
  'foo-mister_crazy123!!+': path.join(fixtures, 'crazy/nicknamed/module.js'),
  proxyquire: path.join(fixtures, 'proxyquire'),
  require: path.join(fixtures, 'require'),
};

const importingFiles = {
  c: path.join(fixtures, 'a/b/c.js'),
  'unknown-alias': path.join(fixtures, 'importers/unknown-alias'),
  'crazy-alias': path.join(fixtures, 'importers/crazy-alias'),
  proxyquire: path.join(fixtures, 'importers/proxyquire'),
  require: path.join(fixtures, 'importers/require'),
};

describe('finding files', () => {
  it('should find all js* files recursively', () => {
    return app.findFiles(fixtures).then(files => {
      expect(files.length).to.equal(7);
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
        'foo-mister_crazy123!!+': aliasPaths['foo-mister_crazy123!!+'],
      };
      return expect(aliases).to.eql(expected);
    });
  });

  it('should warn about duplicate alias definitions');
});

describe('replacing alias imports', () => {
  describe('files with no markers', () => {
    xit('should be skipped', () => {
      // TODO: figure out a way to test this
      const fixture = 'a/plain.js';
      const aliases = {
        A: aliasPaths.A,
        B: aliasPaths.B,
      };
      const inputFilePath = path.join(fixtures, fixture);

      const transform = (inputTxt) => {
        return app.replaceImports(aliases, inputTxt, inputFilePath);
      };
      fixtureCompare(fixture, transform);
    });
  });

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

  describe('with crazy chars in alias', () => {
    it('should be liberal about characters', () => {
      const fixture = 'a/import-crazy-chars';
      const aliases = {
        'foo-mister_crazy123!!+': aliasPaths['foo-mister_crazy123!!+'],
      };
      const inputFilePath = path.join(fixtures, fixture);

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

      expect(fn).to.throw('it is not defined');
    });
  });

  describe('proxyquire', () => {
    it('should replace the first param used for proxyquire', () => {
      const fixture = 'importers/proxyquire';
      const inputFilePath = importingFiles.proxyquire;
      const aliases = {
        'proxyquire': aliasPaths.proxyquire,
      };

      const transform = (inputTxt) => {
        return app.replaceImports(aliases, inputTxt, inputFilePath);
      };

      expect(fixtureCompare(fixture, transform)).to.equal(true);
    });
  });

  describe('require', () => {
    it('should replace the first param used for require', () => {
      const fixture = 'importers/require';
      const inputFilePath = importingFiles.require;
      const aliases = {
        require: aliasPaths.require,
      };


      const transform = (inputTxt) => {
        return app.replaceImports(aliases, inputTxt, inputFilePath);
      };

      expect(fixtureCompare(fixture, transform)).to.equal(true);
    });
  });
});
