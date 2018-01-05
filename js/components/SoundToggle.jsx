"use strict";

const React = require('react');
const SettingsActions = require("../actions/SettingsActions");

const ReactPropTypes = React.PropTypes;

const SoundToggle = React.createClass({

  propTypes: {
    playSounds: ReactPropTypes.bool.isRequired
  },

  render: function () {
    const playSounds = this.props.playSounds;
    const ico = playSounds ? 'fa-bell-o' : 'fa-bell-slash-o';
    return (
      <span {...this.props}>
        <i onClick={this._togglePlaySounds} className={'fa ' + ico} />
      </span>
    );
  },

  _togglePlaySounds: function () {
    SettingsActions.setPlaySounds(!this.props.playSounds);
  }

});

module.exports = SoundToggle;
