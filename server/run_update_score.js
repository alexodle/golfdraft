var config = require('./config');
var updateScore = require('./update_score');
var mongoose = require('mongoose');
var models = require('./models');
var Tourney = models.Tourney;
var redis = require("./redis");
var redisCli = redis.client;

mongoose.set('debug', true);
mongoose.connect(config.mongo_url);

function end() {
  console.log("ending");
  mongoose.connection.close();
  redisCli.unref();
}

function updateScores() {
  console.log("attempting update...");
  updateScore.run().then(function (succeeded) {
    console.log("succeeded: " + succeeded);
    if (succeeded) {
      redisCli.publish("scores:update", new Date());
    }
    end();
  });
}

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  updateScores();
});
