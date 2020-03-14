import * as should from 'should';
import * as tourneyUtils from '../server/tourneyUtils';
import * as models from '../server/models';
import {Access, getActiveTourneyAccess, getUsers, ensureUsers} from '../server/access';
import {initTestDb} from './initTestConfig';
import {mongoose} from '../server/mongooseUtil';
import {Golfer, DraftPick, User} from '../server/ServerTypes';
import {keyBy, pick} from 'lodash';

const {ObjectId} = mongoose.Types;

function clear() {
  return Promise.all([
    models.Golfer.remove({}).exec(),
    models.DraftPick.remove({}).exec(),
    models.DraftPickList.remove({}).exec(),
    models.DraftPickOrder.remove({}).exec(),
    models.User.remove({}).exec(),
    models.WGR.remove({}).exec(),
  ]);
}

async function assertPickListResult(userId, expected, promise) {
  const access = await getActiveTourneyAccess();
  
  const result = await promise;
  result.completed.should.be.true();
  Array.from(result.pickList).should.eql(expected);

  const actualPickList = await access.getPickList(userId);
  Array.from(actualPickList.map(pl => pl.toString())).should.eql(expected);
}

describe('access', () => {

  before(initTestDb);
  afterEach(clear);

  describe('getPickList', () => {
    it('returns null for unset pickList', async () => {
      const access = await getActiveTourneyAccess();
      const actualPickList = await access.getPickList(new ObjectId('5a4d46c9b1a9473036f6a81a').toString());
      should(actualPickList).be.a.null();
    });
  });

  describe('updatePickList', async () => {

    before(initTestDb);
    afterEach(clear);

    it('updates pickList for user', async () => {
      const access = await getActiveTourneyAccess();
      const userId = new ObjectId('5a4d46c9b1a9473036f6a81a').toString();
      const expected = [
        new ObjectId('5a4d46c9b1a9473036f6a81b').toString(),
        new ObjectId('5a4d46c9b1a9473036f6a81c').toString(),
        new ObjectId('5a4d46c9b1a9473036f6a81d').toString()
      ];
      return assertPickListResult(
        userId,
        expected,
        access.updatePickList(userId, expected)
      );
    });

  });

  describe('updatePickListFromNames', () => {
    let golfers = null;

    beforeEach(async () => {
      await initTestDb();

      const access = await getActiveTourneyAccess();
      await access.ensureGolfers([
        { name: 'Tiger Woods' },
        { name: 'Bobby Jones' },
        { name: 'Gary User' },
        { name: 'Jack Nicklaus' }
      ] as Golfer[]);

      const _golfers = await access.getGolfers();
      golfers = keyBy(_golfers, g => g.name);
    });

    afterEach(clear);

    it('updates pickList for user by name', async () => {
      const access = await getActiveTourneyAccess();
      const userId = new ObjectId('5a4d46c9b1a9473036f6a81a').toString();
      const names = [
        'Bobby Jones',
        'gary user',
        'tIgEr WoOdS',
        'Jack Nicklaus'
      ];
      const expected = [
        golfers['Bobby Jones']._id.toString(),
        golfers['Gary User']._id.toString(),
        golfers['Tiger Woods']._id.toString(),
        golfers['Jack Nicklaus']._id.toString(),
      ];
      return assertPickListResult(
        userId,
        expected,
        await access.updatePickListFromNames(userId, names)
      );
    });

    it('provides suggestions when mismatches found', async () => {
      const access = await getActiveTourneyAccess();
      const userId = new ObjectId('5a4d46c9b1a9473036f6a81a').toString();
      const names = [
        'Tiger Woods',
        'Bobby Jones',
        'Gary User',
        'JaCk niCklauss' // extra "s" on the end
      ];
      
      const result = await access.updatePickListFromNames(userId, names);
      result.completed.should.be.false();
      /*
          type: 'SUGGESTION',
          source: levResult.source,
          suggestion: bestResult.target,
          allResults,
          isGoodSuggestion*/
      result.suggestions.should.containDeepOrdered([
        { type: 'SUGGESTION', source: 'JaCk niCklauss', suggestion: 'Jack Nicklaus', isGoodSuggestion: true }
      ]);

      const actualPickList = await access.getPickList(userId);
      should(actualPickList).be.a.null();
    });

  });

  describe('makePickListPick', () => {
    let users = null;
    let golfers = null;

    async function fillUsers(access: Access) {
      await ensureUsers([
        { name: 'User1', username: 'user1', password: 'pwd' },
        { name: 'User2', username: 'user2', password: 'pwd' }] as User[]
      );
      const _users = await getUsers();
      users = keyBy(_users, g => g.name);
      
      const pickOrder = tourneyUtils.snakeDraftOrder([
        users['User1'],
        users['User2'],
      ]);
      await access.setPickOrder(pickOrder);
    }

    async function fillGolfers(access: Access) {
      await access.ensureGolfers([{ name: 'Golfer1' }, { name: 'Golfer2' }] as Golfer[]);
      const _golfers = await access.getGolfers();
      golfers = keyBy(_golfers, g => g.name);

      await access.replaceWgrs([
        { name: 'Golfer2', wgr: 1 },
        { name: 'Golfer1', wgr: 2 }
      ]);
    }

    beforeEach(async () => {
      await initTestDb();

      const access = await getActiveTourneyAccess();
      await Promise.all([fillUsers(access), fillGolfers(access)]);
    });

    afterEach(clear);

    it('uses wgr when pickList not available', async () => {
      const access = await getActiveTourneyAccess();

      const newPick = {
        user: users['User1']._id,
        golfer: golfers['Golfer1']._id,
        pickNumber: 0
      };
      await access.makePickListPick(users['User1']._id.toString(), 0);
      const draft = await access.getDraft();
      draft.picks.should.containDeepOrdered([newPick]);
    });

    it('uses pickList list to pick next golfer', async () => {
      const access = await getActiveTourneyAccess();

      const newPick = {
        user: users['User1']._id,
        golfer: golfers['Golfer1']._id,
        pickNumber: 0
      };
      await access.updatePickList(users['User1']._id.toString(), [
        golfers['Golfer1']._id.toString(),
        golfers['Golfer2']._id.toString()
      ]);
      await access.makePickListPick(users['User1']._id.toString(), 0);
      const draft = await access.getDraft();
      draft.picks.should.containDeepOrdered([newPick]);
    });

  });

  describe('makePick', () => {
    let users = null;
    let golfers = null;

    async function fillUsers(access: Access) {
      await ensureUsers([
        { name: 'User1', username: 'user1', password: 'pwd' },
        { name: 'User2', username: 'user2', password: 'pwd' }] as User[]
      );
      const _users = await getUsers();
      users = keyBy(_users, g => g.name);
      
      const pickOrder = tourneyUtils.snakeDraftOrder([
        users['User1'],
        users['User2'],
      ]);
      await access.setPickOrder(pickOrder);
    }

    async function fillGolfers(access: Access) {
      await access.ensureGolfers([{ name: 'Golfer1' }, { name: 'Golfer2' }] as Golfer[]);
      const _golfers = await access.getGolfers();
      golfers = keyBy(_golfers, g => g.name);
    }

    beforeEach(async () => {
      await initTestDb();

      const access = await getActiveTourneyAccess();
      await Promise.all([fillUsers(access), fillGolfers(access)]);
    });

    afterEach(clear);

    it('prevents users from picking out of order', async () => {
      const access = await getActiveTourneyAccess();
      try {
        await access.makePick({
          user: users['User2']._id,
          golfer: golfers['Golfer2']._id,
          pickNumber: 0
        } as DraftPick);
        'Expected draft pick to fail.'.should.not.be.ok();
      } catch (err) {
        err.message.should.startWith('invalid pick: user picked out of order');
      }
    });

    it('prevents pick number from being out of sync', async () => {
      const access = await getActiveTourneyAccess();
      try {
        await access.makePick({
          user: users['User1']._id,
          golfer: golfers['Golfer1']._id,
          pickNumber: 1
        } as DraftPick);
        'Expected draft pick to fail.'.should.not.be.ok();
      } catch (err) {
        err.message.should.startWith('invalid pick: pick order out of sync');
      }
    });

    it('requires actual golfers', async () => {
      const access = await getActiveTourneyAccess();
      try {
        await access.makePick({
          user: users['User1']._id,
          golfer: users['User2']._id,
          pickNumber: 0
        } as DraftPick);
        'Expected draft pick to fail.'.should.not.be.ok();
      } catch (err) {
        err.message.should.startWith('invalid pick: invalid golfer');
      }
    });

    it('registers valid pick', async () => {
      const access = await getActiveTourneyAccess();
      const newPick = {
        user: users['User1']._id,
        golfer: golfers['Golfer1']._id,
        pickNumber: 0
      } as DraftPick;
      await access.makePick(newPick);
      const draft = await access.getDraft();
      draft.picks.should.containDeepOrdered([newPick]);
    });

    it('does not allow golfers to be picked twice', async () => {
      const access = await getActiveTourneyAccess();
      const newPicks = [
        {
          user: users['User1']._id,
          golfer: golfers['Golfer1']._id,
          pickNumber: 0
        },
        {
          user: users['User2']._id,
          golfer: golfers['Golfer1']._id,
          pickNumber: 1
        }
      ] as DraftPick[];

      await access.makePick(newPicks[0]);
      try {
        await access.makePick(newPicks[1]);
        'Expected draft pick to fail.'.should.not.be.ok();
      } catch (err) {
        err.message.should.startWith('invalid pick: golfer already drafted');
        const draft = await access.getDraft();
        pick(draft.picks[0], ['user', 'golfer', 'pickNumber']).should.eql(newPicks[0]);
      }
    });
  });

});
