import * as mongooseUtil from '../server/mongooseUtil';
import {getActiveTourneyAccess} from '../server/access';
import constants from '../common/constants';

async function printGolfersWithoutWgr() {
  const access = await getActiveTourneyAccess();
  const golfers = await access.getGolfers();
  const filtered = golfers
    .filter(g => g.wgr === constants.UNKNOWN_WGR)
    .map(g => g.name)
    .sort();
  console.log('');
  console.log('');
  console.log(filtered.join('\n'));
}

async function run() {
  try {
    await mongooseUtil.connect();
    await printGolfersWithoutWgr();
  } finally {
    mongooseUtil.close();
  }
}

run();
