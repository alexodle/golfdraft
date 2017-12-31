"use strict";

var _ = require("lodash");
var GolferStore = require("../stores/GolferStore");
var React = require("react");

var PickListEditor = React.createClass({

  getInitialState: function () {
    return {
      draggingIndex: null,
      draggingHoverIndex: null,
      tempTempPriorityOrder: _.chain(this.props.golfers)
        .values()
        .sortBy('wgr')
        .value()
    };
  },

  render: function () {
    var draggingIndex = this.state.draggingIndex;
    var draggingHoverIndex = this.state.draggingHoverIndex;
    var golfers = this.state.tempTempPriorityOrder;
    var draggingGolfer = golfers[draggingIndex];

    if (draggingHoverIndex != null) {
      golfers = this._newOrder(draggingIndex, draggingHoverIndex);
    }

    return (
      <div className="row">
        <div className="col-md-12">
          <table className="table table-condensed table-striped">
            <thead></thead>
            <tbody>
              {_.map(golfers, function (g, i) {
                return (
                  <tr
                    key={g.id}
                    className={draggingGolfer == null || draggingGolfer.id !== g.id ? "" : "info"}
                  >
                    <td
                      draggable
                      onDragStart={this._onDragStart.bind(this, i)}
                      onDrop={this._onDrop.bind(this, i)}
                      onDragEnd={this._onDragEnd}
                      onDragOver={this._onDragOver.bind(this, i)}
                      onDragLeave={this._onDragLeave}
                    >
                      <span className="glyphicon glyphicon-menu-hamburger text-muted">&nbsp;&nbsp;</span>
                      <span>{i+1}.&nbsp;&nbsp;</span>
                      {g.name}
                    </td>
                  </tr>
                );
              }, this)}
            </tbody>
          </table>
        </div>
      </div>
    );
  },

  _newOrder: function (fromIndex, toIndex) {
    var currentOrder = this.state.tempTempPriorityOrder;
    var movingGolfer = currentOrder[fromIndex];
    var newOrder = currentOrder.slice();
    newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movingGolfer);
    return newOrder;
  },

  _onDrop: function (toIndex, e) {
    e.preventDefault();

    var fromIndex = this.state.draggingIndex;
    var newOrder = this._newOrder(fromIndex, toIndex);
    this.setState({
      draggingIndex: null,
      draggingHoverIndex: null,
      tempTempPriorityOrder: newOrder
    });
  },

  _onDragStart: function (i, e) {
    this.setState({ draggingIndex: i });
  },

  _onDragEnd: function (e) {
    this.setState({
      draggingIndex: null,
      draggingHoverIndex: null
    });
  },

  _onDragOver: function (i, e) {
    e.preventDefault();
    if (this.state.draggingHoverIndex !== i) {
      this.setState({ draggingHoverIndex: i });
    }
  }

});

module.exports = PickListEditor;
