const _ = require('lodash');
const config = require('../server/config');
const models = require('../server/models');
const mongooseUtil = require('../server/mongooseUtil');
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
  mongooseUtil.connect()
    .then(function () {
      return testTourney.save();
    });
}

module.exports = {
  initDb: _.once(initDb)
};
