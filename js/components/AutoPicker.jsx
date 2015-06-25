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
    var golfersAvailable = _.difference(golfersRemaining, autoPickOrder);

    var moveToPickOrder = this._moveToPickOrder;

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
              <ol>
                {_.map(autoPickOrder, function (g) {
                  return (
                    <li key={g}>{GolferStore.getGolfer(g).name}</li>
                  );
                })}
              </ol>
            </GolfDraftPanel>
          </div>

          <div className='col-md-6'>
            <GolfDraftPanel heading='Available Players'>
              <ol>
                {_.map(golfersAvailable, function (g) {
                  return (
                    <li key={g}>
                      <a
                        href='#'
                        onClick={_.partial(moveToPickOrder, g)}
                      >{GolferStore.getGolfer(g).name}
                      </a>
                    </li>
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
  },

  _moveToPickOrder: function (g) {
    var autoPickOrder = this.props.autoPickOrder.concat([g]);
    AutoPickActions.setAutoPickOrder(autoPickOrder);
  }

});

module.exports = AutoPicker;
