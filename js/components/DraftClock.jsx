'use strict';

var _ = require('lodash');
var Assets = require('../constants/Assets');
var GolfDraftPanel = require('./GolfDraftPanel.jsx');
var moment = require('moment');
var React = require('react');

var TIME_INTERVAL = 1000;
var WARNING_TIME = 1000 * 60 * 2;
var OVERTIME = 1000 * 60 * 3;
var FINAL_COUNTDOWN_THRESHOLD = 1000 * 15;
var WARNING_SOUND_INTERVAL = 1000 * 15;
var FINAL_WARNING_SOUND_INTERVAL = 1000 * 1;

var pickWarningSound = new Audio(Assets.PICK_WARNING_SOUND);

var DraftClock = React.createClass({

  getInitialState: function () {
    return this._getTotalMillis();
  },

  componentDidMount: function () {
    this._intervalId = setInterval(function () {
      this.setState(this._getTotalMillis());
    }.bind(this), TIME_INTERVAL);
  },

  componentWillUnmount: function () {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
    this._clearWarningInterval();
    this._clearFinalWarningInterval();
  },

  componentWillReceiveProps: function (nextProps) {
    this.setState(this._getTotalMillis(nextProps));
  },

  componentDidUpdate: function (prevProps, prevState) {
    var allowSounds = this.props.isMyPick;
    var totalMillis = this.state.totalMillis;

    if (!allowSounds || totalMillis < WARNING_TIME) {
      this._clearWarningInterval();
      this._clearFinalWarningInterval();
      return;
    }

    if (this._finalWarningIntervalId) return;

    if (totalMillis + FINAL_COUNTDOWN_THRESHOLD >= OVERTIME) {
      pickWarningSound.play();

      this._clearWarningInterval();
      this._finalWarningIntervalId = setInterval(function () {
        pickWarningSound.play();
      }, FINAL_WARNING_SOUND_INTERVAL);

    } else if (!this._warningIntervalId && totalMillis >= WARNING_TIME) {

      this._warningIntervalId = setInterval(function () {
        pickWarningSound.play();
      }, WARNING_SOUND_INTERVAL);
    }
  },

  render: function () {
    var body = null;

    var totalMillis = this.state.totalMillis;
    if (!totalMillis) {
      body = (<p className='draft-clock'><b>Waiting...</b></p>);

    } else {

      var className = "";
      if (totalMillis > OVERTIME) {
        className = "text-danger";
      } else if (totalMillis > WARNING_TIME) {
        className = "text-warning";
      }

      var format = moment.utc(totalMillis).format("mm:ss");
      body = (
        <p className='draft-clock'><b className={className}>{format}</b></p>
      );
    }

    return (
      <GolfDraftPanel heading='Draft Clock'>
        {body}
      </GolfDraftPanel>
    );
  },

  _getTotalMillis: function (props) {
    props = props || this.props;

    if (_.isEmpty(props.draftPicks)) {
      return { totalMillis: null };
    }

    var lastPick = _.last(props.draftPicks);
    var currentTime = new Date();
    var totalMillis = Math.max(0, currentTime - lastPick.clientTimestamp);
    return {
      totalMillis: totalMillis
    };
  },

  _clearWarningInterval: function () {
    if (this._warningIntervalId) {
      clearInterval(this._warningIntervalId);
      this._warningIntervalId = null;
    }
  },

  _clearFinalWarningInterval: function () {
    if (this._finalWarningIntervalId) {
      clearInterval(this._finalWarningIntervalId);
      this._finalWarningIntervalId = null;
    }
  }

});

module.exports = DraftClock;
