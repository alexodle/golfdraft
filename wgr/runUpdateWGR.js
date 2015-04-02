// Simple one off script that we should only have to run manually once in a while

var _ = require('lodash');
var access = require('../server/access');
var config = require('../server/config');
var mongoose = require('mongoose');
var nameMap = require('./nameMap');
var rawWgrReader = require('./rawWgrReader');

var FILE_NAME = './wgr_raw.html';

mongoose.set('debug', true);
mongoose.connect(config.mongo_url);

function end() {
  mongoose.connection.close();
}

function updateWGR() {
  console.log("attempting update...");

  console.log("parsing");
  rawWgrReader.readRawWgr(FILE_NAME)
    .then(function (wgrEntries) {
      console.log("parsed %d entries", wgrEntries.length);
      console.log("running name map");
      wgrEntries = _.map(wgrEntries, function (entry) {
        return { name: nameMap[entry.name] || entry.name, wgr: entry.wgr };
      });

      console.log("parsed %d entries", wgrEntries.length);
      console.log("updating db");
      return access.replaceWgrs(wgrEntries);
    })
    .then(function () {
      console.log('success');
      end();
    })
    .catch(function (err) {
      console.dir(err.stack);
      console.warn('error: ' + err);
      end();
    });
}

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', updateWGR);
