import * as mongooseUtil from '../server/mongooseUtil';
import readerConfig from './readerConfig';
import redis from '../server/redis';
import {getActiveTourneyAccess, } from '../server/access';
import * as updateScore from './updateScore';

const TIMEOUT = 2 * 60 * 1000; // 2 minutes

function end() {
  mongooseUtil.close();
  redis.unref();
}

async function updateScores() {
  console.log("attempting update...");
  const access = await getActiveTourneyAccess();
  const tourneyCfg = await access.getTourneyConfig();
  const reader = readerConfig[tourneyCfg.scoresSync.syncType].reader;
  await updateScore.run(access, reader, tourneyCfg);
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
