'use strict';

const _ = require('lodash');
const constants = require('../../common/constants');
const utils = require('../../common/utils');

const NDAYS = constants.NDAYS;
const MISSED_CUT = constants.MISSED_CUT;
const NSCORES_PER_DAY = constants.NSCORES_PER_DAY;

function getGolfersByUser(draftPicks) {
  return _.chain(draftPicks)
    .groupBy('user')
    .transform(function (memo, picks, userId) {
      memo[userId] = _.pluck(picks, 'golfer');
    })
    .value();
}

function userScore(userGolfers, scores, user) {
  const scoresByGolfer = _.chain(userGolfers)
    .map(function (g) {
      return _.extend({}, scores[g], {
        total: _.sum(scores[g].scores)
      });
    })
    .indexBy('golfer')
    .value();

  const scoresByDay = _.times(NDAYS, function (day) {
    const dayScores = _.chain(userGolfers)
      .map(function (g) {
        return scores[g];
      })
      .sortBy(function (s) {
        return s.scores[day];
      })
      .value();

    const usedScores = _.first(dayScores, NSCORES_PER_DAY);
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
    user: user,
    scoresByDay: scoresByDay,
    scoresByGolfer: scoresByGolfer,
    total: _.sum(scoresByDay, 'total')
  };
}

function worstScoreForDay(userScores, day) {
  return _.chain(userScores)
    .pluck('scores')
    .pluck(day)
    .reject(MISSED_CUT)
    .max()
    .value();
}

const ScoreLogic = {

  /**
   * Calculates the overall score for each pool user in tournament. Scoring
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
  calcUserScores: function (draftPicks, golferScores) {
    const golfersByUser = getGolfersByUser(draftPicks);
    const draftPosByUser = _(draftPicks)
      .groupBy('user')
      .mapValues(function (dps) {
        return _.min(dps, function (dp) {
          return dp.pickNumber;
        })
        .pickNumber;
      })
      .value();

    const userScores = _.chain(golfersByUser)
      .map(function (golfers, user) {
        return _.extend({},
          userScore(golfers, golferScores, user),
          { pickNumber: draftPosByUser[user] });
      })
      .indexBy('user')
      .value();

    return userScores;
  },

  /**
   * Replaces missed cut scores with the worst score of any golfer for that
   * particular day. See calcUserScores() description for why this is
   * important.
   *
   * Appends a missedCuts array to the scores object, which contains true for
   * each day the golfer missed the cut. This can be used by the UI to display
   * which scores were actually the result of a missed cut instead of the
   * golfer actually shooting that particular score.
   */
  fillMissedCutScores: function (userScores) {
    const worstScores = _.chain(NDAYS)
      .range()
      .map(_.partial(worstScoreForDay, userScores))
      .value();
    _.each(userScores, function (ps) {
      ps.missedCuts = _.map(ps.scores, function (s) {
        return s === MISSED_CUT;
      });
      ps.scores = _.map(ps.scores, function (s, i) {
        return ps.missedCuts[i] ? worstScores[i] : s;
      });
    });
    return userScores;
  }

};


module.exports = ScoreLogic;
