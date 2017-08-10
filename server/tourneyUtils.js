var _ = require('lodash');

var tourneyUtils = {

  /**
   Given an ordered list of players, returns a set of DraftPickOrders
   in snake draft order.
   */
  snakeDraftOrder: function () {
    var playerOrder = arguments[0];
    var rounds = 4;
    if (arguments.length > 1)
      rounds = arguments[1];
    var reverseOrder = _.clone(playerOrder).reverse();
    // TODO: set # of rounds in the config and make this based on that
    var order = [];
    for (var i=0; i< rounds; ++i) {
      if (i % 2 == 0)
        order.push(playerOrder);
      else
        order.push(reverseOrder);
    }
    var fullOrder = _.flatten(order);
    var pickOrder = _.map(fullOrder, function (player, i) {
      return { pickNumber: i, player: player._id };
    });
    return pickOrder;
  }

};

module.exports = tourneyUtils;
