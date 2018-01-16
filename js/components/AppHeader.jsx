// @flow
'use strict';

const LogoutButton = require("./LogoutButton.jsx");
const React = require('react');

const ReactPropTypes = React.PropTypes;

const AppHeader = React.createClass({

  propTypes: {
    tourneyName: ReactPropTypes.string.isRequired,
    currentUser: ReactPropTypes.object.isRequired,
    drafting: ReactPropTypes.bool,
    location: React.PropTypes.object
  },

  render: function () {
    return (
      <div className='page-header draft-page-header'>
        <h1>
          Welcome to the {this.props.tourneyName}
          {!this.props.drafting ? null : ' Draft'}<br />
          <small>{this.props.currentUser.name}</small>
          <span> </span>
          <span className='logout-button'>
            <LogoutButton
              currentUser={this.props.currentUser}
              location={this.props.location}
            />
          </span>
        </h1>
      </div>
    );
  }


});

module.exports = AppHeader;
