import './initTestConfig';

import constants from '../common/constants';
import reader from '../scores_sync/pgaTourLbDataReader';
import * as fs from 'fs';
import * as should from 'should';

const {MISSED_CUT} = constants;

function readPreStartJson() {
  return fs.readFileSync('test/files/pgatour_lbdata.pre_start.json');
}

function readMidRoundJson() {
  return fs.readFileSync('test/files/pgatour_lbdata.midround.json');
}

function readMidRoundJson2() {
  return fs.readFileSync('test/files/pgatour_lbdata.midround2.json');
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

    it('parses pre-tourney golfer', async () => {
      const result = await reader.run(readPreStartJson());
      const g = result.golfers.find(g => g.golfer === 'Francesco Molinari');
      g.should.eql({
        golfer: 'Francesco Molinari',
        scores: [0, 0, 0, 0],
        day: 1,
        thru: null,
      });
    });

    it('parses post-tourney json', async () => {
      const result = await reader.run(readPostStartJson());
      result.par.should.equal(72);
    });

    it('parses finished golfer', async () => {
      const result = await reader.run(readPostStartJson());
      const g = result.golfers.find(g => g.golfer === 'Francesco Molinari');
      g.should.eql({
        golfer: 'Francesco Molinari',
        scores: [-3, -2, 1, -8],
        day: 4,
        thru: 18,
      });
    });

    it('parses mid-round golfer', async () => {
      const result = await reader.run(readMidRoundJson());
      const g = result.golfers.find(g => g.golfer === 'Michael Thompson');
      g.should.eql({
        golfer: 'Michael Thompson',
        scores: [-2, 0, 0, 0],
        day: 1,
        thru: 6,
      });
    });

    it('parses mid-round golfer2', async () => {
      const result = await reader.run(readMidRoundJson2());
      const g = result.golfers.find(g => g.golfer === 'Michael Thompson');
      g.should.eql({
        golfer: 'Michael Thompson',
        scores: [-3, 0, 0, 0],
        day: 2,
        thru: 1,
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