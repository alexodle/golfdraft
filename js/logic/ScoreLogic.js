'use strict';

var _ = require('lodash');
var constants = require('../../common/constants');
var utils = require('../../common/utils');

var MISSED_CUT = constants.MISSED_CUT;

function getGolfersByPlayer(draftPicks) {
  return _.chain(draftPicks)
    .groupBy('player')
    .transform(function (memo, picks, playerId) {
      memo[playerId] = _.pluck(picks, 'golfer');
    })
    .value();
}

function playerScore(playerGolfers, scores, player, startDay, numberOfDays, scoresPerDay) {
  var scoresByGolfer = _.chain(playerGolfers)
    .map(function (g) {
      return _.extend({}, scores[g], {
        total: _.sum(scores[g].scores)
      });
    })
    .indexBy('golfer')
    .value();

  var scoresByDay = _.times(numberOfDays, function (day) {
    day += startDay;
    var dayScores = _.chain(playerGolfers)
      .map(function (g) {
        return scores[g];
      })
      .sortBy(function (s) {
        return s.scores[day];
      })
      .value();

    var usedScores = _.first(dayScores, scoresPerDay);
    return {
      day: day,
      allScores: dayScores,
      usedScores: usedScores,
      total: _.sum(usedScores, function (s) {
        return s.scores[day];
      })
    };
  });

  return {
    player: player,
    scoresByDay: scoresByDay,
    scoresByGolfer: scoresByGolfer,
    total: _.sum(scoresByDay, 'total')
  };
}
function worstScoresPerDay(scores, numberOfDays) {
    var result = _.chain(numberOfDays)
      .times(function (day) {
        var worstScore = _.chain(scores)
          .reject(function (s) {
            return s.missedCuts[day];
          })
          .max(function (s) {
            return s.scores[day];
          })
          .value();
        return {
          day: day,
          golfer: worstScore.golfer,
          score: worstScore.scores[day]
        };
      })
      .first(function (s) {
        // Assume 0 means they haven't started playing this day yet
        return s.score > 0;
      })
      .value();
      return result;

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

  /**
   * Calculates the overall score for each pool player in tournament. Scoring
   * works on a per-day basis, and is calculated as such:
   *
   * score = 0
   * for each day:
   *   score += best golfer score for day
   *   score += 2nd best golfer score for day
   *
   * If the either of the top 2 scores contains a MISSED_CUT, then the worst
   * score of all golfers for the particular day will be used instead.
   */
  calcPlayerScores: function (draftPicks, golferScores, startDay, numberOfDays, scoresPerDay) {
    var golfersByPlayer = getGolfersByPlayer(draftPicks);
    var draftPosByPlayer = _(draftPicks)
      .groupBy('player')
      .mapValues(function (dps) {
        return _.min(dps, function (dp) {
          return dp.pickNumber;
        })
        .pickNumber;
      })
      .value();

    var playerScores = _.chain(golfersByPlayer)
      .map(function (golfers, player) {
        return _.extend({},
          playerScore(golfers, golferScores, player, startDay, numberOfDays, scoresPerDay),
          { pickNumber: draftPosByPlayer[player] });
      })
      .indexBy('player')
      .value();

    return playerScores;
  },

  /**
   * Replaces missed cut scores with the worst score of any golfer for that
   * particular day. See calcPlayerScores() description for why this is
   * important.
   *
   * Appends a missedCuts array to the scores object, which contains true for
   * each day the golfer missed the cut. This can be used by the UI to display
   * which scores were actually the result of a missed cut instead of the
   * golfer actually shooting that particular score.
   */
  fillMissedCutScores: function (playerScores, startDay, numberOfDays) {
    var worstScores = _.chain(startDay)
      .range(startDay+numberOfDays)
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
  },
  worstScoresPerDay: worstScoresPerDay

};


module.exports = ScoreLogic;
