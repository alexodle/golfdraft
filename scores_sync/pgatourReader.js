var _ = require('lodash');
var constants = require('../common/constants');
var Promise = require('promise');
var request = require('request');

var MISSED_CUT = constants.MISSED_CUT;
var NDAYS = constants.NDAYS;

var PGATOUR_MC = 'cut';

function getRoundScore(par, currentRound, g, round) {
  var roundNumber = round.round_number;
  if (roundNumber > currentRound) {
    return g.status === PGATOUR_MC ? MISSED_CUT : 0;
  } else if (roundNumber === currentRound) {
    return g.today || 0; // 0 if they haven't started yet
  }

  return round.strokes - par;
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
          var missedCut = g.status === PGATOUR_MC;
          var bio = g.player_bio;
          var parsedGolfer = {
            golfer: bio.first_name + ' ' + bio.last_name,
            day: currentRound, // assumes all golfers are on the same day..
            thru: g.thru,
            today: g.today,
            scores: _.chain(g.rounds)
              .first(NDAYS)
              .map(function (round) {
                return getRoundScore(par, currentRound, g, round);
              })
              .value()
          };

          return parsedGolfer;
        });

        fulfill({
          par: par,
          golfers: golfers
        });
      });
    });
  }

};

module.exports = PgaTourReader;
