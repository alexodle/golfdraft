import * as _ from 'lodash';
import {DraftPick, User} from './ServerTypes';

/**
 Given an ordered list of users, returns a set of DraftPickOrders
 in snake draft order.
 */
export function snakeDraftOrder(userOrder: User[]) : DraftPick[] {
  const reverseOrder = _.clone(userOrder).reverse();
  const fullOrder = _.flatten([
    userOrder,
    reverseOrder,
    userOrder,
    reverseOrder
  ]);
  const pickOrder = _.map(fullOrder, (user, i) => {
    return { pickNumber: i, user: user._id } as DraftPick;
  });
  return pickOrder;
}
