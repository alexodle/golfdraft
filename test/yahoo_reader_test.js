var reader = require('../server/yahoo_reader.js');
var should = require('should');

describe('yahoo_reader', function () {
  describe('parseScores', function () {

    it('parses scores to ints', function () {
      reader.parseScores({
        player: "Ricky Barnes",
        scores: ["1", "-1", "0", "3"],
        thru: "F"
      }).should.eql({
        player: "Ricky Barnes",
        scores: [1, -1, 0, 3],
        thru: "F",
        day: 4
      });
    });

    it('parses "-" as not started', function () {
      reader.parseScores({
        player: "Ricky Barnes",
        scores: ["1", "2", "-", "-"],
        thru: "F"
      }).should.eql({
        player: "Ricky Barnes",
        scores: [1, 2, 0, 0],
        thru: "F",
        day: 2
      });
    });

    it('respects thru !== "F"', function () {
      reader.parseScores({
        player: "Ricky Barnes",
        scores: ["1", "2", "-", "-"],
        thru: "4"
      }).should.eql({
        player: "Ricky Barnes",
        scores: [1, 2, 0, 0],
        thru: "4",
        day: 1
      });
    });

    it('treats date strings as not started', function () {
      reader.parseScores({
        player: "Ricky Barnes",
        scores: ["1:50 pm", "-", "-", "-"],
        thru: "F"
      }).should.eql({
        player: "Ricky Barnes",
        scores: [0, 0, 0, 0],
        thru: "F",
        day: 0
      });
    });

    it('marks as "MC" if "MC" or "WD" exists in scores', function () {
      reader.parseScores({
        player: "Ricky Barnes",
        scores: ["1", "2", "MC", "WD"],
        thru: "-"
      }).should.eql({
        player: "Ricky Barnes",
        scores: [1, 2, "MC", "MC"],
        thru: "-",
        day: 4
      });
    });

  });

  describe('relativeToPar', function () {

    it('updates raw scores relative to par', function () {
      reader.relativeToPar({
        player: "Ricky Barnes",
        scores: [72, 76, 72, 69],
        day: 4,
        thru: "F"
      }, { par: 70 }).should.eql({
        player: "Ricky Barnes",
        scores: [2, 6, 2, -1],
        day: 4,
        thru: "F"
      });
    });

    it('only processes scores for n days', function () {
      reader.relativeToPar({
        player: "Ricky Barnes",
        scores: [72, 0, 0, 0],
        day: 1,
        thru: "F"
      }, { par: 70 }).should.eql({
        player: "Ricky Barnes",
        scores: [2, 0, 0, 0],
        day: 1,
        thru: "F"
      });
    });

    it('fill in partial day score with "p.today"', function () {
      reader.relativeToPar({
        player: "Ricky Barnes",
        scores: [72, 56, 0, 0],
        day: 1,
        thru: "6",
        today: -3
      }, { par: 70 }).should.eql({
        player: "Ricky Barnes",
        scores: [2, -3, 0, 0],
        day: 1,
        thru: "6",
        today: -3
      });
    });

    it('do not fill in score with "p.today" if thru == "-"', function () {
      reader.relativeToPar({
        player: "Ricky Barnes",
        scores: [72, 0, 0, 0],
        day: 1,
        thru: "-",
        today: -3
      }, { par: 70 }).should.eql({
        player: "Ricky Barnes",
        scores: [2, 0, 0, 0],
        day: 1,
        thru: "-",
        today: -3
      });
    });

    it('replace "E" with 0 in p.today', function () {
      reader.relativeToPar({
        player: "Ricky Barnes",
        scores: [72, 56, 0, 0],
        day: 1,
        thru: "6",
        today: "E"
      }, { par: 70 }).should.eql({
        player: "Ricky Barnes",
        scores: [2, 0, 0, 0],
        day: 1,
        thru: "6",
        today: 0
      });
    });

    it('ignore missed cut days', function () {
      reader.relativeToPar({
        player: "Ricky Barnes",
        scores: [72, 73, "MC", "MC"],
        day: 4,
        thru: "-"
      }, { par: 70 }).should.eql({
        player: "Ricky Barnes",
        scores: [2, 3, "MC", "MC"],
        day: 4,
        thru: "-"
      });
    });

  });

  describe('adjustMissedCutScores', function () {

    it('missed cut becomes worst score', function () {
      reader.adjustMissedCutScores([
        {
          player: "Ricky Barnes",
          scores: [3, 2, "MC", "MC"]
        },
        {
          player: "Tiger Woods",
          scores: [-1, 3, 4, 5]
        },
        {
          player: "Jim Furyk",
          scores: [2, "MC", "MC", "MC"]
        },
        {
          player: "Tom Watson",
          scores: [-1, 1, 3, 6]
        }
      ]).should.eql([
        {
          player: "Ricky Barnes",
          scores: [3, 2, 4, 6]
        },
        {
          player: "Tiger Woods",
          scores: [-1, 3, 4, 5]
        },
        {
          player: "Jim Furyk",
          scores: [2, 3, 4, 6]
        },
        {
          player: "Tom Watson",
          scores: [-1, 1, 3, 6]
        }
      ]);
    });

  });
});
