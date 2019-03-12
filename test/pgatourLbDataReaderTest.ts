import './initTestConfig';

import constants from '../common/constants';
import reader from '../scores_sync/pgaTourLbDataReader';
import * as fs from 'fs';
import * as should from 'should';

const {MISSED_CUT} = constants;

function readPreStartJson() {
  return fs.readFileSync('test/files/pgatour_lbdata.pre_start.json');
}

function readPostStartJson() {
  return fs.readFileSync('test/files/pgatour_lbdata.finished.json');
}

describe('PgaTourLbReader', () => {
  describe('parseGolfer', () => {

    it('parses pre-tourney json', async () => {
      const result = await reader.run(readPreStartJson());
      result.par.should.equal(71);
    });

    it('parses post-tourney json', async () => {
      const result = await reader.run(readPostStartJson());
      result.par.should.equal(72);
    });

    it('parses golfer', async () => {
      const result = await reader.run(readPostStartJson());
      const g = result.golfers.find(g => g.golfer === 'Francesco Molinari');
      g.should.eql({
        golfer: 'Francesco Molinari',
        scores: [-3, -2, 1, -8],
        day: 4,
        thru: 18,
      });
    });

    it('parses mc golfer correctly', async () => {
      const result = await reader.run(readPostStartJson());
      const mcGolfer = result.golfers.find(g => g.golfer === 'Charley Hoffman');
      mcGolfer.scores.should.eql([3, -1, MISSED_CUT, MISSED_CUT]);
    });

    it('parses wd correctly', async () => {
      const result = await reader.run(readPostStartJson());
      const wdGolfer = result.golfers.find(g => g.golfer === 'Jason DayWhoFinishedHisRound');
      wdGolfer.scores.should.eql([-1, MISSED_CUT, MISSED_CUT, MISSED_CUT]);
    });

    it('parses wd mid-round correctly', async () => {
      const result = await reader.run(readPostStartJson());
      const wdGolfer = result.golfers.find(g => g.golfer === 'Jason Day');
      wdGolfer.scores.should.eql([MISSED_CUT, MISSED_CUT, MISSED_CUT, MISSED_CUT]);
    });

  });
});