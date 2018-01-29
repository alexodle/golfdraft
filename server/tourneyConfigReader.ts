// Refreshes users, pick order, draft picks, and chat

import * as _ from 'lodash';
import config from './config';
import * as fs from 'fs';

export function _loadConfig() {
  const cfg = JSON.parse(fs.readFileSync(config.tourney_cfg, 'utf8'));
  return cfg;
}

export const loadConfig = _.once(_loadConfig);
