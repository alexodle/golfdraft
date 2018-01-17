'use strict';

const _ = require('lodash');
const DraftActions = require('../actions/DraftActions');
const UserStore = require('../stores/UserStore');
const React = require('react');

class DraftStatus extends React.Component {
  render() {
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
  }

  _onTakePick = (ev) => {
    ev.preventDefault();
    DraftActions.draftForUser(this.props.currentPick.user);
  }

};

module.exports = DraftStatus;
