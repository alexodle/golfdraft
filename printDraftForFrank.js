const _ = require('lodash');
const access = require('./server/access');
const config = require('./server/config');
const mongooseUtil = require('./server/mongooseUtil');

const TIMEOUT = 30 * 1000; // 30 seconds

function printScoresForFrank() {
  Promise.all([
    access.getUsers(),
    access.getDraft(),
    access.getGolfers()
  ])
  .then(function (results) {
    const users = results[0];
    const draftPicks = _.groupBy(results[1].picks, 'user');
    const golfers = _.indexBy(results[2], '_id');

    _.each(users, function (p) {
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
  .then(mongooseUtil.close);
}

mongooseUtil.connect()
  .then(printScoresForFrank)
  .catch(function (err) {
    console.log(err);
  });
