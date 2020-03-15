import {keyBy} from 'lodash';
import {initNewTourney, getAccess, ensureUsers, getUsers, updateAppState} from '../access';
import * as mongooseUtil from '../mongooseUtil';
import * as updateScore from '../../scores_sync/updateScore';
import * as updateTourneyStandings from '../../scores_sync/updateTourneyStandings';
import {loadConfig} from '../tourneyConfigReader';
import * as tourneyUtils from '../tourneyUtils';
import { readFileSync } from 'fs';
import readerConfig from '../../scores_sync/readerConfig';
import {User, TourneyConfigSpec} from '../ServerTypes';
import {updateWgr} from '../../wgr/updateWgr';

function assert(cond, msg) {
  if (!cond) {
    throw new Error('Assert: ' + msg);
  }
}

function ensureTruthy(obj, msg) {
  assert(!!obj, msg);
  return obj;
}

function nameToUsername(name: string) {
  return name
    .toLowerCase()
    .replace(' ', '_');
}

export async function initTourney(tourneyCfg: TourneyConfigSpec): Promise<string> {
  const tourneyId = await initNewTourney(tourneyCfg);
  const access = getAccess(tourneyId);
  
  const userInitCfg: {[key: string]: { password: string }} = JSON.parse(readFileSync('init_user_cfg.json', 'utf8'));
  const userSpecs: User[] = tourneyCfg.draftOrder.map(name => ({
    name: name,
    username: nameToUsername(name),
    password: userInitCfg[name].password,
  } as User));
  await ensureUsers(userSpecs);
  
  const users = await getUsers();
  const usersByName = keyBy(users, u => u.name);

  const sortedUsers = tourneyCfg.draftOrder.map(name => ensureTruthy(usersByName[name], `User not found: ${name}`));
  const pickOrder = tourneyUtils.snakeDraftOrder(sortedUsers);
  await access.setPickOrder(pickOrder);
  
  await updateScore.run(
    access,
    readerConfig[tourneyCfg.scoresSync.syncType].reader,
    tourneyCfg,
    true
  );
  await updateTourneyStandings.run(access);

  await updateAppState({
    activeTourneyId: tourneyId,
    isDraftPaused: false,
    allowClock: true,
    draftHasStarted: false,
    autoPickUsers: []
  });

  console.log("Updating WGR");
  await updateWgr(access);

  return tourneyId;
}

async function run(configPath: string) {
  const tourneyCfg = loadConfig(configPath);
  try {
    await mongooseUtil.connect();
    console.log(JSON.stringify(tourneyCfg, null, 2));
    await initTourney(tourneyCfg);
  } finally {
    mongooseUtil.close();
  }
}

if (require.main === module) {
  if (process.argv.length !== 3) {
    console.error('Usage: node initTourney.js <tourney_config>');
    process.exit(1);
  }
  
  run(process.argv[2]);
}
