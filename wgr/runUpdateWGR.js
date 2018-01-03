'use strict';

// Simple one off script that we should only have to run manually once in a while

const _ = require('lodash');
const access = require('../server/access');
const config = require('../server/config');
const mongoose = require('mongoose');
const rawWgrReader = require('./rawWgrReader');
const tourneyConfigReader = require('../server/tourneyConfigReader');

mongoose.set('debug', true);
mongoose.connect(config.mongo_url);

function end() {
  mongoose.connection.close();
}

function updateWGR() {
  const tourneyCfg = tourneyConfigReader.loadConfig();

  const url = tourneyCfg.wgr.url;
  const nameMap = tourneyCfg.wgr.nameMap;

  console.log("attempting update from url: " + url);

  console.log("downloading and parsing");
  rawWgrReader.readRawWgr(url)
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

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', updateWGR);
