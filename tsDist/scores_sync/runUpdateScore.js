"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongooseUtil = require("../server/mongooseUtil");
const readerConfig_1 = require("./readerConfig");
const redis_1 = require("../server/redis");
const tourneyConfigReader_1 = require("../server/tourneyConfigReader");
const updateScore = require("./updateScore");
const TIMEOUT = 30 * 1000; // 30 seconds
const tourneyCfg = tourneyConfigReader_1.loadConfig();
const reader = readerConfig_1.default[tourneyCfg.scores.type].reader;
console.log(tourneyCfg.scores.type);
console.log(reader);
const url = tourneyCfg.scores.url;
function end() {
    mongooseUtil.close();
    redis_1.default.unref();
}
function updateScores() {
    console.log("attempting update...");
    const timeoutId = setTimeout(function () {
        console.error("TIMEOUT");
        end();
        process.exit(1);
    }, TIMEOUT);
    updateScore.run(reader, url).then(function (succeeded) {
        console.log("succeeded: " + succeeded);
        if (succeeded) {
            redis_1.default.pubSubClient.publish("scores:update", (new Date()).toString());
        }
        clearTimeout(timeoutId);
        end();
    });
}
mongooseUtil.connect()
    .then(updateScores)
    .catch(function (err) {
    console.log(err);
    end();
});
