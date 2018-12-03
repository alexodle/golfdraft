import {sortBy} from 'lodash';
import {initNewTourney, getAccess, updateAppState} from './access';
import * as mongooseUtil from './mongooseUtil';
import * as updateScore from '../scores_sync/updateScore';
import {loadConfig, TourneyConfig} from './tourneyConfigReader';
import * as tourneyUtils from './tourneyUtils';
import * as fs from 'fs';
import readerConfig from '../scores_sync/readerConfig';
import {User} from './ServerTypes';


function nameToUsername(name: string) {
  return name
    .toLowerCase()
    .replace(' ', '_');
}

async function refreshData(tourneyCfg: TourneyConfig) {
  console.log(JSON.stringify(tourneyCfg.draftOrder));
  console.log("Reader: " + tourneyCfg.scores.type);
  console.log("Reader URL: " + tourneyCfg.scores.url);

  const tourneyId = await initNewTourney(tourneyCfg.name, tourneyCfg.startDate);
  const access = getAccess(tourneyId);
  
  const userInitCfg: {[key: string]: { password: string }} = JSON.parse(fs.readFileSync('init_user_cfg.json', 'utf8'));
  const userSpecs: User[] = tourneyCfg.draftOrder.map(name => ({
    name: name,
    username: nameToUsername(name),
    password: userInitCfg[name].password,
  } as User));
  await access.ensureUsers(userSpecs);
  
  const users = await access.getUsers();
  const sortedUsers = sortBy(users, p => tourneyCfg.draftOrder.indexOf(p.name));
  
  const pickOrder = tourneyUtils.snakeDraftOrder(sortedUsers);
  await access.setPickOrder(pickOrder);
  
  await updateScore.run(
    access,
    readerConfig[tourneyCfg.scores.type].reader,
    tourneyCfg.scores.url,
    tourneyCfg.scores.nameMap,
    true
  );

  await updateAppState({
    activeTourneyId: tourneyId,
    isDraftPaused: false,
    allowClock: true,
    draftHasStarted: false,
    autoPickUsers: []
  });
}

async function run() {
  try {
    await mongooseUtil.connect();
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