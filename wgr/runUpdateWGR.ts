// Simple one off script that we should only have to run manually once in a while

import * as _ from 'lodash';
import {getAccess} from '../server/access';
import config from '../server/config';
import * as mongooseUtil from '../server/mongooseUtil';
import rawWgrReader from './rawWgrReader';
import {loadConfig} from '../server/tourneyConfigReader';

const access = getAccess(config.current_tourney_id);

function end() {
  mongooseUtil.close();
}

async function updateWGR() {
  const tourneyCfg = loadConfig();

  const url = tourneyCfg.wgr.url;
  const nameMap = tourneyCfg.wgr.nameMap;

  console.log("attempting update from url: " + url);

  try {
    console.log("downloading and parsing");
    let wgrEntries = await rawWgrReader(url)

    console.log("parsed %d entries", wgrEntries.length);
    console.log("running name map");
    wgrEntries = _.map(wgrEntries, entry => (
       { name: nameMap[entry.name] || entry.name, wgr: entry.wgr }
    ));

    console.log("parsed %d entries", wgrEntries.length);
    console.log("updating db");
    await access.replaceWgrs(wgrEntries);

    console.log('success');
  } catch (err) {
    console.log(err.stack);
    console.warn('error: ' + err);
  } finally {
    end();
  }
}

mongooseUtil
  .connect()
  .then(updateWGR);
