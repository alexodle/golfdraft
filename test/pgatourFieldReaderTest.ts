import './initTestConfig';

import * as should from 'should';
import * as fs from 'fs';
import reader from '../scores_sync/pgatourFieldReader';
import {
  UpdateGolfer
} from '../scores_sync/Types';

describe('PgaTourFieldReader', function () {
  describe('parseJson', function () {

    it('parses field', function () {
      const json = require('./files/pgatour_field');
      const baseGolfer = {
        scores: [0, 0, 0, 0],
        thru: 0,
        day: 0
      };

      reader.parseJson(json).should.eql([
        { golfer: 'Gary Woodland', ...baseGolfer },
        { golfer: 'Tiger Woods', ...baseGolfer },
        { golfer: 'Ian Woosnam', ...baseGolfer },
      ] as UpdateGolfer[]);
    });

  });

});
