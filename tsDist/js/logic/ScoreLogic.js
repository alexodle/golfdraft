"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const constants_1 = require("../../common/constants");
const NDAYS = constants_1.default.NDAYS;
const MISSED_CUT = constants_1.default.MISSED_CUT;
const NSCORES_PER_DAY = constants_1.default.NSCORES_PER_DAY;
function getGolfersByUser(draftPicks) {
    return _.chain(draftPicks)
        .groupBy('user')
        .mapValues((picks) => _.map(picks, 'golfer'))
        .value();
}
function userScore(userGolfers, scores, userId) {
    const scoresByGolfer = _.chain(userGolfers)
        .map(function (g) {
        return _.extend({}, scores[g], {
            total: _.sumBy(scores[g].scores)
        });
    })
        .keyBy('golfer')
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
        const usedScores = _.take(dayScores, NSCORES_PER_DAY);
        return {
            day: day,
            allScores: dayScores,
            usedScores: usedScores,
            total: _.sumBy(usedScores, function (s) {
                return s.scores[day];
            })
        };
    });
    return {
        user: userId,
        scoresByDay: scoresByDay,
        scoresByGolfer: scoresByGolfer,
        total: _.sumBy(scoresByDay, 'total'),
        pickNumber: -1 // set later
    };
}
function worstScoreForDay(golferScores, day) {
    return _.chain(golferScores)
        .map((gs) => gs.scores)
        .map((scores) => scores[day])
        .reject(MISSED_CUT)
        .max()
        .value();
}
class ScoreLogic {
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
    static calcUserScores(draftPicks, golferScores) {
        const golfersByUser = getGolfersByUser(draftPicks);
        const draftPosByUser = _.chain(draftPicks)
            .groupBy('user')
            .mapValues((dps) => _.minBy(dps, (dp) => dp.pickNumber).pickNumber)
            .value();
        const userScores = _.chain(golfersByUser)
            .map((golfers, user) => {
            return _.extend({}, userScore(golfers, golferScores, user), {
                pickNumber: draftPosByUser[user]
            });
        })
            .keyBy('user')
            .value();
        return userScores;
    }
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
    static fillMissedCutScores(golferScores) {
        const worstScores = _.chain(NDAYS)
            .range()
            .map((day) => worstScoreForDay(golferScores, day))
            .value();
        _.each(golferScores, function (ps) {
            ps.missedCuts = _.map(ps.scores, function (s) {
                return s === MISSED_CUT;
            });
            ps.scores = _.map(ps.scores, function (s, i) {
                return ps.missedCuts[i] ? worstScores[i] : s;
            });
        });
        return golferScores;
    }
}
exports.default = ScoreLogic;
;
