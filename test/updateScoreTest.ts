import './initTestConfig';

import * as _ from 'lodash';
import * as updater from '../scores_sync/updateScore';
import constants from '../common/constants';
import {mongoose} from '../server/mongooseUtil';
import {
  Reader,
  ReaderResult,
  UpdateGolfer,
} from '../scores_sync/Types';
import {
  Golfer,
  GolferScore,
  ScoreOverride,
} from '../server/ServerTypes';

const {ObjectId} = mongoose.Types;
const {MISSED_CUT} = constants;

const tid = new ObjectId(1000);

describe('updateScore', function () {

  describe('validate', function () {

    it('catches invalid par data', function () {
      updater.validate({ par: 68 } as ReaderResult).should.not.be.ok();
    });

    it('catches bad golfer names', function () {
      updater.validate({
        par: 70,
        golfers: [{golfer: '-'}]
      } as ReaderResult).should.not.be.ok();
    });

    it('catches non-numeric golfer score', function () {
      updater.validate({
        par: 70,
        golfers: [{ golfer: 'Jack Bauer', scores: [1, 'a', 2, 3] }]
      } as ReaderResult).should.not.be.ok();
    });

    it('catches NaN golfer scores', function () {
      updater.validate({
        par: 70,
        golfers: [{ golfer: 'Jack Bauer', scores: [1, NaN, 2, 3] }]
      } as ReaderResult).should.not.be.ok();
    });

    it('allows "MC" as a golfer score', function () {
      updater.validate({
        par: 70,
        golfers: [{
          golfer: 'Jack Bauer',
          scores: [1, -1, MISSED_CUT, MISSED_CUT],
          day: 4
        }]
      } as ReaderResult).should.be.ok();
    });

    it('catches bad day values', function () {
      updater.validate({
        par: 70,
        golfers: [{ golfer: 'Jack Bauer', scores: [1, -1, 0, 0], day: 5 }]
      } as ReaderResult).should.not.be.ok();
      updater.validate({
        par: 70,
        golfers: [{ golfer: 'Jack Bauer', scores: [1, -1, 0, 0], day: -1 }]
      } as ReaderResult).should.not.be.ok();
    });

  });

  describe('mergeOverrides', function () {

    it('merges override scores', function () {
      const gid1 = new ObjectId(1);
      const gid2 = new ObjectId(2);
      const gid3 = new ObjectId(3);
      const merged = _.keyBy(updater.mergeOverrides(
        [
          { tourneyId: tid, golfer: gid1.toString(), day: 4, scores: [-1, -20, -30, 0], thru: 1 },
          { tourneyId: tid, golfer: gid2.toString(), day: 4, scores: [-1, 2, -2, 0], thru: 1 },
          { tourneyId: tid, golfer: gid3.toString(), day: 3, scores: [-1, -30, MISSED_CUT, MISSED_CUT], thru: 1 }
        ] as GolferScore[],
        [
          { tourneyId: tid, _id: 'should be removed', golfer: gid1, day: null, scores: [-1, MISSED_CUT, MISSED_CUT, MISSED_CUT] },
          { tourneyId: tid, golfer: gid3, day: 4, scores: [-1, MISSED_CUT, MISSED_CUT, MISSED_CUT] }
        ] as ScoreOverride[]
      ), 'golfer');

      merged[gid1.toString()].should.eql({
        tourneyId: tid,
        golfer: gid1.toString(),
        day: 4,
        scores: [-1, MISSED_CUT, MISSED_CUT, MISSED_CUT],
        thru: 1
      });
      merged[gid2.toString()].should.eql({
        tourneyId: tid,
        golfer: gid2.toString(),
        day: 4,
        scores: [-1, 2, -2, 0],
        thru: 1
      });
      merged[gid3.toString()].should.eql({
        tourneyId: tid,
        golfer: gid3.toString(),
        day: 4,
        scores: [-1, MISSED_CUT, MISSED_CUT, MISSED_CUT],
        thru: 1
      });
    });

  });

});
