/** @jsx React.DOM */
'use strict';

var _ = require('lodash');
var Link = require('react-router').Link;
var PlayerStore = require('../stores/PlayerStore');
var React = require('react');

var DraftOver = React.createClass({

  render: function () {
    return (
      <div className="jumbotron">
        <h1>The draft is over!</h1>
        <p><Link to='tourney'>Check out the live leaderboard</Link></p>
      </div>
    );
  }

});

var DraftStatus = React.createClass({

  render: function () {
    var currentPick = this.props.currentPick;
    if (!currentPick) {
      return (<DraftOver />);
    }

    return (
      <span>
        Now drafting (Pick #{currentPick.pickNumber + 1}): <b>{PlayerStore.getPlayer(currentPick.player).name}</b>
      </span>
    );
  }

});

module.exports = DraftStatus;
