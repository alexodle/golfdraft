import '../common/utils';
import 'should';

import {once, extend} from 'lodash';
import {initNewTourney} from '../server/access';
import * as models from '../server/models';
import * as mongooseUtil from '../server/mongooseUtil';
import config from '../server/config';

extend(config, {
  prod: false,
  mongo_url: 'mongodb://localhost:27017/golfdraft_testdb',
  redis_url: 'redis://:@localhost:6379/test'
});

function clear() {
  return Promise.all([
    models.Tourney.remove({}).exec(),
    models.AppState.remove({}).exec(),
  ]);
}

export const initTestDb = once(async () => {
  await mongooseUtil.connect();
  await clear();

  const tourneyId = await initNewTourney('Test Tourney', new Date());
  const appState = new models.AppState({
    activeTourneyId: tourneyId,
    isDraftPaused: true,
    allowClock: true,
    draftHasStarted: false,
    autoPickUsers: []
  });
  await appState.save();
});

export const closeTestDb = async () => {
  await clear();
  await mongooseUtil.close();
}
