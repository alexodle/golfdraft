var _ = require('lodash');
var Promise = require('promise');
var request = require('request');
var cheerio = require('cheerio');

var JQUERY_URL = 'file://' + __dirname + '/../assets/jquery.js'

function parseHtml(html) {
  var $ = cheerio.load(html);
  var golfers = [];

  $('.field-table-content p').each(function () {
    var $div = $(this);
    var playerName = $div.text();
    var lastFirst = playerName.split(', ');
    golfers.push({
      golfer: lastFirst[1] + ' ' + lastFirst[0],
      scores: [0, 0, 0, 0],
      thru: 0,
      day: 0
    });
  });

  return golfers;
}

var PgaTourFieldReader = {

  // expose for testing
  parseHtml: parseHtml,

  run: function (pgatourFieldUrl) {
    return new Promise(function (fulfill, reject) {
      request({ url: pgatourFieldUrl }, function (error, response, body) {
        if (error) {
          console.log(error);
          reject(error);
          return;
        }

        var golfers = parseHtml(body);
        fulfill({
          par: 72, // hack for now
          golfers: golfers
        });
      });
    });
  }

};

module.exports = PgaTourFieldReader;
