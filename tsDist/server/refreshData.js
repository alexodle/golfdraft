"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const access = require("./access");
const mongooseUtil = require("./mongooseUtil");
const updateScore = require("../scores_sync/updateScore");
const tourneyConfigReader = require("./tourneyConfigReader");
const tourneyUtils = require("./tourneyUtils");
const readerConfig_1 = require("../scores_sync/readerConfig");
function printState() {
    return access.getTourney().then(function (tourney) {
        console.log("BEGIN Logging current state...");
        console.log("");
        console.log("Tourney:");
        console.log(JSON.stringify(tourney));
        console.log("");
        console.log("END Logging current state...");
        console.log("");
    });
}
function refreshData(pickOrderNames, reader, url) {
    console.log("BEGIN Refreshing all data...");
    console.log("");
    console.log("Pick order:");
    console.log(JSON.stringify(pickOrderNames));
    console.log("");
    console.log("Reader: " + reader);
    console.log("Reader URL: " + url);
    console.log("");
    printState()
        .then(function () {
        console.log("Clearing current state");
        return access.resetTourney();
    })
        .then(function () {
        console.log("Adding users");
        console.log("");
        const users = _.map(pickOrderNames, function (name) {
            return { name: name };
        });
        return access.ensureUsers(users);
    })
        .then(function () {
        return access.getUsers().then(function (users) {
            return _.sortBy(users, function (p) {
                return _.indexOf(pickOrderNames, p.name);
            });
        });
    })
        .then(function (sortedUsers) {
        console.log("Updating pickOrder");
        const pickOrder = tourneyUtils.snakeDraftOrder(sortedUsers);
        return access.setPickOrder(pickOrder);
    })
        .then(function () {
        console.log("END Refreshing all data...");
    })
        .then(printState)
        .then(function () {
        console.log("BEGIN Updating scores");
        return updateScore.run(readerConfig_1.default[reader].reader, url).then(function () {
            console.log("END Updating scores");
        });
    })
        .catch(function (err) {
        if (err.stack) {
            console.log(err.stack);
        }
        else {
            console.log(err);
        }
    })
        .then(function () {
        mongooseUtil.close();
    });
}
mongooseUtil.connect()
    .then(function () {
    const tourneyCfg = tourneyConfigReader.loadConfig();
    refreshData(tourneyCfg.draftOrder, tourneyCfg.scores.type, tourneyCfg.scores.url);
})
    .catch(function (err) {
    console.log(err);
});
