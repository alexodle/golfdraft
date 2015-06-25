/** @jsx React.DOM */
'use strict';

var _ = require('lodash');
var React = require('react');
var GolfDraftPanel = require('./GolfDraftPanel.jsx');
var AutoPickActions = require('../actions/AutoPickActions');

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

        <div className='checkbox'>
          <label>
            <input type='checkbox' value={isAutoPick} onChange={this._setIsAutoPick} /> Auto-pick
          </label>
        </div>
      </GolfDraftPanel>
    );
  },

  _setIsAutoPick: function (ev) {
    AutoPickActions.setIsAutoPick(ev.target.checked);
  }

});

module.exports = AutoPicker;
