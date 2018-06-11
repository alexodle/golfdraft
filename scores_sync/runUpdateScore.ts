import config from '../server/config';
import * as mongooseUtil from '../server/mongooseUtil';
import readerConfig from './readerConfig';
import redis from '../server/redis';
import {loadConfig} from '../server/tourneyConfigReader';
import * as updatePlayerScores from './updatePlayerScores';
import * as updateScore from './updateScore';

const TIMEOUT = 30 * 1000; // 30 seconds

const tourneyCfg = loadConfig();

const reader = readerConfig[tourneyCfg.scores.type].reader;
const nameMap = tourneyCfg.scores.nameMap;
console.log(tourneyCfg.scores.type);
console.log(reader);
const url = tourneyCfg.scores.url;

function end() {
  mongooseUtil.close();
  redis.unref();
}

function updateScores() {
  console.log("attempting update...");

  const timeoutId = setTimeout(function () {
    console.error("TIMEOUT");
    end();
    process.exit(1);
  }, TIMEOUT);

  updateScore.run(reader, url, nameMap)
    .then(() => updatePlayerScores.run())
    .then(() => redis.pubSubClient.publish("scores:update", (new Date()).toString()))
    .catch(e => console.error("UPDATE FAILED", e))
    .then(() => {
      clearTimeout(timeoutId);
      end();
    });
}

mongooseUtil.connect()
  .then(updateScores)
  .catch(function (err) {
    console.log(err);
    end();
  });
