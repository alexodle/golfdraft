"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const jsdom = require("jsdom");
const request = require("request");
const AMATEUR_REGEX = /\(Am\)$/i;
function rawWgrReader(url) {
    return new Promise(function (fulfill, reject) {
        request({ url: url }, function (error, response, body) {
            if (error) {
                reject(error);
                return;
            }
            jsdom.env(body, ['http://code.jquery.com/jquery.js'], function (errors, window) {
                if (errors) {
                    console.log('Error retrieving: ' + url);
                    reject(new Error(JSON.stringify(errors)));
                    return;
                }
                const $ = window.$;
                const wgrs = [];
                $('#ranking_table > .table_container > table > tbody > tr').each(function () {
                    const $tr = $(this);
                    const $tds = $('td', $tr);
                    const wgr = _.parseInt($($tds.get(0)).text());
                    const golferName = $('td.name', $tr)
                        .text()
                        .trim()
                        .replace(AMATEUR_REGEX, '');
                    wgrs.push({ wgr: wgr, name: golferName });
                });
                fulfill(wgrs);
            });
        });
    });
}
exports.default = rawWgrReader;
