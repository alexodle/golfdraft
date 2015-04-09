var _ = require('lodash');
var access = require('./server/access');
var config = require('./server/config');
var mongoose = require('mongoose');
var Promise = require('promise');

var TIMEOUT = 30 * 1000; // 30 seconds

mongoose.connect(config.mongo_url);

function end() {
  mongoose.connection.close();
}

function printScoresForFrank() {
  Promise.all([
    access.getPlayers(),
    access.getDraft(),
    access.getGolfers()
  ])
  .then(function (results) {
    var players = results[0];
    var draftPicks = _.groupBy(results[1].picks, 'player');
    var golfers = _.indexBy(results[2], '_id');

    _.each(players, function (p) {
      console.log(p.name);
      _.each(draftPicks[p._id], function (pick) {
        console.log("\t" + golfers[pick.golfer].name);
      });
    });
  })
  .catch(function (err) {
    console.log(err.stack);
    console.log(err);
  })
  .then(end);
}

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', printScoresForFrank);
