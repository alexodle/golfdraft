'use strict';

const React = require("react");
const _ = require("lodash");

const UserActions = require("../actions/UserActions");

class LogoutButton extends React.Component {

  constructor(props) {
    super(props);
    this.state = this._getInitialState();
  }

  _getInitialState() {
    return { redirectTo: null };
  }

  render() {
    const {redirectTo} = this.state;
    if (redirectTo) {
      return (<Redirect to={redirectTo} />);
    }

    return (
        <a
          href="#noop"
          className="logout-button"
          onClick={this._onClick}
        >I&#8217;m not {this.props.currentUser.name}</a>
    );
  }

  _onClick = (ev) => {
    ev.preventDefault();
    UserActions.setCurrentUser(null);
    this.setState({ redirectTo: '/whoisyou' });
  }

};

module.exports = LogoutButton;
