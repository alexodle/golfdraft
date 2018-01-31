"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
/**
 Given an ordered list of users, returns a set of DraftPickOrders
 in snake draft order.
 */
function snakeDraftOrder(userOrder) {
    const reverseOrder = _.clone(userOrder).reverse();
    const fullOrder = _.flatten([
        userOrder,
        reverseOrder,
        userOrder,
        reverseOrder
    ]);
    const pickOrder = _.map(fullOrder, (user, i) => {
        return { pickNumber: i, user: user._id };
    });
    return pickOrder;
}
exports.snakeDraftOrder = snakeDraftOrder;
