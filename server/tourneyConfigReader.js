'use strict';

// Refreshes players, pick order, draft picks, and chat

var _ = require('lodash');
var config = require('./config');
var fs = require('fs');


function saveConfig(fileName) {
  fileName = fileName || config.tourney_cfg;
  fs.writeFileSync(fileName,JSON.stringify(this,null,2), 'utf8');
}

function loadConfig() {
  var cfg = JSON.parse(fs.readFileSync(config.tourney_cfg, 'utf8'));
  cfg.draftRounds = cfg.draftRounds || 4;
  cfg.save = saveConfig.bind(cfg);
  return cfg;
}


module.exports = {
  loadConfig: _.once(loadConfig),
  saveConfig: saveConfig
};