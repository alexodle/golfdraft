'use strict';

const _ = require('lodash');
const DraftActions = require('../actions/DraftActions');
const PlayerStore = require('../stores/PlayerStore');
const React = require('react');

const DraftStatus = React.createClass({

  render: function () {
    const currentPick = this.props.currentPick;
    const playerName = PlayerStore.getPlayer(currentPick.player).name;
    return (
      <div>
        <p className='draft-status'>
          Now drafting (Pick #{currentPick.pickNumber + 1}): <b>{playerName}</b>
        </p>
        <a href='#' onClick={this._onTakePick}>I'll pick for {playerName}</a>
      </div>
    );
  },

  _onTakePick: function (ev) {
    ev.preventDefault();
    DraftActions.draftForPlayer(this.props.currentPick.player);
  }

});

module.exports = DraftStatus;
