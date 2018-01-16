// @flow
'use strict';

const $ = require('jquery');
const _ = require('lodash');
const DraftActions = require('../actions/DraftActions');
const DraftHistory = require('./DraftHistory.jsx');
const DraftStatus = require('./DraftStatus.jsx');
const DraftStore = require('../stores/DraftStore');
const React = require('react');
const UserActions = require('../actions/UserActions');

function togglePause(isPaused) {
  $.ajax({
    url: '/admin/pause',
    type: 'PUT',
    contentType: 'application/json',
    data: JSON.stringify({ isPaused: isPaused })
  });
}

function toggleAllowClock(allowClock) {
  $.ajax({
    url: '/admin/allowClock',
    type: 'PUT',
    contentType: 'application/json',
    data: JSON.stringify({ allowClock: allowClock })
  });
}

function toggleDraftHasStarted(draftHasStarted) {
  $.ajax({
    url: '/admin/draftHasStarted',
    type: 'PUT',
    contentType: 'application/json',
    data: JSON.stringify({ draftHasStarted: draftHasStarted })
  });
}

function toggleAutoPick(userId, autoPick) {
  $.ajax({
    url: '/admin/autoPickUsers',
    type: 'PUT',
    contentType: 'application/json',
    data: JSON.stringify({ userId: userId, autoPick: autoPick })
  });
}

const PasswordInput = React.createClass({

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

    const that = this;
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

const AdminApp = React.createClass({

  getInitialState: function () {
    return {
      confirmingUndo: false
    };
  },

  render: function () {
    const props = this.props;
    const confirmingUndo = this.state.confirmingUndo;

    if (!props.isAdmin) {
      return (<PasswordInput />);
    }

    return (
      <section>
        <h1>Hello admin!</h1>

        {props.draftHasStarted ? (
          <h2>Draft has started!</h2>
        ) : (
          <h2>Draft has not started yet</h2>
        )}
        <div className='panel'>
          <div className='panel-body'>
            <button
              type='button'
              className='btn btn-default'
              onClick={this._onStartDraft}
            >Start Draft</button>
            <span> </span>
            <button
              type='button'
              className='btn btn-default'
              onClick={this._onUnstartDraft}
            >Unstart Draft</button>
          </div>
        </div>

        {props.isPaused ? (
          <h2>Paused!</h2>
        ) : (
          <h2>Not Paused</h2>
        )}
        <div className='panel'>
          <div className='panel-body'>
            <button
              type='button'
              className='btn btn-default'
              onClick={this._onPause}
            >Pause</button>
            <span> </span>
            <button
              type='button'
              className='btn btn-default'
              onClick={this._onUnpause}
            >Unpause</button>
          </div>
        </div>

        <h2>Auto picks</h2>
        <div className='panel'>
          <div className='panel-body'>
            <ul className='list-unstyled'>
              {_.map(props.users, function (user) {
                const checked = !!props.autoPickUsers[user._id];
                return (
                  <li key={user._id}>
                    <div className='checkbox'>
                      <label>
                        <input
                          type='checkbox'
                          checked={checked}
                          onChange={toggleAutoPick.bind(null, user._id, !checked)}
                        /> {user.name}
                      </label>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {props.allowClock ? (
          <h2>Allowing clock</h2>
        ) : (
          <h2>Not allowing clock!</h2>
        )}
        <div className='panel'>
          <div className='panel-body'>
            <button
              type='button'
              className='btn btn-default'
              onClick={this._onAllowClock}
            >Allow clock</button>
            <span> </span>
            <button
              type='button'
              className='btn btn-default'
              onClick={this._onStopClock}
            >Pause clock</button>
          </div>
        </div>

        <div className='panel'>
          <div className='panel-body'>
            {confirmingUndo ? null : (
              <button
                className='btn btn-default'
                  type='button'
                onClick={this._undoLastPick}
              >Undo Pick</button>
            )}
            {!confirmingUndo ? null : (
              <span>
                <label>Are you sure you want to undo the last pick?</label>
                <button
                  className='btn btn-default'
                  type='button'
                  onClick={this._confirmUndoLastPick}
                >I'm sure</button>
                <span> </span>
                <button
                  className='btn btn-default'
                  type='button'
                  onClick={this._cancelUndoLastPick}
                >Cancel</button>
              </span>
            )}
          </div>
        </div>

        <div className='panel'>
          <div className='panel-body'>
            <button className='btn btn-default' onClick={this._forceRefresh}>Force Refresh</button>
          </div>
        </div>

        {!props.currentPick ? null : (
          <DraftStatus currentPick={props.currentPick} />
        )}
        <DraftHistory draftPicks={props.draftPicks} />
      </section>
    );
  },

  _onStartDraft: function () {
    toggleDraftHasStarted(true);
  },

  _onUnstartDraft: function () {
    toggleDraftHasStarted(false);
  },

  _onPause: function () {
    togglePause(true);
  },

  _onUnpause: function () {
    togglePause(false);
  },

  _onAllowClock: function () {
    toggleAllowClock(true);
  },

  _onStopClock: function () {
    toggleAllowClock(false);
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
  }

});

module.exports = AdminApp;
