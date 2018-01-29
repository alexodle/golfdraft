// Simple one off script that we should only have to run manually once in a while

import * as _ from 'lodash';
import access from '../access';
import config from '../config';
import mongooseUtil from '../mongooseUtil';
import rawWgrReader from './rawWgrReader';
import tourneyConfigReader from '../tourneyConfigReader';

function end() {
  mongooseUtil.close();
}

function updateWGR() {
  const tourneyCfg = tourneyConfigReader.loadConfig();

  const url = tourneyCfg.wgr.url;
  const nameMap = tourneyCfg.wgr.nameMap;

  console.log("attempting update from url: " + url);

  console.log("downloading and parsing");
  rawWgrReader.readRawWgr(url)
    .then(function (wgrEntries) {
      console.log("parsed %d entries", wgrEntries.length);
      console.log("running name map");
      wgrEntries = _.map(wgrEntries, function (entry) {
        return { name: nameMap[entry.name] || entry.name, wgr: entry.wgr };
      });

      console.log("parsed %d entries", wgrEntries.length);
      console.log("updating db");
      return access.replaceWgrs(wgrEntries);
    })
    .then(function () {
      console.log('success');
      end();
    })
    .catch(function (err) {
      console.dir(err.stack);
      console.warn('error: ' + err);
      end();
    });
}

mongooseUtil.connect()
  .then(updateWGR)
  .catch(function (err) {
    console.log(err);
    end();
  });
