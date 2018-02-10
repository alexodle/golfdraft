import '../common/utils';
import 'should';

import * as _ from 'lodash';
import * as models from '../server/models';
import * as mongooseUtil from '../server/mongooseUtil';
import config from '../server/config';

const testTourney = new models.Tourney({
  name: 'Test Tourney',
  par: 70,
  lastUpdate: new Date(),
  yahooUrl: 'http://golfdrafttest.com/notaurl'
});

_.extend(config, {
  prod: false,

  mongo_url: 'mongodb://localhost:27017/golfdraft_testdb',
  redis_url: 'redis://:@localhost:6379/test',

  tourney_id: testTourney._id
});

export const initTestDb = _.once(function _initTestDb() {
  mongooseUtil.connect()
    .then(function () {
      return testTourney.save();
    });
});

export const closeTestDb = function _closeTestDb() {
  mongooseUtil.close();
}
