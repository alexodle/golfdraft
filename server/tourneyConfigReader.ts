// Refreshes users, pick order, draft picks, and chat

import config from './config';
import {once} from 'lodash';
import * as moment from 'moment';
import * as fs from 'fs';

export interface TourneyConfig {
  name: string;
  startDate: Date;
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
  cfg.startDate = moment(cfg.startDate).toDate();
  return cfg;
}

export const loadConfig = once(_loadConfig);
