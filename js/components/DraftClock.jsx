'use strict';

var _ = require('lodash');
var GolfDraftPanel = require('./GolfDraftPanel.jsx');
var moment = require('moment');
var React = require('react');

var TIME_INTERVAL = 1000;
var WARNING_TIME = 1000 * 60 * 2;
var OVERTIME = 1000 * 60 * 3;

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
        <p className='draft-clock'>On the clock: <b className={className}>{format}</b></p>
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
  }

});

module.exports = DraftClock;
