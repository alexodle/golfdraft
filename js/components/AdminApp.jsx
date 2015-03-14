/** @jsx React.DOM */
'use strict';

var $ = require('jquery');
var _ = require('lodash');
var DraftHistory = require('./DraftHistory.jsx');
var DraftStatus = require('./DraftStatus.jsx');
var React = require('react');
var UserActions = require('../actions/UserActions');

function togglePause(isPaused) {
  $.ajax({
    url: '/admin/pause',
    type: 'PUT',
    data: { isPaused: isPaused }
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

  render: function () {
    var props = this.props;

    if (!props.isAdmin) {
      return (<PasswordInput />);
    }

    return (
      <section>
        <h1>Hello admin!</h1>
        <div className='panel'>
          <div className='panel-body'>
            <button className='btn' onClick={this._onPause}>Pause</button>
            <button className='btn' onClick={this._onUnpause}>Unpause</button>
          </div>
        </div>
        <DraftStatus draftPicks={props.currentPick} />
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


});

module.exports = AdminApp;
