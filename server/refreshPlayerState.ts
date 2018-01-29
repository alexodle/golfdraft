// Refreshes users, pick order, draft picks, and chat

import * as _ from 'lodash';
import * as access from './access';
import * as mongooseUtil from './mongooseUtil';
import config from './config';
import tourneyConfigReader from './tourneyConfigReader';
import {snakeDraftOrder} from './tourneyUtils';
import {User} from './ServerTypes';

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
  .then(function () {
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
    .then(function () {
      const tourneyCfg = tourneyConfigReader.loadConfig();
      return refreshUserState(tourneyCfg.draftOrder);
    })
    .then(function () {
      mongooseUtil.close();
    })
    .catch(function (err) {
      console.log(err);
    });
}
