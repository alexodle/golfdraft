"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const access = require("../server/access");
const constants_1 = require("../common/constants");
const DAYS = constants_1.default.NDAYS;
const MISSED_CUT = constants_1.default.MISSED_CUT;
const OVERRIDE_KEYS = ['golfer', 'day', 'scores'];
function validate(result) {
    if (_.has(result, 'par') && !_.includes([70, 71, 72, 73], result.par)) {
        console.log("ERROR - Par invalid:" + result.par);
        return false;
    }
    return _.every(result.golfers, (g) => {
        const validScores = _.every(g.scores, (s) => {
            return _.isFinite(s) || s === MISSED_CUT;
        });
        let inv = false;
        if (g.golfer === "-") {
            console.log("ERROR - Invalid golfer name");
            inv = true;
        }
        else if (g.scores.length !== DAYS) {
            console.log("ERROR - Invalid golfer scores length");
            inv = true;
        }
        else if (!validScores) {
            console.log("ERROR - Invalid golfer scores");
            inv = true;
        }
        else if (!_.includes(_.range(DAYS + 1), g.day)) {
            console.log("ERROR - Invalid golfer day");
            inv = true;
        }
        if (inv) {
            console.log(JSON.stringify(g));
        }
        return !inv;
    });
}
exports.validate = validate;
function mergeOverrides(scores, scoreOverrides) {
    const overridesByGolfer = _.chain(scoreOverrides)
        .map((o) => {
        return _.chain(o)
            .omitBy(_.isNull)
            .pick(OVERRIDE_KEYS)
            .value();
    })
        .keyBy((o) => o.golfer.toString())
        .value();
    const newScores = _.map(scores, (s) => {
        const override = overridesByGolfer[s.golfer.toString()];
        if (override) {
            return _.extend({}, s, override);
        }
        return s;
    });
    return newScores;
}
exports.mergeOverrides = mergeOverrides;
function run(reader, url) {
    return reader.run(url).then(function (rawTourney) {
        // Quick assertion of data
        if (!rawTourney || !validate(rawTourney)) {
            return false;
        }
        // Ensure tourney/par
        const update = { pgatourUrl: url, par: rawTourney.par };
        const mainPromise = access.updateTourney(update)
            .then(() => {
            // Ensure golfers
            const golfers = _.map(rawTourney.golfers, (g) => {
                return { name: g.golfer };
            });
            return access.ensureGolfers(golfers);
        })
            .then(function () {
            return Promise.all([
                access.getGolfers(),
                access.getScoreOverrides()
            ]);
        })
            .then((results) => {
            const gs = results[0];
            const scoreOverrides = results[1];
            // Build scores with golfer id
            const golfersByName = _.keyBy(gs, "name");
            const scores = _.map(rawTourney.golfers, (g) => {
                const golfer = golfersByName[g.golfer]._id;
                return {
                    golfer: golfer,
                    day: g.day,
                    thru: g.thru,
                    scores: g.scores
                };
            });
            // Merge in overrides
            console.log("scores BEFORE overrides: " + JSON.stringify(scores));
            const finalScores = mergeOverrides(scores, scoreOverrides);
            console.log("");
            console.log("scores AFTER overrides: " + JSON.stringify(scores));
            console.log("");
            if (!finalScores.length) {
                throw new Error("wtf. no scores.");
            }
            // Save
            return access.updateScores(finalScores);
        })
            .then(function () {
            console.log("HOORAY! - scores updated");
            return true;
        })
            .catch(function (e) {
            console.log(e);
            return false;
        });
        return mainPromise;
    });
}
exports.run = run;
