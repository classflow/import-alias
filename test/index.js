import chai, { expect } from 'chai';
import * as app from '../src';
import path from 'path';

const fixtures = path.join(__dirname, 'fixtures');

describe('finding files', () => {
  it('should find all js files recursively', () => {
    return app.findFiles(fixtures).then(files => {
      expect(files.length).to.equal(5);
    });
  });
});

describe('finding alias definitions', () => {
  it('should find all defined aliases in a path');

  it('should produce a map of "alias": "absolute_path"');
});
