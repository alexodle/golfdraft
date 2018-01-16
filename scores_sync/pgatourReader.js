// @flow
'use strict';

const _ = require('lodash');
const constants = require('../common/constants');
const Promise = require('promise');
const request = require('request');

const MISSED_CUT = constants.MISSED_CUT;
const NDAYS = constants.NDAYS;

const PGATOUR_WD_TEXT = 'wd';
const PGATOUR_MC_TEXT = 'cut';
const CUT_ROUND = 3; // cut starts at round 3
const N_HOLES = 18;

function getRoundScore(par, currentRound, g, round) {
  const roundNumber = round.round_number;
  const missedCut = g.status === PGATOUR_MC_TEXT;

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
  const total = g.total_strokes;

  const newScores = [];
  let strokes = 0;
  for (let i = 0; i < scores.length; i++) {
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
  const bio = g.player_bio;
  const golferCurrentRound = g.current_round;

  const parsedGolfer = {
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

  const withdrew = g.status === PGATOUR_WD_TEXT;
  if (withdrew) {
    parsedGolfer.scores = adjustWdScores(g, parsedGolfer.scores);
  }

  parsedGolfer.scores = adjustForPar(par, parsedGolfer.scores);

  return parsedGolfer;
}

const PgaTourReader = {

  run: function (pgatourUrl) {
    return new Promise(function (fulfill, reject) {
      request({ url: pgatourUrl, json: true }, function (error, response, body) {
        if (error) {
          reject(error);
          return;
        }

        const par = _.parseInt(body.leaderboard.courses[0].par_total);
        const currentRound = body.leaderboard.current_round;
        const golfers = _.map(body.leaderboard.players, function (g) {
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
