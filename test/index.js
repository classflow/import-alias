import { expect } from 'chai';
import * as app from '../src';
import path from 'path';

const fixtures = path.join(__dirname, 'fixtures');
const paths = {
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
        A: paths.A,
        B: paths.B,
        Component1: paths.Component1,
      };
      return expect(aliases).to.eql(expected);
    });
  });
});
