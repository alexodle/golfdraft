import {clone, flatten} from 'lodash';
import {DraftPick, User} from './ServerTypes';

/**
 Given an ordered list of users, returns a set of DraftPickOrders
 in snake draft order.
 */
export function snakeDraftOrder(userOrder: User[]) : DraftPick[] {
  const reverseOrder = clone(userOrder).reverse();
  const fullOrder = flatten([
    userOrder,
    reverseOrder,
    userOrder,
    reverseOrder
  ]);
  const pickOrder = fullOrder.map((user, i) =>
    ({ pickNumber: i, user: user._id } as DraftPick));
  return pickOrder;
}
