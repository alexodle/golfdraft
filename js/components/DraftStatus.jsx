// @flow
'use strict';

const _ = require('lodash');
const DraftActions = require('../actions/DraftActions');
const UserStore = require('../stores/UserStore');
const React = require('react');

const DraftStatus = React.createClass({

  render: function () {
    const currentPick = this.props.currentPick;
    const userName = UserStore.getUser(currentPick.user).name;
    return (
      <div>
        <p className='draft-status'>
          Now drafting (Pick #{currentPick.pickNumber + 1}): <b>{userName}</b>
        </p>
        <a href='#' onClick={this._onTakePick}>I'll pick for {userName}</a>
      </div>
    );
  },

  _onTakePick: function (ev) {
    ev.preventDefault();
    DraftActions.draftForUser(this.props.currentPick.user);
  }

});

module.exports = DraftStatus;
