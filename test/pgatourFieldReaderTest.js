require('./initTestConfig');

const _ = require('lodash');
const reader = require('../scores_sync/pgatourFieldReader');
const should = require('should');
const fs = require('fs');

describe('PgaTourFieldReader', function () {
  describe('parseJson', function () {

    it('parses field', function () {
      const json = fs.readFileSync(__dirname + '/files/pgatour_field.json', 'utf8');
      const baseGolfer = {
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
