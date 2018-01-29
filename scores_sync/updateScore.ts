
import * as _ from 'lodash';
import access from '../access';
import config from '../config';
import constants from '../common/constants';

const DAYS = constants.NDAYS;
const MISSED_CUT = constants.MISSED_CUT;
const OVERRIDE_KEYS = ['golfer', 'day', 'scores'];

const UpdateScore = {

  validate: function (d) {
    if (_.has(d, 'par') && !_.includes([70, 71, 72, 73], d.par)) {
      console.log("ERROR - Par invalid:" + d.par);
      return false;
    }

    return _.every(d.golfers, function (g) {
      const validScores = _.every(g.scores, function (s) {
        return _.isFinite(s) || s === MISSED_CUT;
      });
      let inv = false;

      if (g.golfer === "-") {
        console.log("ERROR - Invalid golfer name");
        inv = true;
      } else if (g.scores.length !== DAYS) {
        console.log("ERROR - Invalid golfer scores length");
        inv = true;
      } else if (!validScores) {
        console.log("ERROR - Invalid golfer scores");
        inv = true;
      } else if (!_.includes(_.range(DAYS + 1), g.day)) {
        console.log("ERROR - Invalid golfer day");
        inv = true;
      }

      if (inv) {
        console.log(JSON.stringify(g));
      }
      return !inv;
    });
  },

  mergeOverrides: function (scores, scoreOverrides) {
    const overridesByGolfer = _.chain(scoreOverrides)
      .map(function (o) {
        return _.chain(o)

          // Remove all empty values from scoreOverrides
          .omit(_.isNull)

          // Whitelist the values we can take
          .pick(OVERRIDE_KEYS)
          .value();
      })
      .keyBy(function (o) {
        return o.golfer.toString();
      })
      .value();

    const newScores = _.map(scores, function (s) {
      const override = overridesByGolfer[s.golfer.toString()];
      if (override) {
        return _.extend({}, s, override);
      }
      return s;
    });

    return newScores;
  },

  run: function (reader, url) {
    return reader.run(url).then(function (rawTourney) {
      // Quick assertion of data
      if (!rawTourney || !UpdateScore.validate(rawTourney)) {
        return false;
      }

      // Ensure tourney/par
      const update = { pgatourUrl: url };
      if (_.has(rawTourney, 'par')) {
        update.parr = rawTourney.par;
      }
      const mainPromise = access.updateTourney(update)

      .then(function () {
        // Ensure golfers
        const golfers = _.map(rawTourney.golfers, function (g) {
          return { name: g.golfer };
        });
        return access.ensureGolfers(golfers);
      })

      .then(function () {
        return Promise.all([
          access.getGolfers(),
          access.getScoreOverrides()
        ]);
      })

      .then(function (results) {
        const gs = results[0];
        const scoreOverrides = results[1];

        // Build scores with golfer id
        const golfersByName = _.keyBy(gs, "name");
        let scores = _.map(rawTourney.golfers, function (g) {
          const golfer = golfersByName[g.golfer]._id;
          return {
            golfer: golfer,
            day: g.day,
            thru: g.thru,
            scores: g.scores
          };
        });

        // Merge in overrides
        console.log("scores BEFORE overrides: " + JSON.stringify(scores));
        scores = UpdateScore.mergeOverrides(scores, scoreOverrides);
        console.log("");
        console.log("scores AFTER overrides: " + JSON.stringify(scores));
        console.log("");
        if (!scores.length) {
          throw new Error("wtf. no scores.");
        }

        // Save
        return access.updateScores(scores);
      })

      .then(function () {
        console.log("HOORAY! - scores updated");
        return true;
      })

      .catch(function (e) {
        console.log(e);
        return false;
      });

      return mainPromise;
    });
  }
};

export default UpdateScore;
