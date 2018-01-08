const initTestConfig = require('./initTestConfig');
require('../common/utils');

const _ = require('lodash');
const access = require('../server/access');
const Promise = require('promise');
const tourneyUtils = require('../server/tourneyUtils');
const mongoose = require('mongoose');
const should = require('should');

const ObjectId = mongoose.Types.ObjectId;

function ensureEmptyDraft() {
  return access.getDraft().then(function (draft) {
    draft.picks.should.be.empty();
  });
}

function expectFailure() {
  'Should not be here. Expected failure, got success.'.should.not.be.ok();
}

function expectSuccess(err) {
  ('Should not be here. Expected success, got error: ' + err.message).should.not.be.ok();
}

function assertPickListResult(playerId, expected, promise) {
  return promise.then(function (result) {
    result.completed.should.be.true();
    result.pickList.should.eql(expected);

    return access.getPickList(playerId);
  })
  .then(function (actualPickList) {
    _.invoke(actualPickList, 'toString').should.eql(expected);
  }, expectSuccess);
}

describe('access', function () {

  before(function () {
    return initTestConfig.initDb();
  });

  describe('getPickList', function () {
    it('returns null for unset pickList', function () {
      return access.getPickList(new ObjectId('5a4d46c9b1a9473036f6a81a').toString())
      .then(function (actualPickList) {
        should(actualPickList).be.a.null();
      }, expectSuccess);
    });
  });

  describe('updatePickList', function () {

    afterEach(function () {
      return access.clearPriorities();
    });

    it('updates pickList for player', function () {
      const playerId = new ObjectId('5a4d46c9b1a9473036f6a81a').toString();
      const expected = [
        new ObjectId('5a4d46c9b1a9473036f6a81b').toString(),
        new ObjectId('5a4d46c9b1a9473036f6a81c').toString(),
        new ObjectId('5a4d46c9b1a9473036f6a81d').toString()
      ];
      return assertPickListResult(
        playerId,
        expected,
        access.updatePickList(playerId, expected)
      );
    });

  });

  describe('updatePickListFromNames', function () {
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

    it('updates pickList for player by name', function () {
      const playerId = new ObjectId('5a4d46c9b1a9473036f6a81a').toString();
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
      return assertPickListResult(
        playerId,
        expected,
        access.updatePickListFromNames(playerId, names)
      );
    });

    it('provides suggestions when mismatches found', function () {
      const playerId = new ObjectId('5a4d46c9b1a9473036f6a81a').toString();
      const names = [
        'Tiger Woods',
        'Bobby Jones',
        'Gary Player',
        'JaCk niCklauss' // extra "s" on the end
      ];
      return access.updatePickListFromNames(playerId, names)
      .then(function (result) {
        result.completed.should.be.false();
        result.suggestions.should.containDeepOrdered([
          { source: 'JaCk niCklauss', results: [
            { target: 'Jack Nicklaus' },
            { target: 'Gary Player' },
            { target: 'Bobby Jones' },
            { target: 'Tiger Woods' }
          ]}
        ]);

        return access.getPickList(playerId);
      })
      .then(function (actualPickList) {
        should(actualPickList).be.a.null();
      }, expectSuccess);
    });

  });

  describe('makePickListPick', function () {
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
          }),

        access.replaceWgrs([
          { name: 'Golfer2', wgr: 1 },
          { name: 'Golfer1', wgr: 2 }
        ])
      ]);
    });

    afterEach(function () {
      return Promise.all([
        access.clearPlayers(),
        access.clearPickOrder(),
        access.clearDraftPicks(),
        access.clearGolfers(),
        access.clearTourney(),
        access.clearPriorities(),
        access.clearWgrs()
      ]);
    });

    it('uses wgr when pickList not available', function () {
      const newPick = {
        player: players['Player1']._id,
        golfer: golfers['Golfer2']._id,
        pickNumber: 0
      };
      return access.makePickListPick(players['Player1']._id.toString(), 0)
        .then(access.getDraft)
        .then(function (draft) {
          draft.picks.should.containDeepOrdered([newPick]);
        }, expectSuccess);
    });

    it('uses pickList list to pick next golfer', function () {
      const newPick = {
        player: players['Player1']._id,
        golfer: golfers['Golfer1']._id,
        pickNumber: 0
      };
      return access.updatePickList(players['Player1']._id.toString(), [
          golfers['Golfer1']._id.toString(),
          golfers['Golfer2']._id.toString()
        ])
        .then(function () {
          return access.makePickListPick(players['Player1']._id.toString(), 0);
        })
        .then(access.getDraft)
        .then(function (draft) {
          draft.picks.should.containDeepOrdered([newPick]);
        }, expectSuccess);
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
        draft.picks.should.containDeepOrdered([newPick]);
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
