var _ = require('lodash');
var Promise = require('promise');
var request = require('request');
var cheerio = require('cheerio');

var JQUERY_URL = 'file://' + __dirname + '/../assets/jquery.js'

var PgaTourFieldReader = {

  parseHtml: function (html) {
    var $ = cheerio.load(html);
    var golfers = [];

    $('.field-table-content p').each(function () {
      console.log('hihi.4');
      var $div = $(this);
      var playerName = $div.text();
      console.log('hihi.5');
      var lastFirst = playerName.split(', ');
      console.log('hihi.6');
      golfers.push({
        golfer: lastFirst[1] + ' ' + lastFirst[0],
        scores: [0, 0, 0, 0],
        thru: 0,
        today: 0
      });
    });

    return golfers;
  },

  run: function (pgatourFieldUrl) {
    return new Promise(function (fulfill, reject) {
      request({ url: pgatourFieldUrl }, function (error, response, body) {
        console.log('hihi.0');
        if (error) {
          console.log('hihi.1');
          console.log(error);
          reject(error);
          return;
        }

        fulfill(parseHtml(body));
      });
    });
  }

};

module.exports = PgaTourFieldReader;
