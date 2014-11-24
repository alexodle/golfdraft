/** @jsx React.DOM */
'use strict';

var React = require('react');
var ReactPropTypes = React.PropTypes;
var cx = require('react/lib/cx');
var _ = require('lodash');

var PlayerStore = require('../stores/PlayerStore');
var UserStore = require('../stores/UserStore');
var DraftStore = require('../stores/DraftStore');

var DraftPickOrder = React.createClass({

  propTypes: {
    currentUser: ReactPropTypes.object.isRequired,
    currentPick: ReactPropTypes.object.isRequired
  },

  render: function () {
    var myPlayer = this.props.currentUser.player;
    var currentPlayer = this.props.currentPick.player;
    var pickOrder = DraftStore.getPickOrder();
    pickOrder = _.first(pickOrder, pickOrder.length / 4);
    return (
      <div>
        <h2>Pick order</h2>
        <ol className='pick-order-list'>
          {_.map(pickOrder, function (player, i) {
            var text = PlayerStore.getPlayer(player).name;
            return (
              <li
                key={player}
                className={cx({
                  'my-player': myPlayer === player,
                  'current-player': currentPlayer === player
                })}
              >{text}</li>);
          })}
        </ol>
      </div>
    );
  }

});

module.exports = DraftPickOrder;
