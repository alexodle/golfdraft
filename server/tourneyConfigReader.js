'use strict';

// Refreshes players, pick order, draft picks, and chat

var _ = require('lodash');
var config = require('./config');
var fs = require('fs');


function loadConfig() {
  var cfg = JSON.parse(fs.readFileSync(config.tourney_cfg, 'utf8'));
  cfg.draftRounds = cfg.draftRounds || 4;
  return cfg;
}

module.exports = {
  loadConfig: _.once(loadConfig)
};