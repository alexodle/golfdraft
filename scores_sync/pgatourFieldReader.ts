import * as _ from 'lodash';
import * as request from 'request';

const JQUERY_URL = 'file://' + __dirname + '/../assets/jquery.js';

function parseJson(json) {
  const golfers = _.map(JSON.parse(json).Tournament.Users, function (p) {
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

const PgaTourFieldReader = {

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

        const golfers = parseJson(body);
        fulfill({
          par: 72, // hack for now
          golfers: golfers
        });
      });
    });
  }

};

export default PgaTourFieldReader;
