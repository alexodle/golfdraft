var config = require('./config');
var mongoose = require('mongoose');
var redis = require("./redis");
var updateScore = require('./updateScore');

var redisCli = redis.client;

mongoose.set('debug', true);
mongoose.connect(config.mongo_url);

function end() {
  mongoose.connection.close();
  redisCli.unref();
}

function updateScores() {
  console.log("attempting update...");
  updateScore.run(config.yahoo_url).then(function (succeeded) {
    console.log("succeeded: " + succeeded);
    if (succeeded) {
      redisCli.publish("scores:update", new Date());
    }
    end();
  });
}

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', updateScores);
