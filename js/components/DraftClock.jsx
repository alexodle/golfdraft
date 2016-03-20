'use strict';

var _ = require('lodash');
var moment = require('moment');
var React = require('react');

var TIME_INTERVAL = 1000;

var DraftClock = React.createClass({

  getInitialState: function () {
    return this._getTotalMillis();
  },

  componentDidMount: function () {
    var that = this;
    this._intervalId = setInterval(function () {
      that.setState(that._getTotalMillis());
    }, TIME_INTERVAL);
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

  render: function () {
    var totalMillis = this.state.totalMillis;
    if (!totalMillis) {
      return <div><b>Waiting for first pick...</b></div>
    };

    var format = moment.utc(totalMillis).format("mm:ss");
    return (
      <div>On the clock: <b>{format}</b></div>
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
  }

});

module.exports = DraftClock;
