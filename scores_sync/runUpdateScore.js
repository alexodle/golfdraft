'use strict';

var config = require('../server/config');
var mongoose = require('mongoose');
var readerConfig = require('./readerConfig');
var redis = require("../server/redis");
var updateScore = require('./updateScore');

var TIMEOUT = 30 * 1000; // 30 seconds

// Parse CLI args
var parseError = 'Usage: node ./runUpdateScore.js <reader> <url>';
var readerCfg;
var reader;
var url;
try {
  readerCfg = readerConfig[process.argv[2]];
  if (!readerCfg) {
    parseError = 'Invalid reader: ' + process.argv[2];
  }
  reader = readerCfg.reader;
  url = process.argv[3];
} catch (e) {}

if (!reader || !url) {
  console.error(parseError);
  process.exit(1);
}

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
