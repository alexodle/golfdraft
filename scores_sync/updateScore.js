'use strict';

var _ = require('lodash');
var access = require('../server/access');
var config = require('../server/config');
var constants = require('../common/constants');
var Promise = require('promise');

var DAYS = constants.NDAYS;
var MISSED_CUT = constants.MISSED_CUT;

var UpdateScore = {

  validate: function (d) {
    if (!_.contains([70, 71, 72], d.par)) {
      console.log("ERROR - Par invalid:" + d.par);
      return false;
    }

    return _.every(d.golfers, function (g) {
      var inv = false;
      var validScores = _.every(g.scores, function (s) {
        return _.isFinite(s) || s === MISSED_CUT;
      });

      if (g.golfer === "-") {
        console.log("ERROR - Invalid golfer name");
        inv = true;
      } else if (g.scores.length !== DAYS) {
        console.log("ERROR - Invalid golfer scores length");
        inv = true;
      } else if (!validScores) {
        console.log("ERROR - Invalid golfer scores");
        inv = true;
      } else if (!_.contains(_.range(DAYS + 1), g.day)) {
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
    var overridesByGolfer = _.chain(scoreOverrides)
      .map(function (o) {
        // Remove all empty values from scoreOverrides
        return _.chain(o)
          .pairs()
          .filter(function (kv) { return kv[1] !== null; })
          .object()
          .value();
      })
      .indexBy(function (o) {
        return o.golfer.toString();
      })
      .value();

    var newScores = _.map(scores, function (s) {
      var override = overridesByGolfer[s.golfer.toString()];
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
      var mainPromise = access.updateTourney({
        par: rawTourney.par,
        pgatourUrl: url
      })

      .then(function () {
        // Ensure golfers
        var golfers = _.map(rawTourney.golfers, function (g) {
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
        var gs = results[0];
        var scoreOverrides = results[1];

        // Build scores with golfer id
        var golfersByName = _.indexBy(gs, "name");
        var scores = _.map(rawTourney.golfers, function (g) {
          var golfer = golfersByName[g.golfer]._id;
          return {
            golfer: golfer,
            day: g.day,
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

module.exports = UpdateScore;
