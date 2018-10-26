// Refreshes users, pick order, draft picks, and chat

import * as _ from 'lodash';
import {getAccess} from './access';
import * as mongooseUtil from './mongooseUtil';
import config from './config';
import {loadConfig} from './tourneyConfigReader';
import {snakeDraftOrder} from './tourneyUtils';
import {User} from './ServerTypes';

const access = getAccess(config.current_tourney_id);

export default function refreshUserState(pickOrderNames) {
  return Promise.all([
    access.clearPickOrder(),
    access.clearDraftPicks(),
    access.clearChatMessages(),
    access.clearPickLists()
  ])
  .then(() => {
    const users = _.map(pickOrderNames, (name) => {
      return { name: name } as User;
    });
    return access.ensureUsers(users);
  })
  .then(() => {
    return access.getUsers().then((users) => {
      return _.sortBy(users, (u) => {
        return _.indexOf(pickOrderNames, u.name);
      });
    });
  })
  .then((sortedUsers) => {
    const pickOrder = snakeDraftOrder(sortedUsers);
    return access.setPickOrder(pickOrder);
  });
}

if (require.main === module) {
  mongooseUtil.connect()
    .then(() => {
      const tourneyCfg = loadConfig();
      return refreshUserState(tourneyCfg.draftOrder);
    })
    .then(() => {
      mongooseUtil.close();
    })
    .catch((err) => {
      console.log(err);
    });
}
