/** @jsx React.DOM */
'use strict';

var React = require('react');
var _ = require('lodash');

var PlayerStore = require('../stores/PlayerStore');

var DraftStatus = React.createClass({

  render: function () {
    var currentPick = this.props.currentPick;

    return (
      <span>
        Now drafting (Pick #{currentPick.pickNumber + 1}): <b>{PlayerStore.getPlayer(currentPick.player).name}</b>
      </span>
    );
  }

});

module.exports = DraftStatus;
