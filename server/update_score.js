'use strict';

var Promise = require('promise');
var _ = require('underscore');

var YahooReader = require('./yahoo_reader');
var models = require('./models');
var config = require('./config');
var Tourney = models.Tourney;
var Golfer = models.Golfer;

function validate(d) {
  if (!_.contains([70, 71, 72], d.par)) {
    console.log("ERROR - Par invalid:" + d.par);
    return false;
  }
  if (_.some(d.players, function (p) { return p.player === '-'; })) {
    console.log("ERROR - Invalid player name: '-'");
    return false;
  }
  return _.every(d.players, function (p) {
    var inv = false;
    if (!_.every(p.scores, _.isFinite)) {
      console.log("ERROR - Invalid player scores");
      inv = true;
    }
    if (!_.contains([0, 1, 2, 3, 4], p.day)) {
      console.log("ERROR - Invalid player day");
      inv = true;
    }

    if (inv) {
      console.log(JSON.stringify(p));
    }
    return !inv;
  });
}

var UpdateScore = {
  run: function () {
    return YahooReader.run().then(function (tourney) {
      // Quick assertion of data
      if (!tourney || !validate(tourney)) {
        return false;
      }

      // Ensure golfers
      var promises1 = _.map(tourney.players, function (p) {
        return Golfer.update(
          { name: p.player },
          { $set: { name: p.player } },
          { upsert: true }
        )
        .exec();
      });

      return Promise.all(promises1)
      .then(function () {
        return Golfer.find().exec();
      })
      .then(function (gs) {
        var golfersByName = _.indexBy(gs, "name");
        var scores = _.map(tourney.players, function (p) {
          return {
            golfer: golfersByName[p.player]._id,
            day: p.day,
            scores: p.scores
          };
        });
        return Tourney.update(
          {_id: config.tourney_id },
          {$set: {
            par: tourney.par,
            scores: scores,
            lastUpdated: new Date()
          }}
        ).exec();
      })
      .then(function () {
        console.log("HOORAY! - scores updated");
        return true;
      });
    });
  }
};

module.exports = UpdateScore;
