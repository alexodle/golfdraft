import * as _ from 'lodash';
import * as access from './access';
import * as mongooseUtil from './mongooseUtil';
import * as tourneyConfigReader from './tourneyConfigReader';
import * as tourneyUtils from './tourneyUtils';
import config from './config';
import readerConfig from '../readerConfig';
import updateScore from '../scores_sync/updateScore';

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

function refreshData(pickOrderNames, reader, url) {
  console.log("BEGIN Refreshing all data...");
  console.log("");
  console.log("Pick order:");
  console.log(JSON.stringify(pickOrderNames));
  console.log("");
  console.log("Reader: " + reader);
  console.log("Reader URL: " + url);
  console.log("");

  printState()
    .then(function () {
      console.log("Clearing current state");
      return access.resetTourney();
    })
    .then(function () {
      console.log("Adding users");
      console.log("");
      const users = _.map(pickOrderNames, function (name) {
        return {name: name};
      });
      return access.ensureUsers(users);
    })
    .then(function () {
      return access.getUsers().then(function (users) {
        return _.sortBy(users, function (p) {
          return _.indexOf(pickOrderNames, p.name);
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
      return updateScore.run(readerConfig[reader].reader, url).then(function () {
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
    const tourneyCfg = tourneyConfigReader.loadConfig();
    refreshData(tourneyCfg.draftOrder, tourneyCfg.scores.type, tourneyCfg.scores.url);
  })
  .catch(function (err) {
    console.log(err);
  });
