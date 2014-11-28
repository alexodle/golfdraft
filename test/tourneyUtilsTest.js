require('./initTestConfig');

var tourneyUtils = require('../server/tourneyUtils');

describe('tourneyUtils', function () {

  describe('snakeDraftOrder', function () {

    it('behaves in a snake-like fashion', function () {
      tourneyUtils.snakeDraftOrder([{ _id: 'Player1' }, { _id: 'Player2'}])
      .should.eql([
        { pickNumber: 0, player: 'Player1' },
        { pickNumber: 1, player: 'Player2' },

        { pickNumber: 2, player: 'Player2' },
        { pickNumber: 3, player: 'Player1' },

        { pickNumber: 4, player: 'Player1' },
        { pickNumber: 5, player: 'Player2' },

        { pickNumber: 6, player: 'Player2' },
        { pickNumber: 7, player: 'Player1' }
      ])
    });

  });

});
