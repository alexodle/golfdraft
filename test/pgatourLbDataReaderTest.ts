import './initTestConfig';

import constants from '../common/constants';
import reader from '../scores_sync/pgaTourLbDataReader';
import { TourneyConfigSpec } from '../scores_sync/Types';
import * as fs from 'fs';

const {MISSED_CUT} = constants;

const config: TourneyConfigSpec = {
  name: "test tourney",
  startDate: new Date(),
  par: 72,
  scoresSync: {
    syncType: "pgatour_field",
    url: "http://test",
    nameMap: {},
  },
  draftOrder: [],
  wgr: {
    url: "http://testtest",
    nameMap: {},
  },
};

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

    it('parses pre-tourney golfer', async () => {
      const result = await reader.run(config, readPreStartJson());
      const g = result.golfers.find(g => g.golfer === 'Francesco Molinari');
      g.should.eql({
        golfer: 'Francesco Molinari',
        scores: [0, 0, 0, 0],
        day: 1,
        thru: null,
      });
    });

    it('parses post-tourney json', async () => {
      const result = await reader.run(config, readPostStartJson());
      result.par.should.equal(config.par);
    });

    it('parses finished golfer', async () => {
      const result = await reader.run(config, readPostStartJson());
      const g = result.golfers.find(g => g.golfer === 'Francesco Molinari');
      g.should.eql({
        golfer: 'Francesco Molinari',
        scores: [-3, -2, 1, -8],
        day: 4,
        thru: 18,
      });
    });

    it('parses mid-round golfer', async () => {
      const result = await reader.run(config, readMidRoundJson());
      const g = result.golfers.find(g => g.golfer === 'Michael Thompson');
      g.should.eql({
        golfer: 'Michael Thompson',
        scores: [-2, 0, 0, 0],
        day: 1,
        thru: 6,
      });
    });

    it('parses mid-round golfer2', async () => {
      const result = await reader.run(config, readMidRoundJson2());
      const g = result.golfers.find(g => g.golfer === 'Michael Thompson');
      g.should.eql({
        golfer: 'Michael Thompson',
        scores: [-3, 0, 0, 0],
        day: 2,
        thru: 1,
      });
    });

    it('parses mc golfer correctly', async () => {
      const result = await reader.run(config, readPostStartJson());
      const mcGolfer = result.golfers.find(g => g.golfer === 'Charley Hoffman');
      mcGolfer.scores.should.eql([3, -1, MISSED_CUT, MISSED_CUT]);
    });

    it('parses wd correctly', async () => {
      const result = await reader.run(config, readPostStartJson());
      const wdGolfer = result.golfers.find(g => g.golfer === 'Jason DayWhoFinishedHisRound');
      wdGolfer.scores.should.eql([-1, MISSED_CUT, MISSED_CUT, MISSED_CUT]);
    });

    it('parses wd mid-round correctly', async () => {
      const result = await reader.run(config, readPostStartJson());
      const wdGolfer = result.golfers.find(g => g.golfer === 'Jason Day');
      wdGolfer.scores.should.eql([MISSED_CUT, MISSED_CUT, MISSED_CUT, MISSED_CUT]);
    });

  });
});