import {getActiveTourneyAccess} from '../server/access';
import * as mongooseUtil from '../server/mongooseUtil';
import rawWgrReader from './rawWgrReader';

async function updateWGR() {
  const access = await getActiveTourneyAccess();

  const tourneyCfg = await access.getTourneyConfig();
  const url = tourneyCfg.wgr.url;
  const nameMap = tourneyCfg.wgr.nameMap;

  console.log("attempting update from url: " + url);

  console.log("downloading and parsing");
  let wgrEntries = await rawWgrReader(url)

  console.log("parsed %d entries", wgrEntries.length);
  console.log("running name map");
  wgrEntries = wgrEntries.map(entry => ({
    name: nameMap[entry.name] || entry.name,
    wgr: entry.wgr
  }));

  console.log("parsed %d entries", wgrEntries.length);
  console.log("updating db");
  await access.replaceWgrs(wgrEntries);

  console.log('success');
}

async function run() {
  try {
    await mongooseUtil.connect();
    await updateWGR();
  } finally {
    mongooseUtil.close();
  }
}

run();
