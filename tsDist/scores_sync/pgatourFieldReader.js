"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const request = require("request");
const JQUERY_URL = 'file://' + __dirname + '/../assets/jquery.js';
function parseJson(json) {
    const golfers = _.map(JSON.parse(json).Tournament.Users, (p) => {
        const lastFirst = p.UserName.split(', ');
        return {
            golfer: lastFirst[1] + ' ' + lastFirst[0],
            scores: [0, 0, 0, 0],
            thru: 0,
            day: 0
        };
    });
    return golfers;
}
class PgaTourFieldReader {
    run(url) {
        return new Promise(function (fulfill, reject) {
            request({ url }, function (error, response, body) {
                if (error) {
                    console.log(error);
                    reject(error);
                    return;
                }
                const golfers = parseJson(body);
                fulfill({
                    par: 72,
                    golfers
                });
            });
        });
    }
    parseJson(json) {
        return parseJson(json);
    }
}
exports.default = new PgaTourFieldReader();
