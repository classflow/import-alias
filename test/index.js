import chai, { expect } from 'chai';
import * as app from '../src';
import path from 'path';

const fixtures = path.join(__dirname, 'fixtures');

describe('finding files', () => {
  it.only('should find all js files recursively', () => {
    return app.findFiles(fixtures).then(files => {
      console.log('all the files...');
      console.log(files);
      expect(files.length).to.equal(3);
    });
  });
});

describe('finding alias definitions', () => {
  it('should find all defined aliases in a path');

  it('should produce a map of "alias": "absolute_path"');
});
