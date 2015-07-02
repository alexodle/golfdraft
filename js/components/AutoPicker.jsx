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
    var props = this.props;
    var connectDragSource = props.connectDragSource;
    var connectDropTarget = props.connectDropTarget;

    return connectDragSource(connectDropTarget(
      <li className='list-group-item'>
        {props.i + 1}. {GolferStore.getGolfer(this.props.id).name}
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
    var autoPickOrder = this.props.autoPickOrder;
    var onGolferMove = this._onGolferMove;
    return (
      <GolfDraftPanel heading='Pick Order'>
        <ol className='list-group'>
          {_.map(autoPickOrder, function (g, i) {
            return (
              <GolferDnd key={g} i={i} id={g} onGolferMove={onGolferMove} />
            );
          })}
        </ol>
      </GolfDraftPanel>
    );
  },

  _onGolferMove: function (golferId, afterGolferId) {
    var autoPickOrder = this.props.autoPickOrder;

    var index = _.indexOf(autoPickOrder, golferId);
    var afterIndex = _.indexOf(autoPickOrder, afterGolferId);

    autoPickOrder.splice(index, 1);
    autoPickOrder.splice(afterIndex, 0, golferId);

    AutoPickActions.setAutoPickOrder(autoPickOrder);
  }

});


var AutoPicker = React.createClass({

  getInitialState: function () {
    return { isEditing: false };
  },

  render: function () {
    var isEditing = this.state.isEditing;

    var props = this.props;
    var isAutoPick = props.isAutoPick;
    var golfersRemaining = props.golfersRemaining;
    var autoPickOrder = _.intersection(
      props.autoPickOrder,
      _.pluck(golfersRemaining, 'id')
    );

    var editor = !isEditing ? null : (
      <AutoPickerEditor
        golfersRemaining={golfersRemaining}
        autoPickOrder={autoPickOrder}
      />
    );

    return (
      <GolfDraftPanel heading='Auto Picking'>
        {(!isAutoPick || _.isEmpty(autoPickOrder)) ? null : (
          <p>Next pick will be: <b>{GolferStore.getGolfer(autoPickOrder[0]).name}</b></p>
        )}

        <div className='checkbox'>
          <label>
            <input type='checkbox' value={isAutoPick} onChange={this._setIsAutoPick} /> Auto-pick
          </label>
        </div>

        <a href='#' onClick={this._toggleEdit}>
          {!isEditing ? 'Edit Order' : 'Hide'}
        </a>

        {editor}

      </GolfDraftPanel>
    );
  },

  _toggleEdit: function (ev) {
    ev.preventDefault();
    this.setState({ isEditing: !this.state.isEditing });
  },

  _setIsAutoPick: function (ev) {
    AutoPickActions.setIsAutoPick(ev.target.checked);
  },

});

module.exports = AutoPicker;
