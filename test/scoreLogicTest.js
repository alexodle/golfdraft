var _ = require('lodash');
var constants = require('../common/constants');
var ScoreLogic = require('../js/logic/ScoreLogic');

var MISSED_CUT = constants.MISSED_CUT;

describe('ScoreLogic', function () {

  describe('calcPlayerScores', function () {

    it('calculates scores for each day', function () {
      var draftPicks = [
        { pickNumber: 0, player: 'Player1', golfer: 'Golfer1_0' },
        { pickNumber: 1, player: 'Player1', golfer: 'Golfer1_1' },
        { pickNumber: 2, player: 'Player1', golfer: 'Golfer1_2' },
        { pickNumber: 3, player: 'Player1', golfer: 'Golfer1_3' }
      ];
      var scores = {
        Golfer1_0: { golfer: 'Golfer1_0', day: 1, scores: [-1,  0,  0,  0] },
        Golfer1_1: { golfer: 'Golfer1_1', day: 1, scores: [-2,  0,  0,  0] },
        Golfer1_2: { golfer: 'Golfer1_2', day: 1, scores: [0,  -1,  0,  0] },
        Golfer1_3: { golfer: 'Golfer1_3', day: 1, scores: [0,  -3,  0,  0] },
      };
      ScoreLogic.calcPlayerScores(draftPicks, scores).should.eql({
        Player1: {
          player: 'Player1',
          total: -3 + -4,
          scoresByDay: [
            {
              day: 0,
              allScores: [
                scores['Golfer1_1'],
                scores['Golfer1_0'],
                scores['Golfer1_2'],
                scores['Golfer1_3']
              ],
              usedScores: [scores['Golfer1_1'], scores['Golfer1_0']],
              total: -3
            },
            {
              day: 1,
              allScores: [
                scores['Golfer1_3'],
                scores['Golfer1_2'],
                scores['Golfer1_0'],
                scores['Golfer1_1']
              ],
              usedScores: [scores['Golfer1_3'], scores['Golfer1_2']],
              total: -4
            },
            {
              day: 2,
              allScores: _.values(scores),
              usedScores: [scores['Golfer1_0'], scores['Golfer1_1']],
              total: 0
            },
            {
              day: 3,
              allScores: _.values(scores),
              usedScores: [scores['Golfer1_0'], scores['Golfer1_1']],
              total: 0
            }
          ],
          scoresByGolfer: {
            Golfer1_0: _.extend({ total: -1 }, scores['Golfer1_0']),
            Golfer1_1: _.extend({ total: -2 }, scores['Golfer1_1']),
            Golfer1_2: _.extend({ total: -1 }, scores['Golfer1_2']),
            Golfer1_3: _.extend({ total: -3 }, scores['Golfer1_3'])
          }
        }
      });
    });

  });

  describe('fillMissedCutScores', function () {

    it('replaces "MC" scores with the worst score for that day', function () {
      ScoreLogic.fillMissedCutScores([
        { scores: [MISSED_CUT, 1, 0, 0] },
        { scores: [0, MISSED_CUT, 2, 0] },
        { scores: [0, 0, MISSED_CUT, 3] },
        { scores: [4, 0, 0, MISSED_CUT] }
      ])
      .should.eql([
        { scores: [4, 1, 0, 0], missedCuts: [true, false, false, false] },
        { scores: [0, 1, 2, 0], missedCuts: [false, true, false, false] },
        { scores: [0, 0, 2, 3], missedCuts: [false, false, true, false] },
        { scores: [4, 0, 0, 3], missedCuts: [false, false, false, true] },
      ]);
    });

  });

});
