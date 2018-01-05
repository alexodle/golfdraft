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

    const location = this.props.location;
    if (location.state && location.state.nextPathname) {
      this.context.router.replace(location.state.nextPathname);
    } else {
      this.context.router.replace('/');
    }
  }

});

module.exports = WhoIsYou;
