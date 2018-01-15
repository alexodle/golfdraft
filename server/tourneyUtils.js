const _ = require('lodash');

const tourneyUtils = {

  /**
   Given an ordered list of users, returns a set of DraftPickOrders
   in snake draft order.
   */
  snakeDraftOrder: function (userOrder) {
    const reverseOrder = _.clone(userOrder).reverse();
    const fullOrder = _.flatten([
      userOrder,
      reverseOrder,
      userOrder,
      reverseOrder
    ]);
    const pickOrder = _.map(fullOrder, function (user, i) {
      return { pickNumber: i, user: user._id };
    });
    return pickOrder;
  }

};

module.exports = tourneyUtils;
