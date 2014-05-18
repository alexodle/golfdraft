/** @jsx React.DOM */
'use strict';

var React = require('react');
var _ = require('underscore');

var UserActions = require('../actions/UserActions');
var UserStore = require('../stores/UserStore');
var PlayerStore = require('../stores/PlayerStore');

function sortedUsers() {
  var sortedUsers = _.chain(UserStore.getAll())
    .values()
    .sortBy(function (u) {
      return u.name;
    })
    .value();
  return sortedUsers;
}

var WhoIsYou = React.createClass({

  getInitialState: function () {
    var selectedUser = sortedUsers()[0].id;
    return { selectedUser: selectedUser };
  },

  render: function () {
    var options = _.map(sortedUsers(), function (u) {
      return (<option key={u.id} value={u.id}>{u.name}</option>);
    });
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
                  size="5"
                  className="form-control"
                >
                  {options}
                </select>
              </div>
              <button
                className="btn btn-default btn-primary"
                onClick={this._onSubmit}
              >
                Pick
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
