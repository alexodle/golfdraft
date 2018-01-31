"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const constants_1 = require("../common/constants");
const jsdom = require("jsdom");
const DEFAULT_YSURL = "http://sports.yahoo.com/golf/pga/leaderboard";
const MISSED_CUT = constants_1.default.MISSED_CUT;
function eachGolferCb(callback) {
    return function (tourney) {
        const newGolfers = _.map(tourney.golfers, function (g) {
            callback(g, tourney);
        });
        return tourney;
    };
}
const YahooReader = {
    readUrl: function (yahooUrl) {
        yahooUrl = yahooUrl || DEFAULT_YSURL;
        console.log('YahooReader - updating score from: ' + yahooUrl);
        return new Promise(function (fulfill, reject) {
            jsdom.env(yahooUrl, ["http://code.jquery.com/jquery.js"], function (errors, window) {
                if (errors) {
                    console.log("Error retrieving: " + yahooUrl);
                    reject(new Error(JSON.stringify(errors)));
                    return;
                }
                const $ = window.$;
                const par = parseInt($("li.par span").text(), 10);
                const golfers = [];
                $("#leaderboardtable table.sportsTable tbody tr").each(function () {
                    const $tr = $(this);
                    const $td = $("td.player", $tr);
                    const golfer = $("a", $td).text().trim()
                        .replace("*", "")
                        .replace("x-", "");
                    if (!golfer) {
                        return;
                    }
                    const scores = _.times(4, function () {
                        return $($td = $td.next()).text().trim();
                    });
                    const today = $($td = $td.next()).text().trim();
                    const thru = $($td = $td.next()).text().trim();
                    golfers.push({
                        golfer: golfer,
                        scores: scores,
                        thru: thru,
                        today: today
                    });
                });
                fulfill({
                    par: par,
                    golfers: golfers
                });
            });
        });
    },
    parseScores: function (g) {
        let day = 0;
        g.scores = _.map(g.scores, function (s) {
            if (s.toLowerCase().indexOf("pm") !== -1 ||
                s.toLowerCase().indexOf("am") !== -1 ||
                s === "-") {
                return 0;
            }
            else if (_.includes([MISSED_CUT, "WD", "MDF", "DQ", "CUT"], s)) {
                return MISSED_CUT;
            }
            else {
                day++;
                return parseInt(s, 10);
            }
        });
        const missedCut = _.includes(g.scores, MISSED_CUT);
        if (missedCut) {
            g.day = g.scores.length;
        }
        else {
            g.day = g.thru === "F" || g.thru === "-" ? day : day - 1;
        }
        return g;
    },
    relativeToPar: function (g, tourney) {
        const par = tourney.par;
        const missedCut = _.includes(g.scores, MISSED_CUT);
        if (g.today === "E") {
            g.today = 0;
        }
        g.scores = _.map(g.scores, function (s, i) {
            if (s === MISSED_CUT) {
                return s;
            }
            else if (i < g.day) {
                return s - par;
            }
            else {
                return s;
            }
        });
        if (!missedCut && g.thru !== "F" && g.thru !== "-") {
            g.scores[g.day] = parseInt(g.today, 10);
        }
        return g;
    },
    run: function (yahooUrl) {
        function printState(state) {
            return function (tourney) {
                console.log("Contents (" + state + "):");
                console.log(JSON.stringify(tourney));
                console.log("");
                return tourney;
            };
        }
        return this.readUrl(yahooUrl)
            .then(printState("Raw"))
            .then(eachGolferCb(this.parseScores))
            .then(printState("Parse scores"))
            .then(eachGolferCb(this.relativeToPar))
            .then(printState("Relative to par"), function (e) {
            console.log(e);
            return null;
        });
    }
};
exports.default = YahooReader;
