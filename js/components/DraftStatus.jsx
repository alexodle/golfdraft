'use strict';

var _ = require('lodash');
var DraftActions = require('../actions/DraftActions');
var GolfDraftPanel = require('./GolfDraftPanel.jsx');
var Link = require('react-router').Link;
var PlayerStore = require('../stores/PlayerStore');
var React = require('react');

var DraftOver = React.createClass({

  render: function () {
    return (
      <div className="jumbotron">
        <h1>The draft is over!</h1>
        <p><Link to='/'>Check out the live leaderboard</Link></p>
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

    var playerName = PlayerStore.getPlayer(currentPick.player).name;
    return (
      <GolfDraftPanel heading='Draft Status'>
        <p className='draft-status'>
          Now drafting (Pick #{currentPick.pickNumber + 1}): <b>{playerName}</b>
        </p>
        <a href='#' onClick={this._onTakePick}>I'll pick for {playerName}</a>
      </GolfDraftPanel>
    );
  },

  _onTakePick: function (ev) {
    ev.preventDefault();
    DraftActions.draftForPlayer(this.props.currentPick.player);
  }

});

module.exports = DraftStatus;
