// @flow
'use strict';

const React = require("react");
const _ = require("lodash");

const UserActions = require("../actions/UserActions");

class LogoutButton extends React.Component {
  contextTypes: {
    router: React.PropTypes.object.isRequired
  }

  proptTypes: {
    location: React.PropTypes.object
  }

  render() {
    return (
        <a
          href="#noop"
          className="logout-button"
          onClick={this._onClick}
        >I&#8217;m not {this.props.currentUser.name}</a>
    );
  }

  _onClick(ev) {
    ev.preventDefault();
    UserActions.setCurrentUser(null);
    this.context.router.replace({
      pathname: '/whoisyou',
      state: { nextPathname: this.props.location.pathname }
    });
  }

};

module.exports = LogoutButton;
