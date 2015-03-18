// Simple one off script that we should only have to run manually once in a while

var _ = require('lodash');
var access = require('./access');
var config = require('./config');
var currentWGR = require('../current_wgr');
var mongoose = require('mongoose');
var updateScore = require('./updateScore');

mongoose.set('debug', true);
mongoose.connect(config.mongo_url);

function end() {
  mongoose.connection.close();
}

function updateWGR() {
  console.log("attempting update...");
  var wgrEntries = _.map(currentWGR, function (golfer, i) {
    return { name: golfer, wgr: i + 1 };
  });
  access.ensureWGR(wgrEntries)
  .then(function () {
    end();
  })
  .catch(function (err) {
    console.warn('Error: ' + err);
    end();
  });
}

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', updateWGR);
