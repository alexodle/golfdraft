import { getActiveTourneyAccess } from '../server/access';
import * as mongooseUtil from '../server/mongooseUtil';
import redis from '../server/redis';
import readerConfig from './readerConfig';
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
  } catch (e) {
    console.error('Error while running score')
    console.error(e.stack)
    process.exit(1)
  } finally {
    clearTimeout(timeoutId);
    end();
  }
}

main();
