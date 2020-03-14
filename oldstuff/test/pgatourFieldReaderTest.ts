import './initTestConfig';

import reader from '../scores_sync/pgatourFieldReader';
import { UpdateGolfer, TourneyConfigSpec } from '../scores_sync/Types';

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

describe('PgaTourFieldReader', () => {
  describe('parseJson', () => {

    it('parses field', async () => {
      const json = require('./files/pgatour_field');
      const baseGolfer = {
        scores: [0, 0, 0, 0],
        thru: 0,
        day: 0
      };

      const result = await reader.run(config, json);
      result.should.eql({
        par: config.par,
        golfers: [
          { golfer: 'Gary Woodland', ...baseGolfer },
          { golfer: 'Tiger Woods', ...baseGolfer },
          { golfer: 'Ian Woosnam', ...baseGolfer },
          { golfer: 'Ted Potter, Jr.', ...baseGolfer }
        ] as UpdateGolfer[]});
    });

  });
});
