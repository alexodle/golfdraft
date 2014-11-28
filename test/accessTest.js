var initTestConfig = require('./initTestConfig');
require('../common/utils');

var _ = require('lodash');
var Promise = require('promise');
var access = require('../server/access');
var tourneyUtils = require('../server/tourneyUtils');

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

describe('access', function () {

  before(function () {
    return initTestConfig.initDb();
  });

  describe('makePick', function () {
    var players = null;
    var golfers = null;

    beforeEach(function () {
      return Promise.all([
        access.ensurePlayers([{ name: 'Player1' }, { name: 'Player2' }])
        .then(access.getPlayers)
        .then(_.partialRight(_.indexBy, 'name'))
        .then(function (_players) {
          players = _players;
          var pickOrder = tourneyUtils.snakeDraftOrder([
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
      var newPick = {
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
      var newPicks = [
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
          draft.picks.should.containDeep([newPicks[0]]);
        });
      });
    });

  });

});
