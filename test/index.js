import { expect } from 'chai';
import * as app from '../src';
import path from 'path';

const fixtures = path.join(__dirname, 'fixtures');
const aliasPaths = {
  A: path.join(fixtures, 'foo/bar/baz/A.js'),
  B: path.join(fixtures, 'foo/B.js'),
  Component1: path.join(fixtures, 'foo/bar/Component1.es6'),
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
});

describe('replacing alias imports', () => {
  describe('import foo from \'@foo\';', () => {
    it('should replace "@foo" with the relative path and append alias', () => {
      const input = 'import foo from \'@foo\';';
      const aliases = {
        foo: '/a/b/c/d/foo.js',
      };
      const inputFilePath = '/x/y/z.js';
      const output = app.replaceImports(aliases, input, inputFilePath);
      const expected = 'import foo from \'../../../a/b/c/d/foo\'; // @foo';
      expect(output).to.equal(expected);
    });

    it('should work for multiple imports');
  });

  xdescribe('import foo from \'../../a/b/foo\'; // @foo', () => {
    it('should replace "@foo" with the relative path and append alias', () => {
      const input = 'import foo from \'../../an/old/path/to/foo\'; // @foo';
      const aliases = {
        foo: 'asdf'
      };
      const inputFilePath = '/asdf.js';
      const output = app.replaceImports(aliases, input, inputFilePath);
      const expected = 'import foo from \'../../../foo\'; // @foo';
      expect(output).to.equal(expected);
    });
  });

  xdescribe('require', () => {});
});
