/** @jsx React.DOM */
'use strict';

var _ = require('lodash');
var React = require('react');
var GolfDraftPanel = require('./GolfDraftPanel.jsx');

var AutoPicker = React.createClass({

  render: function () {
    var golfersRemaining = this.props.golfersRemaining;
    var autoPickOrder = this.props.autoPickOrder;
    var isAutoPick = this.props.isAutoPick;

    return (
      <GolfDraftPanel heading='Auto Picking'>
        <div>
          autoPickOrder: {JSON.stringify(autoPickOrder)}<br />
          isAutoPick: {isAutoPick.toString()}
        </div>
      </GolfDraftPanel>
    );
  }

});

module.exports = AutoPicker;
