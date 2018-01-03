const _ = require('lodash');

const tourneyUtils = {

  /**
   Given an ordered list of players, returns a set of DraftPickOrders
   in snake draft order.
   */
  snakeDraftOrder: function (playerOrder) {
    const reverseOrder = _.clone(playerOrder).reverse();
    const fullOrder = _.flatten([
      playerOrder,
      reverseOrder,
      playerOrder,
      reverseOrder
    ]);
    const pickOrder = _.map(fullOrder, function (player, i) {
      return { pickNumber: i, player: player._id };
    });
    return pickOrder;
  }

};

module.exports = tourneyUtils;
