require('../common/utils');

var _ = require('lodash');
var levenshteinDistance = require('../server/levenshteinDistance');

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
        coeff: (6 + 7 - 1) / (6 + 7)
      });
    });

    it('returns correctly for fully unequal strings', function () {
      levenshteinDistance.run('a', 'b').should.eql({
        dist: 2,
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

  });

  describe('runAll', function () {

    it('tries all combos', function () {
      levenshteinDistance.runAll(
        ['test1', 'alxx2'],
        ['alxx1', 'test2']
      ).should.eql([
        { source: 'test1', results: [
          { target: 'test2', dist: 2, coeff: (5 + 5 - 2) / (5 + 5) },
          { target: 'alxx1', dist: 8, coeff: (5 + 5 - 8) / (5 + 5) }
        ]},
        { source: 'alxx2', results: [
          { target: 'alxx1', dist: 2, coeff: (5 + 5 - 2) / (5 + 5) },
          { target: 'test2', dist: 8, coeff: (5 + 5 - 8) / (5 + 5) }
        ]},
      ]);
    });

    it('preserves original casing', function () {
      levenshteinDistance.runAll(['Ac'], ['a', 'B']).should.eql([
        { source: 'Ac', results: [
          { target: 'a', dist: 1, coeff: (2 + 1 - 1) / (2 + 1) },
          { target: 'B', dist: 3, coeff: 0 }
        ]}
      ]);
    });

  });

});

