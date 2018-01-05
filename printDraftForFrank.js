const _ = require('lodash');
const access = require('./server/access');
const config = require('./server/config');
const mongoose = require('mongoose');

const TIMEOUT = 30 * 1000; // 30 seconds

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
    const players = results[0];
    const draftPicks = _.groupBy(results[1].picks, 'player');
    const golfers = _.indexBy(results[2], '_id');

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

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', printScoresForFrank);
