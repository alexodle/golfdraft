var _ = require('lodash');
var constants = require('../common/constants');
var updater = require('../scores_sync/updateScore');

var MISSED_CUT = constants.MISSED_CUT;

describe('updateScore', function () {

  describe('validate', function () {

    it('catches invalid par data', function () {
      updater.validate({ par: 68 }).should.not.be.ok;
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
        golfers: [{ golfer: 'Jack Bauer', scores: [1, 'a', 2, 3] }]
      }).should.not.be.ok;
    });

    it('catches NaN golfer scores', function () {
      updater.validate({
        par: 70,
        golfers: [{ golfer: 'Jack Bauer', scores: [1, NaN, 2, 3] }]
      }).should.not.be.ok;
    });

    it('allows "MC" as a golfer score', function () {
      updater.validate({
        par: 70,
        golfers: [{
          golfer: 'Jack Bauer',
          scores: [1, -1, MISSED_CUT, MISSED_CUT],
          day: 4
        }]
      }).should.be.ok;
    });

    it('catches bad day values', function () {
      updater.validate({
        par: 70,
        golfers: [{ golfer: 'Jack Bauer', scores: [1, -1, 0, 0], day: 5 }]
      }).should.not.be.ok;
      updater.validate({
        par: 70,
        golfers: [{ golfer: 'Jack Bauer', scores: [1, -1, 0, 0], day: -1 }]
      }).should.not.be.ok;
    });

  });

  describe('mergeOverrides', function () {

    it('merges override scores', function () {
      var merged = _.indexBy(updater.mergeOverrides(
        [
          { golfer: 'golferid_1', day: 4, scores: [-1, -20, -30, 0] },
          { golfer: 'golferid_2', day: 4, scores: [-1, 2, -2, 0] },
          {
            golfer: 'golferid_3',
            day: 3,
            scores: [-1, -30, MISSED_CUT, MISSED_CUT]
          }
        ],
        [
          {
            _id: 'should be removed',
            golfer: 'golferid_1',
            day: null,
            scores: [-1, MISSED_CUT, MISSED_CUT, MISSED_CUT]
          },
          {
            golfer: 'golferid_3',
            day: 4,
            scores: [-1, MISSED_CUT, MISSED_CUT, MISSED_CUT]
          }
        ]
      ), 'golfer');

      merged.golferid_1.should.eql({
        golfer: 'golferid_1',
        day: 4,
        scores: [-1, MISSED_CUT, MISSED_CUT, MISSED_CUT]
      });
      merged.golferid_2.should.eql({
        golfer: 'golferid_2',
        day: 4,
        scores: [-1, 2, -2, 0]
      });
      merged.golferid_3.should.eql({
        golfer: 'golferid_3',
        day: 4,
        scores: [-1, MISSED_CUT, MISSED_CUT, MISSED_CUT]
      });
    });

  });

});
