'use strict';

var _ = require('lodash');
var constants = require('../../common/constants');
var utils = require('../../common/utils');

var NDAYS = constants.NDAYS;
var MISSED_CUT = constants.MISSED_CUT;

function getGolfersByPlayer(draftPicks) {
  return _.chain(draftPicks)
    .groupBy('player')
    .transform(function (memo, picks, playerId) {
      memo[playerId] = _.pluck(picks, 'golfer');
    })
    .value();
}

function playerScore(playerGolfers, scores, player) {
  var scoresByGolfer = _.chain(playerGolfers)
    .map(function (g) {
      return _.extend({}, scores[g], {
        total: _.sum(scores[g].scores)
      });
    })
    .indexBy('golfer')
    .value();

  var scoresByDay = _.chain(NDAYS)
    .range()
    .map(function (day) {
      var dayScores = _.chain(playerGolfers)
        .map(function (g) {
          return scores[g];
        })
        .sortBy(function (s) {
          return s.scores[day];
        })
        .value();

      var usedScores = _.first(dayScores, 2);
      return {
        day: day,
        allScores: dayScores,
        usedScores: usedScores,
        total: _.sum(usedScores, function (s) {
          return s.scores[day];
        })
      };
    })
    .value();

  return {
    player: player,
    scoresByDay: scoresByDay,
    scoresByGolfer: scoresByGolfer,
    total: _.sum(scoresByDay, 'total')
  };
}

function worstScoreForDay(playerScores, day) {
  return _.chain(playerScores)
    .pluck('scores')
    .pluck(day)
    .reject(MISSED_CUT)
    .max()
    .value();
}

var ScoreLogic = {

  calcPlayerScores: function (draftPicks, playerScores) {
    var golfersByPlayer = getGolfersByPlayer(draftPicks);

    playerScores = _.chain(golfersByPlayer)
      .map(function (golfers, player) {
        return playerScore(golfers, playerScores, player);
      })
      .indexBy('player')
      .value();

    return playerScores;
  },

  fillMissedCutScores: function (playerScores) {
    var worstScores = _.chain(NDAYS)
      .range()
      .map(_.partial(worstScoreForDay, playerScores))
      .value();
    _.each(playerScores, function (ps) {
      ps.missedCuts = _.map(ps.scores, function (s) {
        return s === MISSED_CUT;
      });
      ps.scores = _.map(ps.scores, function (s, i) {
        return ps.missedCuts[i] ? worstScores[i] : s;
      });
    });
    return playerScores;
  }

};


module.exports = ScoreLogic;
