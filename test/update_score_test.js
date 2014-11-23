var updater = require('../server/update_score');
var should = require('should');

describe('update_score', function () {

  describe('validate', function () {

    it('catches invalid par data', function () {
      updater.validate({par: 68}).should.not.be.ok;
    });

    it('catches bad golfer names', function () {
      updater.validate({
        par: 70,
        golfers: [{golfer: '-'}]
      }).should.not.be.ok;
    });

    it('catches non-numeric golfer score', function () {
      updater.validate({
        par: 70,
        golfers: [{golfer: 'Jack Bauer', scores: [1, 'a', 2, 3]}]
      }).should.not.be.ok;
    });

    it('catches NaN golfer scores', function () {
      updater.validate({
        par: 70,
        golfers: [{golfer: 'Jack Bauer', scores: [1, NaN, 2, 3]}]
      }).should.not.be.ok;
    });

    it('allows "MC" as a golfer score', function () {
      updater.validate({
        par: 70,
        golfers: [{golfer: 'Jack Bauer', scores: [1, -1, 'MC', 'MC'], day: 4}]
      }).should.be.ok;
    });

    it('catches bad day values', function () {
      updater.validate({
        par: 70,
        golfers: [{golfer: 'Jack Bauer', scores: [1, -1, 0, 0], day: 5}]
      }).should.not.be.ok;
      updater.validate({
        par: 70,
        golfers: [{golfer: 'Jack Bauer', scores: [1, -1, 0, 0], day: -1}]
      }).should.not.be.ok;
    });

  });

  describe('mergeOverrides', function () {

    it('merges override scores', function () {
      updater.mergeOverrides(
        [
          {golfer: 'golferid_1', day: 4, scores: [-1, -20, -30, 0]},
          {golfer: 'golferid_2', day: 4, scores: [-1, 2, -2, 0]},
          {golfer: 'golferid_3', day: 3, scores: [-1, -30, 'MC', 'MC']}
        ],
        [
          {golfer: 'golferid_1', day: null, scores: [-1, 'MC', 'MC', 'MC']},
          {golfer: 'golferid_3', day: 4, scores: [-1, 'MC', 'MC', 'MC']}
        ]
      ).should.eql([
          {golfer: 'golferid_1', day: 4, scores: [-1, 'MC', 'MC', 'MC']},
          {golfer: 'golferid_2', day: 4, scores: [-1, 2, -2, 0]},
          {golfer: 'golferid_3', day: 4, scores: [-1, 'MC', 'MC', 'MC']}
      ]);
    });

  });

});
