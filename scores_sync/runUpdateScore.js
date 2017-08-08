'use strict';

var config = require('../server/config');
var mongoose = require('mongoose');
var redis = require("../server/redis");
var tourneyConfigReader = require('../server/tourneyConfigReader');
var updateScore = require('./updateScore');

var TIMEOUT = 30 * 1000; // 30 seconds

var tourneyCfg = tourneyConfigReader.loadConfig();

var reader = tourneyCfg.scores.type;
var url = tourneyCfg.scores.url;

mongoose.set('debug', true);
mongoose.connect(config.mongo_url);

function end() {
  mongoose.connection.close();
  redis.unref();
}

function updateScores() {
  console.log("attempting update...");

  var timeoutId = setTimeout(function () {
    console.error("TIMEOUT");
    end();
    process.exit(1);
  }, TIMEOUT);

  updateScore.run(reader, url).then(function (succeeded) {
    console.log("succeeded: " + succeeded);
    if (succeeded) {
      redis.pubSubClient.publish("scores:update", new Date());
    }

    clearTimeout(timeoutId);
    end();
  });
}

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', updateScores);
