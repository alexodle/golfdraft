/** @jsx React.DOM */
'use strict';

var React = require('react');
var _ = require('underscore');

var PlayerStore = require('../stores/PlayerStore');
var UserStore = require('../stores/UserStore');
var DraftStore = require('../stores/DraftStore');

var N_PICKS = 3;

var DraftPickOrder = React.createClass({

  render: function () {
    var myPlayer = this.props.currentUser.player;
    var pickOrder = _.first(
      _.rest(DraftStore.getPickOrder(), this.props.pickNumber + 1),
      N_PICKS
    );
    return (
      <div>
        <h2>On deck</h2>
        <ol>
          {_.map(pickOrder, function (player, i) {
            var text = PlayerStore.getPlayer(player).name;
            if (player == myPlayer) {
              text = (<b>{text}</b>);
            }
            return (<li key={i}>{text}</li>);
          })}
        </ol>
      </div>
    );
  }

});

module.exports = DraftPickOrder;
