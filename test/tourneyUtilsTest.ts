import './initTestConfig';

import * as tourneyUtils from '../server/tourneyUtils';
import {
  User,
} from '../server/ServerTypes';

describe('tourneyUtils', function () {

  describe('snakeDraftOrder', function () {

    it('behaves in a snake-like fashion', function () {
      tourneyUtils.snakeDraftOrder([{ _id: 'User1' }, { _id: 'User2'}] as User[])
        .should.eql([
          { pickNumber: 0, user: 'User1' },
          { pickNumber: 1, user: 'User2' },

          { pickNumber: 2, user: 'User2' },
          { pickNumber: 3, user: 'User1' },

          { pickNumber: 4, user: 'User1' },
          { pickNumber: 5, user: 'User2' },

          { pickNumber: 6, user: 'User2' },
          { pickNumber: 7, user: 'User1' }
        ]);
      });

  });

});
