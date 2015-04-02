/** @jsx React.DOM */
'use strict';

var React = require('react');
var _ = require('lodash');

var UserActions = require('../actions/UserActions');
var UserStore = require('../stores/UserStore');
var PlayerStore = require('../stores/PlayerStore');

function getSortedUsers() {
  return _.sortBy(UserStore.getAll(), 'name');
}

var WhoIsYou = React.createClass({

  getInitialState: function () {
    var selectedUser = getSortedUsers()[0].id;
    return { selectedUser: selectedUser };
  },

  render: function () {
    return (
      <div>
        <h2>Who is you?</h2>
        <div className="panel panel-default">
          <div className="panel-body">
            <form role="form">
              <div className="form-group">
                <select
                  id="userSelect"
                  value={this.state.selectedUser}
                  onChange={this._onChange}
                  size="15"
                  className="form-control"
                >
                  {_.map(getSortedUsers(), function (u) {
                    return (<option key={u.id} value={u.id}>{u.name}</option>);
                  })}
                </select>
              </div>
              <button
                className="btn btn-default btn-primary"
                onClick={this._onSubmit}
              >
                Sign in
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  },

  _onChange: function (ev) {
    this.setState({selectedUser: ev.target.value});
  },

  _onSubmit: function (ev) {
    ev.preventDefault();
    UserActions.setCurrentUser(this.state.selectedUser);
  }

});

module.exports = WhoIsYou;
