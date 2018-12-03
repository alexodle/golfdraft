// Refreshes users, pick order, draft picks, and chat

import {Access} from './access';
import {sortBy} from 'lodash';
import {snakeDraftOrder} from './tourneyUtils';
import {User} from './ServerTypes';

export default async function initUserState(access: Access, pickOrderNames: string[]) {
  await access.ensureUsers(pickOrderNames.map(name => ({ name } as User)));
  const users = await access.getUsers();

  const sortedUsers = sortBy(users, u => pickOrderNames.indexOf(u.name));
  const pickOrder = snakeDraftOrder(sortedUsers);
  return access.setPickOrder(pickOrder);
}
