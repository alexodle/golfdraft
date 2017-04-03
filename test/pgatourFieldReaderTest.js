require('./initTestConfig');

var _ = require('lodash');
var reader = require('../scores_sync/pgatourFieldReader');
var should = require('should');
var fs = require('fs');

describe('PgaTourFieldReader', function () {
  describe('parseJson', function () {

    it('parses field', function () {
      var json = fs.readFileSync(__dirname + '/files/pgatour_field.json', 'utf8');
      var baseGolfer = {
        scores: [0, 0, 0, 0],
        thru: 0,
        day: 0
      };

      reader.parseJson(json).should.eql([
        _.extend({ golfer: 'Gary Woodland' }, baseGolfer),
        _.extend({ golfer: 'Tiger Woods' }, baseGolfer),
        _.extend({ golfer: 'Ian Woosnam' }, baseGolfer)
      ]);
    });

  });

});
