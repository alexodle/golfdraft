import * as mongooseUtil from '../server/mongooseUtil';
import {getAccess} from '../server/access';
import config from '../server/config';
import * as _ from 'lodash';
import constants from '../common/constants';

const access = getAccess(config.current_tourney_id);

function end() {
  mongooseUtil.close();
}

function printGolfersWithoutWgr() {
  return access.getGolfers()
    .then(golfers => {
      const filtered = _.chain(golfers)
        .filter(g => g.wgr === constants.UNKNOWN_WGR)
        .map(g => g.name)
        .sort()
        .value();
      console.log('');
      console.log('');
      console.log(filtered.join('\n'));
    });
}

mongooseUtil.connect()
  .then(printGolfersWithoutWgr)
  .catch(e => console.error("FAILED", e))
  .then(end);
