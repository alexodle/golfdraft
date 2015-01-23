/** @jsx React.DOM */
'use strict';

var Assets = require("../constants/Assets");
var IsMyDraftPickMixin = require("./IsMyDraftPickMixin");
var PureRenderMixin = require('react/lib/ReactComponentWithPureRenderMixin');
var React = require('react');

var MY_TURN_SOUND = new Audio(Assets.MY_TURN_SOUND);
var NEW_MESSAGE_SOUND = new Audio(Assets.NEW_CHAT_MESSAGE_SOUND);
var PICK_MADE_SOUND = new Audio(Assets.PICK_MADE_SOUND);

var MY_TURN_INTERVAL = 1000 * 10; // 10 seconds

var ReactPropTypes = React.PropTypes;

var DraftAppSounds = React.createClass({
  mixins: [IsMyDraftPickMixin, PureRenderMixin],

  propTypes: {
    draftPicks: ReactPropTypes.array.isRequired,
    playSounds: ReactPropTypes.bool.isRequired,
    messages: ReactPropTypes.array
  },

  componentWillReceiveProps: function (nextProps) {
    var props = this.props;
    var playSounds = nextProps.playSounds;

    var willBeMyPick = this.isMyDraftPick(nextProps);
    this._toggleIsMyTurnSound(playSounds && willBeMyPick);

    if (!playSounds) return;

    if (!this.isMyDraftPick() && willBeMyPick) {
      MY_TURN_SOUND.play();
    } else if (props.draftPicks.length !== nextProps.draftPicks.length) {
      PICK_MADE_SOUND.play();
    } else if (
      props.messsages &&
      props.messages.length !== nextProps.messages.length
    ) {
      NEW_MESSAGE_SOUND.play();
    }
  },

  render: function () {
    return null;
  },

  _toggleIsMyTurnSound: function (isMyTurn) {
    if (isMyTurn && !this._myTurnInterval) {
      this._myTurnInterval = setInterval(function () {
        MY_TURN_SOUND.play();
      }, MY_TURN_INTERVAL);
    } else if (!isMyTurn && this._myTurnInterval) {
      clearInterval(this._myTurnInterval);
      this._myTurnInterval = null;
    }
  }

});

module.exports = DraftAppSounds;
