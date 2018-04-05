import * as _ from 'lodash';
import * as access from './access';
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

function printState() {
  return access.getTourney().then(function (tourney) {
    console.log("BEGIN Logging current state...");
    console.log("");
    console.log("Tourney:");
    console.log(JSON.stringify(tourney));
    console.log("");
    console.log("END Logging current state...");
    console.log("");
  });
}

function nameToUsername(name: string) {
  return name
    .toLowerCase()
    .replace(' ', '_');
}

function refreshData(tourneyCfg: TourneyConfig) {
  console.log("BEGIN Refreshing all data...");
  console.log("");
  console.log("Pick order:");
  console.log(JSON.stringify(tourneyCfg.draftOrder));
  console.log("");
  console.log("Reader: " + tourneyCfg.scores.type);
  console.log("Reader URL: " + tourneyCfg.scores.url);
  console.log("");

  printState()
    .then(function () {
      console.log("Clearing current state");
      return access.resetTourney();
    })
    .then(function () {
      console.log("Adding users");
      console.log("");
      const userInitCfg: {[key: string]: { password: string }} = JSON.parse(fs.readFileSync('init_user_cfg.json', 'utf8'));
      const users: User[] = _.map(tourneyCfg.draftOrder, name => ({
        name: name,
        username: nameToUsername(name),
        password: userInitCfg[name].password,
      } as User));
      return access.ensureUsers(users);
    })
    .then(function () {
      return access.getUsers().then(function (users) {
        return _.sortBy(users, function (p) {
          return _.indexOf(tourneyCfg.draftOrder, p.name);
        });
      });
    })
    .then(function (sortedUsers) {
      console.log("Updating pickOrder");
      const pickOrder = tourneyUtils.snakeDraftOrder(sortedUsers);
      return access.setPickOrder(pickOrder);
    })
    .then(function () {
      console.log("END Refreshing all data...");
    })
    .then(printState)
    .then(function () {
      console.log("BEGIN Updating scores");
      return updateScore.run(readerConfig[tourneyCfg.scores.type].reader, tourneyCfg.scores.url, tourneyCfg.scores.nameMap, true)
        .then(() => {
          console.log("END Updating scores");
        });
    })
    .catch(function (err) {
      if (err.stack) {
        console.log(err.stack);
      } else {
        console.log(err);
      }
    })
    .then(function () {
      mongooseUtil.close();
    });
}

mongooseUtil.connect()
  .then(function () {
    const tourneyCfg = loadConfig();
    console.log(tourneyCfg);
    refreshData(tourneyCfg);
  })
  .catch(function (err) {
    console.log(err);
  });
