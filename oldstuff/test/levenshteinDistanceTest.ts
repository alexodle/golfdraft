import './initTestConfig';

import * as _ from 'lodash';
import * as levenshteinDistance from '../server/levenshteinDistance';

describe('levenshteinDistance', function () {

  describe('run', function () {

    it('returns 0 for equal strings', function () {
      levenshteinDistance.run('string', 'string').should.eql({
        dist: 0,
        coeff: 1.0
      });
    });

    it('returns 1 for almost equal strings', function () {
      levenshteinDistance.run('string', 'string1').should.eql({
        dist: 1,
        coeff: (7 - 1) / 7
      });
    });

    it('returns correctly for fully unequal strings', function () {
      levenshteinDistance.run('a', 'b').should.eql({
        dist: 1,
        coeff: 0
      });
    });

    it('tries word permutations', function () {
      levenshteinDistance.run('a b', 'b a').should.eql({
        dist: 0,
        coeff: 1
      });
    });

    it('ignores case', function () {
      levenshteinDistance.run('A', 'a').should.eql({
        dist: 0,
        coeff: 1
      });
    });

    it('uses longest string to calc coeff', function () {
      levenshteinDistance.run('aaab', 'b').should.eql({
        dist: 3,
        coeff: (4 - 3) / 4
      });
    });

  });

  describe('runAll', function () {

    it('tries all combos', function () {
      levenshteinDistance.runAll(
        'test1',
        ['alxx1', 'test2']
      ).should.eql({ source: 'test1', results: [
        { target: 'test2', dist: 1, coeff: (5 - 1) / 5 },
        { target: 'alxx1', dist: 4, coeff: (5 - 4) / 5 }
      ]});
    });

    it('preserves original casing', function () {
      levenshteinDistance.runAll('Ac', ['a', 'B']).should.eql({ source: 'Ac', results: [
          { target: 'a', dist: 1, coeff: (2 - 1) / 2 },
          { target: 'B', dist: 2, coeff: 0 }
        ]}
      );
    });

    it('sorts by [coeff, target]', function () {
      levenshteinDistance.runAll('a', ['d', 'c', 'b']).should.eql({
        source: 'a', results: [
          { target: 'b', dist: 1, coeff: 0 },
          { target: 'c', dist: 1, coeff: 0 },
          { target: 'd', dist: 1, coeff: 0 }
        ]}
      );
    });

  });

});

