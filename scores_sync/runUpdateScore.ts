import config from '../server/config';
import * as mongooseUtil from '../server/mongooseUtil';
import readerConfig from './readerConfig';
import redis from '../server/redis';
import {loadConfig} from '../server/tourneyConfigReader';
import * as updateTourneyStandings from './updateTourneyStandings';
import * as updateScore from './updateScore';

const TIMEOUT = 2 * 60 * 1000; // 2 minutes

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

async function updateScores() {
  console.log("attempting update...");
  await updateScore.run(reader, url, nameMap)
  redis.pubSubClient.publish("scores:update", (new Date()).toString());
}

async function main() {
  const timeoutId = setTimeout(() => {
    console.error("TIMEOUT");
    end();
    process.exit(1);
  }, TIMEOUT);

  try {
    await mongooseUtil.connect();
    await updateScores();
  } finally {
    clearTimeout(timeoutId);
    end();
  }
}

main();
