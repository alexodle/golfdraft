require('./initTestConfig');

var _ = require('lodash');
var reader = require('../scores_sync/pgatourFieldReader');
var should = require('should');
var fs = require('fs');

describe('PgaTourFieldReader', function () {
  describe('parseHtml', function () {

    it('parses field', function () {
      var html = fs.readFileSync(__dirname + '/files/pgatour_field.html', 'utf8');
      var baseGolfer = {
        scores: [0, 0, 0, 0],
        thru: 0,
        day: 0
      };

      reader.parseHtml(html).should.eql([
        _.extend({ golfer: 'Byeong-Hun An' }, baseGolfer),
        _.extend({ golfer: 'Kiradech Aphibarnrat' }, baseGolfer),
        _.extend({ golfer: 'Derek Bard' }, baseGolfer)
      ]);
    });

  });

});
