'use strict';

const React = require('react');
const _ = require('lodash');

const UserActions = require('../actions/UserActions');
const UserStore = require('../stores/UserStore');
const PlayerStore = require('../stores/PlayerStore');

function getSortedUsers() {
  return _.sortBy(UserStore.getAll(), 'name');
}

const WhoIsYou = React.createClass({

  contextTypes: {
    router: React.PropTypes.object.isRequired
  },

  childContextTypes: {
    location: React.PropTypes.object
  },

  getInitialState: function () {
    const selectedUser = getSortedUsers()[0].id;
    return { selectedUser: selectedUser, password: '' };
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
                  onChange={this._onUserChange}
                  size="15"
                  className="form-control"
                >
                  {_.map(getSortedUsers(), function (u) {
                    return (<option key={u.id} value={u.id}>{u.name}</option>);
                  })}
                </select>
                <input
                  id="password"
                  type="password"
                  className="form-control"
                  placeholder="password"
                  value={this.state.password}
                />
              </div>
              <button
                className="btn btn-default btn-primary"
                onClick={this._onSubmit}
                disabled={!this.state.password}
              >
                Sign in
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  },

  _onUserChange: function (ev) {
    this.setState({ selectedUser: ev.target.value });
  },

  _onPasswordChange: function (ev) {
    this.setState({ password: ev.target.value });
  },

  _onSubmit: function (ev) {
    ev.preventDefault();

    xhr = $.post('/login', {
      username: PlayerStore.getPlayer(this.state.selectedUser).username,
      password: this.state.password
    });
    xhr.fail(function () {
      window.location.reload();
    });
    xhr.done(function () {
      UserActions.setCurrentUser(this.state.selectedUser);
      UserActions.setCurrentUserSynced();

      const location = this.props.location;
      if (location.state && location.state.nextPathname) {
        this.context.router.replace(location.state.nextPathname);
      } else {
        this.context.router.replace('/');
      }
    });
  }

});

module.exports = WhoIsYou;
