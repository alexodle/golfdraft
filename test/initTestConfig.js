const _ = require('lodash');
const config = require('../server/config');
const models = require('../server/models');
const Promise = require('promise');
const should = require('should');

const testTourney = models.Tourney({
  name: 'Test Tourney',
  par: 70,
  lastUpdate: new Date(),
  yahooUrl: 'http://golfdrafttest.com/notaurl'
});

_.extend(config, {
  prod: false,

  mongo_url: 'mongodb://localhost:27017/golfdraft_testdb',
  redis_url: 'redis://:@localhost:6379/test',

  tourney_id: testTourney._id
});

function initDb() {
  // set up db connection
  const mongoose = require('mongoose');
  mongoose.connect(config.mongo_url);

  return new Promise(function (fulfill, reject) {
    mongoose.connection.once('open', function () {
      testTourney.save(function (err) {
        if (err) {
          reject(err);
        } else {
          fulfill();
        }
      });
    });
  });
}

module.exports = {
  initDb: _.once(initDb)
};
