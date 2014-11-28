'use strict';

var _ = require('lodash');

var utils = require('../../common/utils');

// TODO - Define this somewhere
var NDAYS = 4;

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

function worstScore(scores, day) {
  var score = _.chain(scores)
    .reject(function (s) {
      return s.scores[day] === 'MC';
    })
    .max(function (s) {
      return s.scores[day];
    })
    .value();
  return score.scores[day];
}

var ScoreLogic = {

  calcPlayerScores: function (draftPicks, scores) {
    var golfersByPlayer = getGolfersByPlayer(draftPicks);

    var playerScores = _.chain(golfersByPlayer)
      .map(function (golfers, player) {
        return playerScore(golfers, scores, player);
      })
      .indexBy('player')
      .value();

    return playerScores;
  },

  fillMissedCutScores: function (scores) {
    var worstScores = _.chain(NDAYS)
      .range()
      .map(_.partial(worstScore, scores))
      .value();
    _.each(scores, function (s) {
      s.missedCuts = _.map(s.scores, function (s) {
        return s === "MC";
      });
      s.scores = _.map(s.scores, function (s, i) {
        return s === "MC" ? worstScores[i] : s;
      });
    });
    return scores;
  }

};


module.exports = ScoreLogic;
