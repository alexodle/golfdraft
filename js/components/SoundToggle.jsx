/** @jsx React.DOM */
"use strict";

var React = require('react');
var SettingsActions = require("../actions/SettingsActions");

var ReactPropTypes = React.PropTypes;

var SoundToggle = React.createClass({

  propTypes: {
    playSounds: ReactPropTypes.bool.isRequired
  },

  render: function () {
    var playSounds = this.props.playSounds;
    var ico = playSounds ? 'fa-bell-o' : 'fa-bell-slash-o';
    return this.transferPropsTo(
      <span>
        <i onClick={this._togglePlaySounds} className={'fa ' + ico} />
      </span>
    );
  },

  _togglePlaySounds: function () {
    SettingsActions.setPlaySounds(!this.props.playSounds);
  }

});

module.exports = SoundToggle;
