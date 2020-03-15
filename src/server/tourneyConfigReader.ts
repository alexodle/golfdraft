// Refreshes users, pick order, draft picks, and chat

import * as moment from 'moment';
import * as fs from 'fs';
import {TourneyConfigSpec} from '../server/ServerTypes';

function ensureReplaceKey(o, oldKey, newKey) {
  if (o[oldKey]) {
    o[newKey] = o[oldKey];
    delete o[oldKey];
  }
}

export function loadConfig(tourneyCfgPath: string): TourneyConfigSpec {
  const cfg: TourneyConfigSpec = JSON.parse(fs.readFileSync(tourneyCfgPath, 'utf8'));
  cfg.startDate = moment(cfg.startDate).toDate();

  // Back-compat
  ensureReplaceKey(cfg, 'scores', 'scoresSync');
  ensureReplaceKey(cfg.scoresSync, 'type', 'syncType');

  return cfg;
}
