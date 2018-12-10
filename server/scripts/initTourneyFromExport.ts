
import { keyBy, sortBy, take } from 'lodash';
import { getAccess, getUsers } from '../access';
import * as mongooseUtil from '../mongooseUtil';
import { readFileSync} from 'fs';
import { DraftExport, DraftPick, TourneyConfigSpec } from '../ServerTypes';
import constants from '../../common/constants';
import { loadConfig } from '../tourneyConfigReader';
import { initTourney } from './initTourney';

const {NGOLFERS} = constants;

function assert(cond, msg) {
  if (!cond) {
    throw new Error('Assert: ' + msg);
  }
}

function ensureTruthy(obj, msg) {
  assert(!!obj, msg);
  return obj;
}

async function initTourneyFromExport(tourneyCfg: TourneyConfigSpec, draftExport: DraftExport) {
  const draftPicks = sortBy(draftExport.draftPicks, dp => dp.pickNumber);

  // Init new tourney

  assert(draftPicks.length % NGOLFERS === 0,
    `Expected number of picks to be multiple of ${NGOLFERS}, actual length: ${draftPicks.length}`);
  tourneyCfg.draftOrder = take(draftPicks, draftPicks.length / NGOLFERS).map(dp => ensureTruthy(dp.user, `Empty user found in export`));
  console.log(JSON.stringify(tourneyCfg, null, 2));
  const tourneyId = await initTourney(tourneyCfg);

  // Replay picks

  const access = getAccess(tourneyId);
  const [_users, _golfers] = await Promise.all([getUsers(), access.getGolfers()]);
  const usersByName = keyBy(_users, u => u.name);
  const golfersByName = keyBy(_golfers, g => g.name);
  for (const dp of draftPicks) {
    const draftPick: DraftPick = {
      user: ensureTruthy(usersByName[dp.user], `User not found: ${dp.user}`)._id,
      golfer: ensureTruthy(golfersByName[dp.golfer], `Golfer not found: ${dp.golfer}`)._id,
      pickNumber: dp.pickNumber,
      timestamp: null
    };
    await access.makePick(draftPick);
  }
}

async function main(tourneyCfgPath: string, draftExportFile: string) {
  const tourneyCfg = loadConfig(tourneyCfgPath)
  const draftExport: DraftExport = JSON.parse(readFileSync(draftExportFile, 'utf-8'));
  try {
    await mongooseUtil.connect();
    await initTourneyFromExport(tourneyCfg, draftExport);
  } finally {
    mongooseUtil.close();
  }
}

if (require.main === module) {
  if (process.argv.length !== 4) {
    console.error('Usage: node initTourneyFromExport.js <tourney_config> <draft_export_json>');
    process.exit(1);
  }
  
  main(process.argv[2], process.argv[3]);
}