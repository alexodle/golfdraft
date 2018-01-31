"use strict";
// Simple one off script that we should only have to run manually once in a while
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const access = require("../server/access");
const mongooseUtil = require("../server/mongooseUtil");
const rawWgrReader_1 = require("./rawWgrReader");
const tourneyConfigReader_1 = require("../server/tourneyConfigReader");
function end() {
    mongooseUtil.close();
}
function updateWGR() {
    const tourneyCfg = tourneyConfigReader_1.loadConfig();
    const url = tourneyCfg.wgr.url;
    const nameMap = tourneyCfg.wgr.nameMap;
    console.log("attempting update from url: " + url);
    console.log("downloading and parsing");
    rawWgrReader_1.default(url)
        .then((wgrEntries) => {
        console.log("parsed %d entries", wgrEntries.length);
        console.log("running name map");
        wgrEntries = _.map(wgrEntries, (entry) => {
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
