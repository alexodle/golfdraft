/** @jsx React.DOM */
'use strict';

var _ = require('lodash');
var AutoPickActions = require('../actions/AutoPickActions');
var GolfDraftPanel = require('./GolfDraftPanel.jsx');
var GolferStore = require('../stores/GolferStore');
var React = require('react');
var ReactDnd = require('react-dnd');

var DropTarget = ReactDnd.DropTarget;
var DragSource = ReactDnd.DragSource;

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

var GolferDnd = React.createClass({

  render: function () {
    var connectDragSource = this.props.connectDragSource;
    var connectDropTarget = this.props.connectDropTarget;
    return connectDragSource(connectDropTarget(
      <li className='list-group-item'>
        {GolferStore.getGolfer(this.props.id).name}
      </li>
    ));
  }

});

GolferDnd = DropTarget('golferdnd', {
  hover: function (props, monitor) {
    var draggedId = monitor.getItem().id;
    if (draggedId !== props.id) {
      props.onGolferMove(draggedId, props.id);
    }
  }
}, function (connect) {
  return {
    connectDropTarget: connect.dropTarget()
  }
})(GolferDnd);

GolferDnd = DragSource('golferdnd', {
  beginDrag: function (props) {
    return { id: props.id };
  }
}, function (connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  }
})(GolferDnd);


var AutoPickerEditor = React.createClass({

  render: function () {
    var golfersRemaining = _.chain(this.props.golfersRemaining)
      .sortBy('wgr')
      .pluck('id')
      .value();

    var isAutoPick = this.props.isAutoPick;
    var autoPickOrder = _.intersection(this.props.autoPickOrder, golfersRemaining);
    var golfersAvailable = _.difference(golfersRemaining, autoPickOrder);

    var moveToPickOrder = this._moveToPickOrder;
    var moveToAvailable = this._moveToAvailable;

    var onGolferMove = this._onGolferMove;

    return (
      <div className='row'>

        <div className='col-md-6'>
          <GolfDraftPanel heading='Pick Order'>
            <ol className='list-group'>
              {_.map(autoPickOrder, function (g) {
                /*<li key={g}>
                  {GolferStore.getGolfer(g).name}
                  <span> </span>
                  <a data-golfer={g} href='#' onClick={movePlayerUp}>Up</a>
                  <span> </span>
                  <a data-golfer={g} href='#' onClick={movePlayerDown}>Down</a>
                  <span> </span>
                  <a data-golfer={g} href='#' onClick={moveToAvailable}>X</a>
                </li>*/
                return (
                  <GolferDnd key={g} id={g} onGolferMove={onGolferMove} />
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
    );
  },

  _setIsAutoPick: function (ev) {
    AutoPickActions.setIsAutoPick(ev.target.checked);
  },

  _onGolferMove: function (golferId, afterGolferId) {
    var autoPickOrder = this.props.autoPickOrder;

    var index = _.indexOf(autoPickOrder, golferId);
    var afterIndex = _.indexOf(autoPickOrder, afterGolferId);

    autoPickOrder.splice(index, 1);
    autoPickOrder.splice(afterIndex, 0, golferId);

    AutoPickActions.setAutoPickOrder(autoPickOrder);
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
  }

});


var AutoPicker = React.createClass({

  getInitialState: function () {
    return { isEditing: false };
  },

  render: function () {
    var props = this.props;
    var isAutoPick = props.isAutoPick;

    var isEditing = this.state.isEditing;

    var editor = !isEditing ? null : (
      <AutoPickerEditor
        golfersRemaining={props.golfersRemaining}
        autoPickOrder={props.autoPickOrder}
      />
    );

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

        <a href='#' onClick={this._toggleEdit}>
          {!isEditing ? 'Edit' : 'Hide'}
        </a>

        {editor}

      </GolfDraftPanel>
    );
  },

  _toggleEdit: function (ev) {
    ev.preventDefault();
    this.setState({ isEditing: !this.state.isEditing });
  }

});

module.exports = AutoPicker;
