'use strict';

var $ = require('jquery');
var _ = require('lodash');
var DraftActions = require('../actions/DraftActions');
var DraftHistory = require('./DraftHistory.jsx');
var DraftStatus = require('./DraftStatus.jsx');
var DraftStore = require('../stores/DraftStore');
var React = require('react');
var UserActions = require('../actions/UserActions');

function togglePause(isPaused) {
  $.ajax({
    url: '/admin/pause',
    type: 'PUT',
    contentType: 'application/json',
    data: JSON.stringify({ isPaused: isPaused })
  });
}

var PasswordInput = React.createClass({

  getInitialState: function () {
    return {
      password: '',
      busy: false
    };
  },

  render: function () {
    return (
      <section>
        <form onSubmit={this._onSubmit}>
          <div className='form-group'>
            <label htmlFor='adminPassword'>Password</label>
            <input
              type='password'
              className='form-control'
              id='adminPassword'
              name='password'
              onChange={this._onChange}
              value={this.state.password}
              disabled={this.state.busy}
            />
          </div>
          <button
            type='submit'
            className='btn btn-default'
            disabled={this.state.busy}
          >Submit</button>
        </form>
      </section>
    );
  },

  _onChange: function (ev) {
    this.setState({ password: ev.target.value });
  },

  _onSubmit: function (ev) {
    ev.preventDefault();

    var that = this;
    this.setState({ busy: true });
    $.ajax({
      url: '/admin/login',
      type: 'POST',
      data: { password: this.state.password },
      success: function () {
        UserActions.setIsAdmin(true);
      },
      error: function () {
        that.setState({ busy: false });
      }
    });
  }

});

var AdminApp = React.createClass({

  getInitialState: function () {
    return {
      confirmingUndo: false
    };
  },

  render: function () {
    var props = this.props;
    var confirmingUndo = this.state.confirmingUndo;

    if (!props.isAdmin) {
      return (<PasswordInput />);
    }

    return (
      <section>
        <h1>Hello admin!</h1>

        {!props.isPaused ? null : (
          <h2>Paused!</h2>
        )}
        <div className='panel'>
          <div className='panel-body'>
            <button className='btn' onClick={this._onPause}>Pause</button>
            <span> </span>
            <button className='btn' onClick={this._onUnpause}>Unpause</button>
          </div>
        </div>

        <div className='panel'>
          <div className='panel-body'>
            <button className='btn' onClick={this._onPickBestWGR}>
              Pick best WGR
            </button>
          </div>
        </div>

        <div className='panel'>
          <div className='panel-body'>
            {confirmingUndo ? null : (
              <button
                className='btn'
                onClick={this._undoLastPick}
              >Undo Pick</button>
            )}
            {!confirmingUndo ? null : (
              <span>
                <label>Are you sure you want to undo the last pick?</label>
                <button
                  className='btn'
                  onClick={this._confirmUndoLastPick}
                >I'm sure</button>
                <span> </span>
                <button
                  className='btn'
                  onClick={this._cancelUndoLastPick}
                >Cancel</button>
              </span>
            )}
          </div>
        </div>

        <div className='panel'>
          <div className='panel-body'>
            <button className='btn' onClick={this._forceRefresh}>Force Refresh</button>
          </div>
        </div>

        <DraftStatus currentPick={props.currentPick} />
        <DraftHistory draftPicks={props.draftPicks} />
      </section>
    );
  },

  _onPause: function () {
    togglePause(true);
  },

  _onUnpause: function () {
    togglePause(false);
  },

  _undoLastPick: function () {
    this.setState({ confirmingUndo: true });
  },

  _confirmUndoLastPick: function () {
    $.ajax({
      url: '/admin/lastPick',
      type: 'DELETE',
      contentType: 'application/json'
    });
    this._cancelUndoLastPick();
  },

  _cancelUndoLastPick: function () {
    this.setState({ confirmingUndo: false });
  },

  _forceRefresh: function () {
    $.ajax({
      url: '/admin/forceRefresh',
      type: 'PUT'
    });
  },

  _onPickBestWGR: function () {
    var nextBestGolfer = _.chain(this.props.golfersRemaining)
      .sortBy('wgr')
      .first()
      .value()
      .id;
    DraftActions.makePick(nextBestGolfer);
  }

});

module.exports = AdminApp;
