/** @jsx React.DOM */
'use strict';

var _ = require('lodash');
var AutoPickActions = require('../actions/AutoPickActions');
var GolfDraftPanel = require('./GolfDraftPanel.jsx');
var GolferStore = require('../stores/GolferStore');
var React = require('react');

var AutoPicker = React.createClass({

  render: function () {
    var golfersRemaining = _.chain(this.props.golfersRemaining)
      .sortBy('wgr')
      .pluck('id')
      .value();
    var isAutoPick = this.props.isAutoPick;
    var autoPickOrder = _.intersection(this.props.autoPickOrder, golfersRemaining);

    return (
      <GolfDraftPanel heading='Auto Picking'>
        <div className='checkbox'>
          <label>
            <input type='checkbox' value={isAutoPick} onChange={this._setIsAutoPick} /> Auto-pick
          </label>
        </div>

        <div className='row'>

          <div className='col-md-6'>
            <GolfDraftPanel heading='Pick Order'>
              {JSON.stringify(autoPickOrder)}
            </GolfDraftPanel>
          </div>

          <div className='col-md-6'>
            <GolfDraftPanel heading='Available Players'>
              <ol>
                {_.map(golfersRemaining, function (g) {
                  return (
                    <li key={g}>{GolferStore.getGolfer(g).name}</li>
                  );
                })}
              </ol>
            </GolfDraftPanel>
          </div>

        </div>
      </GolfDraftPanel>
    );
  },

  _setIsAutoPick: function (ev) {
    AutoPickActions.setIsAutoPick(ev.target.checked);
  }

});

module.exports = AutoPicker;
