import {Access} from '../server/access';
import {rawWgrReader} from './rawWgrReader';

export async function updateWgr(access: Access) {
  const tourneyCfg = await access.getTourneyConfig();

  const url = tourneyCfg.wgr.url;
  const nameMap = tourneyCfg.wgr.nameMap;

  console.log("downloading and parsing");
  let wgrEntries = await rawWgrReader(url);
  console.log("parsed %d entries", wgrEntries.length);

  wgrEntries = wgrEntries.map(entry => ({
    name: nameMap[entry.name] || entry.name,
    wgr: entry.wgr
  }));
  await access.replaceWgrs(wgrEntries);
  console.log('success');
}
