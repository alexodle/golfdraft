var _ = require('lodash');
var Promise = require('promise');
var request = require('request');

var JQUERY_URL = 'file://' + __dirname + '/../assets/jquery.js';

function parseJson(json) {
  var golfers = _.map(JSON.parse(json).Tournament.Players, function (p) {
    var lastFirst = p.PlayerName.split(', ');
    return {
      golfer: lastFirst[1] + ' ' + lastFirst[0],
      scores: [0, 0, 0, 0],
      thru: 0,
      day: 0
    };
  });
  return golfers;
}

var PgaTourFieldReader = {

  // expose for testing
  parseJson: parseJson,

  run: function (pgatourFieldUrl) {
    return new Promise(function (fulfill, reject) {
      request({ url: pgatourFieldUrl }, function (error, response, body) {
        if (error) {
          console.log(error);
          reject(error);
          return;
        }

        var golfers = parseJson(body);
        fulfill({
          par: 72, // hack for now
          golfers: golfers
        });
      });
    });
  }

};

module.exports = PgaTourFieldReader;
