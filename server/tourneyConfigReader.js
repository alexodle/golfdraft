'use strict';

// Refreshes players, pick order, draft picks, and chat

const _ = require('lodash');
const config = require('./config');
const fs = require('fs');


function loadConfig() {
  const cfg = JSON.parse(fs.readFileSync(config.tourney_cfg, 'utf8'));
  return cfg;
}

module.exports = {
  loadConfig: _.once(loadConfig)
};
