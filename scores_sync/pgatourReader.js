var _ = require('lodash');
var constants = require('../common/constants');
var Promise = require('promise');
var request = require('request');

var MISSED_CUT = constants.MISSED_CUT;
var NDAYS = constants.NDAYS;

var PGATOUR_MC = 'cut';

function getRoundScore(par, currentRound, g, round) {
  if (!round.tee_time) {
    if (g.status !== PGATOUR_MC) {
      throw new Error('Invalid MC score: ' + JSON.stringify(g));
    }
    return MISSED_CUT;
  }

  var roundNumber = round.round_number;
  if (roundNumber > currentRound) {
    return 0;
  } else if (roundNumber === currentRound) {
    return g.today;
  }

  return round.strokes - par;
}

function validateScores(g) {
  var missedCut = g.status !== PGATOUR_MC;
  return _.chain(g.scores)
    .map(function (score) {
      if (!_.isFinite(score) && score !== MISSED_CUT) {
        return 'Invalid score';
      }
      return null;
    })
    .filter()
    .value();
}

var PgaTourReader = {

  readUrl: function (pgatourUrl) {
    return new Promise(function (fulfill, reject) {
      request({ url: pgatourUrl, json: true }, function (error, response, body) {
        if (error) reject(error);

        var par = _.parseInt(body.leaderboard.courses[0].par_total);
        var currentRound = body.leaderboard.current_round;

        var golfers = _.map(body.leaderboard.players, function (g) {
          var missedCut = g.status === PGATOUR_MC;
          var bio = g.player_bio;
          var parsedGolfer = {
            golfer: bio.first_name + ' ' + bio.last_name,
            thru: g.thru,
            today: g.today,
            scores: _.chain(g.rounds)
              .first(NDAYS)
              .map(function (round) {
                return getRoundScore(par, currentRound, g, round);
              })
              .value()
          };

          var scoreValidation = validateScores(parsedGolfer);
          if (scoreValidation.length) {
            throw new Error(
              'Invalid score for golfer (' + JSON.stringify(scoreValidation) + '):' +
               JSON.stringify(g) + ' -> ' + JSON.stringify(parsedGolfer));
          }

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
