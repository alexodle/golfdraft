/** @jsx React.DOM */
'use strict';

var _ = require('lodash');
var AutoPickActions = require('../actions/AutoPickActions');
var GolfDraftPanel = require('./GolfDraftPanel.jsx');
var GolferStore = require('../stores/GolferStore');
var React = require('react');

function getGolferFromClickEvent(ev) {
  ev.preventDefault();
  return ev.target.dataset.golfer;
}

function safeSwap(arr, iFrom, iTo) {
  if (iTo < 0 || iTo >= arr.length) return arr;

  var temp = arr[iTo];
  arr[iTo] = arr[iFrom];
  arr[iFrom] = temp;
  return arr;
}

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
    var movePlayerUp = this._movePlayerUp;
    var movePlayerDown = this._movePlayerDown;
    var moveToAvailable = this._moveToAvailable;

    return (
      <GolfDraftPanel heading='Auto Picking'>
        {!isAutoPick || _.isEmpty(autoPickOrder) ? null : (
          <p>Next pick will be: <b>{GolferStore.getGolfer(autoPickOrder[0]).name}</b></p>
        )}
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
                    <li key={g}>
                      {GolferStore.getGolfer(g).name}
                      <span> </span>
                      <a data-golfer={g} href='#' onClick={movePlayerUp}>Up</a>
                      <span> </span>
                      <a data-golfer={g} href='#' onClick={movePlayerDown}>Down</a>
                      <span> </span>
                      <a data-golfer={g} href='#' onClick={moveToAvailable}>X</a>
                    </li>
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
                        data-golfer={g}
                        href='#'
                        onClick={moveToPickOrder}
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

  _moveToPickOrder: function (ev) {
    var g = getGolferFromClickEvent(ev);
    var autoPickOrder = this.props.autoPickOrder.concat([g]);
    AutoPickActions.setAutoPickOrder(autoPickOrder);
  },

  _moveToAvailable: function (ev) {
    var g = getGolferFromClickEvent(ev);
    var autoPickOrder = _.without(this.props.autoPickOrder, g);
    AutoPickActions.setAutoPickOrder(autoPickOrder);
  },

  _movePlayerUp: function (ev) {
    var g = getGolferFromClickEvent(ev);
    var index = _.indexOf(this.props.autoPickOrder, g);

    var autoPickOrder = safeSwap(this.props.autoPickOrder, index, index - 1);
    AutoPickActions.setAutoPickOrder(autoPickOrder);
  },

  movePlayerDown: function (ev) {
    var g = getGolferFromClickEvent(ev);
    var index = _.indexOf(this.props.autoPickOrder, g);

    var autoPickOrder = safeSwap(this.props.autoPickOrder, index, index + 1);
    AutoPickActions.setAutoPickOrder(autoPickOrder);
  }

});

module.exports = AutoPicker;
