const initTestConfig = require('./initTestConfig');
require('../common/utils');

const _ = require('lodash');
const access = require('../server/access');
const Promise = require('promise');
const tourneyUtils = require('../server/tourneyUtils');
const mongoose = require('mongoose');

const ObjectId = mongoose.Types.ObjectId;

function ensureEmptyDraft() {
  return access.getDraft().then(function (draft) {
    draft.picks.should.be.empty;
  });
}

function expectFailure() {
  'expected failure, got success'.should.be.not.ok;
}

function expectSuccess(err) {
  err.message.should.be.not.ok;
}

function assertPriorityResult(playerId, expected, promise) {
  return promise.then(function (result) {
    result.completed.should.be.true;
    result.priority.should.eql(expected);

    return access.getPriority(playerId);
  })
  .then(function (actualPriority) {
    _.invoke(actualPriority, 'toString').should.eql(expected);
  });
}

describe('access', function () {

  before(function () {
    return initTestConfig.initDb();
  });

  describe('updatePriority', function () {

    afterEach(function () {
      return access.clearPriorities();
    });

    it('updates priority for player', function () {
      const playerId = 'player1';
      const expected = [
        new ObjectId('5a4d46c9b1a9473036f6a81b').toString(),
        new ObjectId('5a4d46c9b1a9473036f6a81c').toString(),
        new ObjectId('5a4d46c9b1a9473036f6a81d').toString()
      ];
      return assertPriorityResult(
        playerId,
        expected,
        access.updatePriority(playerId, expected)
      );
    });

  });

  describe('updatePriorityFromNames', function () {
    let golfers = null;

    beforeEach(function () {
      return access.ensureGolfers([
        { name: 'Tiger Woods' },
        { name: 'Bobby Jones' },
        { name: 'Gary Player' },
        { name: 'Jack Nicklaus' }
      ])
      .then(access.getGolfers)
      .then(_.partialRight(_.indexBy, 'name'))
      .then(function (_golfers) {
        golfers = _golfers;
      });
    });

    afterEach(function () {
      return Promise.all([
        access.clearPriorities(),
        access.clearGolfers()
      ]);
    });

    it('updates priority for player by name', function () {
      const playerId = 'player1';
      const names = [
        'Bobby Jones',
        'gary player',
        'tIgEr WoOdS',
        'Jack Nicklaus'
      ];
      const expected = [
        golfers['Bobby Jones']._id.toString(),
        golfers['Gary Player']._id.toString(),
        golfers['Tiger Woods']._id.toString(),
        golfers['Jack Nicklaus']._id.toString(),
      ];
      return assertPriorityResult(
        playerId,
        expected,
        access.updatePriorityFromNames(playerId, names)
      );
    });

    it('provides suggestions when mismatches found', function () {
      const playerId = 'player1';
      const names = [
        'Tiger Woods',
        'Bobby Jones',
        'Gary Player',
        'JaCk niCklauss' // extra "s" on the end
      ];
      return access.updatePriorityFromNames(playerId, names)
      .then(function (result) {
        result.completed.should.be.false;
        result.suggestions.should.eql([
          { source: 'JaCk niCklauss', results: [
            { target: 'Jack Nicklaus', "dist": 1, "coeff": 0.9285714285714286 },
            { target: 'Gary Player', "dist": 10, "coeff": 0.2857142857142857 },
            { target: 'Bobby Jones', "dist": 13, "coeff": 0.07142857142857142 },
            { target: 'Tiger Woods', "dist": 13, "coeff": 0.07142857142857142 }
          ]}
        ]);

        return access.getPriority(playerId);
      })
      .then(function (actualPriority) {
        // No priority should exist, so just returns a sorted list of golfers
        const expected = _.chain(golfers)
          .sortBy('name')
          .pluck('_id')
          .invoke('toString')
          .value();
        _.invoke(actualPriority, 'toString').should.eql(expected);
      });
    });

  });

  describe('makePick', function () {
    let players = null;
    let golfers = null;

    beforeEach(function () {
      return Promise.all([
        access.ensurePlayers([{ name: 'Player1' }, { name: 'Player2' }])
        .then(access.getPlayers)
        .then(_.partialRight(_.indexBy, 'name'))
        .then(function (_players) {
          players = _players;
          const pickOrder = tourneyUtils.snakeDraftOrder([
            players['Player1'],
            players['Player2']
          ]);
          access.setPickOrder(pickOrder);
        }),

        access.ensureGolfers([{ name: 'Golfer1' }, { name: 'Golfer2' }])
        .then(access.getGolfers)
        .then(_.partialRight(_.indexBy, 'name'))
        .then(function (_golfers) {
          golfers = _golfers;
        })
      ]);
    });

    afterEach(function () {
      return Promise.all([
        access.clearPlayers(),
        access.clearPickOrder(),
        access.clearDraftPicks(),
        access.clearGolfers(),
        access.clearTourney()
      ]);
    });

    it('prevents players from picking out of order', function () {
      return access.makePick({
        player: players['Player2']._id,
        golfer: golfers['Golfer2']._id,
        pickNumber: 0
      })
      .then(expectFailure, function (err) {
        err.message.should.equal('invalid pick: player picked out of order');
        return ensureEmptyDraft();
      });
    });

    it('prevents pick number from being out of sync', function () {
      return access.makePick({
        player: players['Player1']._id,
        golfer: golfers['Golfer1']._id,
        pickNumber: 1
      })
      .then(expectFailure, function (err) {
        err.message.should.equal('invalid pick: pick order out of sync');
        return ensureEmptyDraft();
      });
    });

    it('requires actual golfers', function () {
      return access.makePick({
        player: players['Player1']._id,
        golfer: players['Player2']._id,
        pickNumber: 0
      }).then(expectFailure, function (err) {
        err.message.should.equal('invalid pick: invalid golfer');
        return ensureEmptyDraft();
      });
    });

    it('registers valid pick', function () {
      const newPick = {
        player: players['Player1']._id,
        golfer: golfers['Golfer1']._id,
        pickNumber: 0
      };
      return access.makePick(newPick)
      .then(access.getDraft)
      .then(function (draft) {
        draft.picks.should.containDeep([newPick]);
      }, expectSuccess);
    });

    it('does not allow golfers to be picked twice', function () {
      const newPicks = [
        {
          player: players['Player1']._id,
          golfer: golfers['Golfer1']._id,
          pickNumber: 0
        },
        {
          player: players['Player2']._id,
          golfer: golfers['Golfer1']._id,
          pickNumber: 1
        }
      ];
      return access.makePick(newPicks[0])
      .then(_.partial(access.makePick, newPicks[1]))
      .then(expectFailure, function (err) {
        err.message.should.equal('invalid pick: golfer already drafted');
        return access.getDraft().then(function (draft) {
          _.pick(draft.picks[0], ['player', 'golfer', 'pickNumber'])
            .should.eql(newPicks[0]);
        });
      });
    });

  });

});
