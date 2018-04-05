// Refreshes users, pick order, draft picks, and chat

import * as _ from 'lodash';
import config from './config';
import * as fs from 'fs';

export interface TourneyConfig {
  name: string;
  scores: {
    type: string;
    url: string;
    nameMap: { [name: string]: string };
  };
  draftOrder: string[];
  wgr: {
    url: string;
    nameMap: { [name: string]: string };
  };
}

function _loadConfig(): TourneyConfig {
  const cfg: TourneyConfig = JSON.parse(fs.readFileSync(config.tourney_cfg, 'utf8'));
  return cfg;
}

export const loadConfig = _.once(_loadConfig);
