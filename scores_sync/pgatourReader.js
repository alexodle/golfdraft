var _ = require('lodash');
var constants = require('../common/constants');
var Promise = require('promise');
var request = require('request');

var MISSED_CUT = constants.MISSED_CUT;
var NDAYS = constants.NDAYS;

var PGATOUR_MC_TEXTS = ['cut', 'wd'];
var CUT_ROUND = 3; // cut starts at round 3
var N_HOLES = 18;

function getRoundScore(par, currentRound, g, round) {
  var roundNumber = round.round_number;
  var missedCut = _.contains(PGATOUR_MC_TEXTS, g.status);

  if (missedCut && roundNumber >= CUT_ROUND) {
    return MISSED_CUT;
  } else if (roundNumber > currentRound && round.strokes === null) {
    return 0;
  } else if (roundNumber === currentRound) {
    return g.today || 0; // 0 if they haven't started yet
  }

  return round.strokes - par;
}

function parseGolfer(par, tourneyRound, g) {
  var bio = g.player_bio;
  var golferCurrentRound = g.current_round;

  var parsedGolfer = {
    golfer: bio.first_name + ' ' + bio.last_name,
    day: golferCurrentRound || tourneyRound,
    thru: g.thru,
    scores: _.chain(g.rounds)
      .first(NDAYS)
      .map(function (round) {
        return getRoundScore(par, golferCurrentRound, g, round);
      })
      .value()
  };

  return parsedGolfer;
}

var PgaTourReader = {

  run: function (pgatourUrl) {
    return new Promise(function (fulfill, reject) {
      request({ url: pgatourUrl, json: true }, function (error, response, body) {
        if (error) {
          reject(error);
          return;
        }

        var par = _.parseInt(body.leaderboard.courses[0].par_total);
        var currentRound = body.leaderboard.current_round;
        var golfers = _.map(body.leaderboard.players, function (g) {
          return parseGolfer(par, currentRound, g);
        });

        fulfill({
          par: par,
          golfers: golfers
        });
      });
    });
  },

  // Export for testing
  parseGolfer: parseGolfer

};

module.exports = PgaTourReader;
