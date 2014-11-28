var _ = require('lodash');

var tourneyUtils = {

  /**
   Given an ordered list of players, returns a set of DraftPickOrders
   in snake draft order.
   */
  snakeDraftOrder: function (playerOrder) {
    var reverseOrder = _.clone(playerOrder).reverse();
    var fullOrder = _.flatten([
      playerOrder,
      reverseOrder,
      playerOrder,
      reverseOrder
    ]);
    var pickOrder = _.map(fullOrder, function (player, i) {
      return { pickNumber: i, player: player._id };
    });
    return pickOrder;
  }

};

module.exports = tourneyUtils;
