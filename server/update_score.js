'use strict';

var Promise = require('promise');
var _ = require('underscore');

var YahooReader = require('./yahoo_reader');
var models = require('./models');
var config = require('./config');
var Tourney = models.Tourney;
var Golfer = models.Golfer;

var DAYS = 4;

var UpdateScore = {

  validate: function (d) {
    if (!_.contains([70, 71, 72], d.par)) {
      console.log("ERROR - Par invalid:" + d.par);
      return false;
    }

    return _.every(d.golfers, function (g) {
      var inv = false;
      var validScores = _.every(g.scores, function (s) {
        return _.isFinite(s) || s === "MC";
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

  run: function () {
    return YahooReader.run().then(function (tourney) {
      // Quick assertion of data
      if (!tourney || !UpdateScore.validate(tourney)) {
        return false;
      }

      // Ensure golfers
      var promises1 = _.map(tourney.golfers, function (p) {
        return Golfer.update(
          { name: p.golfer },
          { $set: { name: p.golfer } },
          { upsert: true }
        )
        .exec();
      });

      // Ensure tourney/par
      console.log("ensuring tourney par: " + tourney.par + ", " + config.tourney_id);
      promises1.push(Tourney.update(
        {_id: config.tourney_id},
        {par: tourney.par}
      ));

      return Promise.all(promises1)
      .then(function () {
        return Promise.all([
          Golfer.find().exec(),
          Tourney.findOne({'_id': config.tourney_id}).lean().exec()
        ]);
      })
      .then(function (results) {
        var gs = results[0];
        var scoreOverrides = results[1].scoreOverrides;

        // BUild scores with golfer id
        var golfersByName = _.indexBy(gs, "name");
        var scores = _.map(tourney.golfers, function (g) {
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

        // Save
        return Tourney.update(
          {_id: config.tourney_id },
          {$set: {
            scores: scores,
            lastUpdated: new Date()
          }}
        ).exec();
      })
      .then(function () {
        console.log("HOORAY! - scores updated");
        return true;
      }, function (e) {
        console.log(e);
        return false;
      });
    });
  }
};

module.exports = UpdateScore;
