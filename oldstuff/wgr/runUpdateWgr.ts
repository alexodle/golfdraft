import {getActiveTourneyAccess} from '../server/access';
import * as mongooseUtil from '../server/mongooseUtil';
import {updateWgr} from './updateWgr';

async function run() {
  try {
    await mongooseUtil.connect();
    const access = await getActiveTourneyAccess();
    await updateWgr(access);
  } finally {
    mongooseUtil.close();
  }
}

if (require.main === module) {
  run();
}
