import * as _ from 'lodash';
import {getAccess} from './access';
import * as mongooseUtil from './mongooseUtil';
import * as updateScore from '../scores_sync/updateScore';
import { loadConfig, TourneyConfig } from './tourneyConfigReader';
import * as tourneyUtils from './tourneyUtils';
import * as fs from 'fs';
import config from './config';
import readerConfig from '../scores_sync/readerConfig';
import {
  User,
} from './ServerTypes';

const access = getAccess(config.current_tourney_id);

async function printState() {
  const tourney = await access.getTourney();
  console.log("BEGIN Logging current state...");
  console.log("");
  console.log("Tourney:");
  console.log(JSON.stringify(tourney));
  console.log("");
  console.log("END Logging current state...");
  console.log("");
}

function nameToUsername(name: string) {
  return name
    .toLowerCase()
    .replace(' ', '_');
}

async function refreshData(tourneyCfg: TourneyConfig) {
  console.log("BEGIN Refreshing all data...");
  console.log("");
  console.log("Pick order:");
  console.log(JSON.stringify(tourneyCfg.draftOrder));
  console.log("");
  console.log("Reader: " + tourneyCfg.scores.type);
  console.log("Reader URL: " + tourneyCfg.scores.url);
  console.log("");

  await printState();
  await access.resetTourney();
  
  console.log("Adding users");
  console.log("");
  const userInitCfg: {[key: string]: { password: string }} = JSON.parse(fs.readFileSync('init_user_cfg.json', 'utf8'));
  const userSpecs: User[] = _.map(tourneyCfg.draftOrder, name => ({
    name: name,
    username: nameToUsername(name),
    password: userInitCfg[name].password,
  } as User));
  await access.ensureUsers(userSpecs);
  
  const users = await access.getUsers();
  const sortedUsers = _.sortBy(users, p => _.indexOf(tourneyCfg.draftOrder, p.name));
  
  console.log("Updating pickOrder");
  const pickOrder = tourneyUtils.snakeDraftOrder(sortedUsers);
  await access.setPickOrder(pickOrder);
  console.log("END Refreshing all data...");

  await printState();
  
  console.log("BEGIN Updating scores");
  await updateScore.run(readerConfig[tourneyCfg.scores.type].reader, tourneyCfg.scores.url, tourneyCfg.scores.nameMap, true);
  console.log("END Updating scores");
}

async function run() {
  await mongooseUtil.connect();
  try {
    const tourneyCfg = loadConfig();
    console.log(tourneyCfg);
    await refreshData(tourneyCfg);
  } catch (err) {
    if (err.stack) {
      console.log(err.stack);
    } else {
      console.log(err);
    }
  } finally {
    mongooseUtil.close();
  }
}

run();