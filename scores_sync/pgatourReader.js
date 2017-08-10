'use strict';

var _ = require('lodash');
var constants = require('../common/constants');
var Promise = require('promise');
var request = require('request');
var tourneyCfg = require('../server/tourneyConfigReader').loadConfig();


var MISSED_CUT = constants.MISSED_CUT;
var NDAYS = tourneyCfg.scores.numDays;

var PGATOUR_WD_TEXT = 'wd';
var PGATOUR_MC_TEXT = 'cut';
var CUT_ROUND = 3; // cut starts at round 3
var N_HOLES = 18;

function getRoundScore(par, currentRound, g, round) {
  var roundNumber = round.round_number;
  var missedCut = g.status === PGATOUR_MC_TEXT;

  if (missedCut && roundNumber >= CUT_ROUND) {
    return MISSED_CUT;
  } else if (roundNumber > currentRound && round.strokes === null) {
    return par;
  } else if (roundNumber === currentRound) {
    return g.today ? g.today + par : par; // par if they haven't started yet
  }

  return round.strokes;
}

function adjustWdScores(g, scores) {
  // For WD golfers, "total_strokes" is the only property we can trust
  var total = g.total_strokes;

  var newScores = [];
  var strokes = 0;
  for (var i=0; i<scores.length; i++) {
    strokes += scores[i];
    newScores.push(strokes <= total ? scores[i] : MISSED_CUT);
  }

  return newScores;
}

function adjustForPar(par, scores) {
  return _.map(scores, function (s) {
    return s !== MISSED_CUT ? s - par : MISSED_CUT;
  });
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

  var withdrew = g.status === PGATOUR_WD_TEXT;
  if (withdrew) {
    parsedGolfer.scores = adjustWdScores(g, parsedGolfer.scores);
  }

  parsedGolfer.scores = adjustForPar(par, parsedGolfer.scores);

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
