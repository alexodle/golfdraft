require('./initTestConfig');

var constants = require('../common/constants');
var reader = require('../scores_sync/pgatourReader');
var should = require('should');

var MISSED_CUT = constants.MISSED_CUT;

describe('PgaTourReader', function () {
  describe('parseGolfer', function () {

    it('parses for missed cut', function () {
      reader
        .parseGolfer(70, require('./files/golfer_missedcut'))
        .should.eql({
          golfer: 'Hunter Mahan',
          scores: [3, 4, MISSED_CUT, MISSED_CUT],
          thru: null,
          day: null
        });
    });

    it('parses for active mid-tourney player', function () {
      reader
        .parseGolfer(70, require('./files/golfer_midtourney_active'))
        .should.eql({
          golfer: 'Henrik Stenson',
          scores: [-5, 4, 0, 0],
          thru: 18,
          day: 2
        });
    });

    it('parses for active mid-tourney mid-day player', function () {
      reader
        .parseGolfer(70, require('./files/golfer_midtourney_playing'))
        .should.eql({
          golfer: 'Henrik Stenson',
          scores: [-5, 4, -2, 0],
          thru: 7,
          day: 3
        });
    });

  });
});
