// @flow
'use strict';

const config = require('../server/config');
const mongoose = require('mongoose');
const readerConfig = require('./readerConfig');
const redis = require("../server/redis");
const tourneyConfigReader = require('../server/tourneyConfigReader');
const updateScore = require('./updateScore');

const TIMEOUT = 30 * 1000; // 30 seconds

const tourneyCfg = tourneyConfigReader.loadConfig();

const reader = readerConfig[tourneyCfg.scores.type].reader;
console.log(tourneyCfg.scores.type);
console.log(reader);
const url = tourneyCfg.scores.url;

mongoose.set('debug', true);
mongoose.connect(config.mongo_url);

function end() {
  mongoose.connection.close();
  redis.unref();
}

function updateScores() {
  console.log("attempting update...");

  const timeoutId = setTimeout(function () {
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

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', updateScores);
