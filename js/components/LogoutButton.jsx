"use strict";

var React = require("react");
var _ = require("lodash");

var UserActions = require("../actions/UserActions");

var LogoutButton = React.createClass({

  render: function () {
    return (
        <a
          href="#noop"
          className="logout-button"
          onClick={this._onClick}
        >I&#8217;m not {this.props.currentUser.name}</a>
    );
  },

  _onClick: function (ev) {
    ev.preventDefault();
    UserActions.setCurrentUser(null);
  }

});

module.exports = LogoutButton;
