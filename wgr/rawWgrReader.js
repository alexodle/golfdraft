var _ = require('lodash');
var constants = require('../common/constants');
var jsdom = require('jsdom');
var Promise = require('promise');

var AMATEUR_REGEX = /\(Am\)$/i;

var RawWgrReader = {

  readRawWgr: function (url) {
    return new Promise(function (fulfill, reject) {
      request({ url: url }, function (error, response, body) {
        if (error) {
          reject(error);
          return;
        }

        jsdom.env(body, ['http://code.jquery.com/jquery.js'], function (errors, window) {
          if (errors) {
            console.log('Error retrieving: ' + fileName);
            reject(new Error(JSON.stringify(errors)));
            return;
          }
          var $ = window.$;
          var wgrs = [];

          $('#ranking_table > .table_container > table > tbody > tr').each(function () {
            $tr = $(this);
            var $tds = $('td', $tr);

            var wgr = _.parseInt($($tds.get(0)).text());
            var golferName = $('td.name', $tr)
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

};

module.exports = RawWgrReader;
