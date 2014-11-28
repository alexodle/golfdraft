var _ = require('lodash');
var config = require('../server/config');
var models = require('../server/models');
var Promise = require('promise');

var testTourney = models.Tourney({
  name: 'Test Tourney',
  par: 70,
  lastUpdate: new Date(),
  yahooUrl: 'http://golfdrafttest.com/notaurl'
});

_.extend(config, {
  prod: false,

  mongo_url: 'mongodb://localhost:27017/golfdraft_testdb',
  redis_url: 'redis://:@localhost:6379/test',

  tourney_id: testTourney._id,

  yahoo_url: 'http://notaurl.com/notaurl'
});

function initDb() {
  // set up db connection
  var mongoose = require('mongoose');
  mongoose.set('debug', true);
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
};

module.exports = {
  initDb: _.once(initDb)
}

