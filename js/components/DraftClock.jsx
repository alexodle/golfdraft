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
var WARNING_SOUND_INTERVAL_SECONDS = 15;

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
  },

  componentWillReceiveProps: function (nextProps) {
    this.setState(this._getTotalMillis(nextProps));
  },

  componentDidUpdate: function (prevProps, prevState) {
    var displayTimeChanged = this._getDisplayTime(prevState) !== this._getDisplayTime();
    var isMyPick = this.props.isMyPick;
    var totalMillis = this.state.totalMillis;

    if (!displayTimeChanged || !isMyPick || totalMillis < WARNING_TIME) {
      return;
    }

    if (totalMillis + FINAL_COUNTDOWN_THRESHOLD >= OVERTIME) {
      pickWarningSound.play();
    } else if (moment.utc(totalMillis).seconds() % WARNING_SOUND_INTERVAL_SECONDS === 0) {
      pickWarningSound.player();
    }
  },

  render: function () {
    var body = null;

    var totalMillis = this.state.totalMillis || 0;
    var className = "";
    if (totalMillis > OVERTIME) {
      className = "text-danger";
    } else if (totalMillis > WARNING_TIME) {
      className = "text-warning";
    }

    var format = this._getDisplayTime();
    body = (
      <p className='draft-clock'><b className={className}>{format}</b></p>
    );

    return (
      <GolfDraftPanel heading='Draft Clock'>
        {body}
      </GolfDraftPanel>
    );
  },

  _getDisplayTime: function (state) {
    state = state || this.state;

    var totalMillis = state.totalMillis || 0;
    return moment.utc(totalMillis).format("mm:ss");
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
  }

});

module.exports = DraftClock;
