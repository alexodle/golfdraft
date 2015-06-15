var _ = require('lodash');
var jsdom = require('jsdom');
var Promise = require('promise');
var constants = require('../common/constants');

var NDAYS = constants.NDAYS;

function fixName(name) {
  // "<last>, <first>" -> "<first> <last>"
  var lastFirst = name.split(', ');
  return lastFirst[1] + ' ' + lastFirst[0];
}

// Reads just the field page, no scores (e.g. http://www.pgatour.com/tournaments/us-open/field.html)
//
// This is needed because pga tour site doesn't update the scores page until practically day of.
var PgaTourFieldReader = {

  run: function (pgatourFieldUrl) {
    console.log('PgaTourFieldReader - updating field from: ' + pgatourFieldUrl);
    return new Promise(function (fulfill, reject) {
      jsdom.env(
        pgatourFieldUrl,
        ['http://code.jquery.com/jquery.js'],
        function (errors, window) {
          if (errors) {
            reject(new Error(JSON.stringify(errors)));
            return;
          }

          var $ = window.$;
          var golfers = [];

          $('.field-table-content > div > p').each(function () {
            var $p = $(this);

            golfers.push({
              golfer: fixName($p.text().trim()),
              scores: _.times(NDAYS, 0),
              thru: 0,
              today: 0,
              day: 0
            });
          });

          fulfill({
            golfers: golfers
          });
        }
      );
    });
  }

};

module.exports = PgaTourFieldReader;
