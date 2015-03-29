/** @jsx React.DOM */
'use strict';

var LogoutButton = require("./LogoutButton.jsx");
var React = require('react');
var SoundToggle = require('./SoundToggle.jsx');

var ReactPropTypes = React.PropTypes;

var AppHeader = React.createClass({

  propTypes: {
    tourneyName: ReactPropTypes.string.isRequired,
    currentUser: ReactPropTypes.object.isRequired,
    playSounds: ReactPropTypes.bool.isRequired,
    drafting: ReactPropTypes.bool
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
            <LogoutButton currentUser={this.props.currentUser} />
          </span>
          <SoundToggle
            className='global-sound-toggle'
            playSounds={this.props.playSounds}
          />
        </h1>
      </div>
    );
  }


});

module.exports = AppHeader;
