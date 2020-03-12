import './initTestConfig';

import constants from '../common/constants';
import reader, { calcCurrentDay } from '../scores_sync/pgaTourLbDataScraperReader';

const { MISSED_CUT } = constants;

describe('PgaTourScraperReader', function () {
  describe('parse', () => {
    it('parses for missed cut', () => {
      // TODO
    });

    it('parses for WD', () => {
      // TODO
    });

    it('parses for mid-day WD', () => {
      // TODO
    });
  })

  /*
  NF: [,,,] -> 0
  F: [1,,,] -> 0
  NF: [1,,,] -> 1
  F: [1,1,,] -> 1
  NF: [1,1,,] -> 2
  F: [1,1,1,1] -> 3
  ----- NF: [1,1,1,1] -----
  */
  describe('calcCurrentDay', () => {
    it('parses active day 0', () => {
      calcCurrentDay([null, null, null, null], false).should.equal(0)
    })

    it('parses finished day 0', () => {
      calcCurrentDay([0, null, null, null], true).should.equal(0)
    })

    it('parses active day 1', () => {
      calcCurrentDay([0, null, null, null], false).should.equal(1)
    })

    it('parses finished final day', () => {
      calcCurrentDay([0, 0, 0, 0], true).should.equal(3)
    })
  });
});
