"use strict";

var _ = require("lodash");
var GolferStore = require("../stores/GolferStore");
var React = require("react");

var PickListEditor = React.createClass({

  getInitialState: function () {
    return {
      draggingIndex: null,
      tempTempPriorityOrder: _.chain(this.props.golfers)
        .values()
        .sortBy('wgr')
        .value()  
    };
  },

  render: function () {
    var golfers = this.props.golfers;
    var draggingIndex = this.state.draggingIndex;
    var golfers = this.state.tempTempPriorityOrder;
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
                    className={draggingIndex != i ? "" : "info"}
                    draggable
                    onDragStart={this._onDragStart.bind(this, i)}
                    onDragEnd={this._onDragEnd}
                    onDragOver={this._onDragOver}
                    onDrop={this._onDrop.bind(this, i)}
                  ><td>{g.name}</td></tr>
                );
              }, this)}
            </tbody>
          </table>
        </div>
      </div>
    );
  },

  _onDrop: function (toIndex, e) {
    e.preventDefault();

    var currentOrder = this.state.tempTempPriorityOrder;
    var fromIndex = this.state.draggingIndex;
    var movingGolfer = currentOrder[fromIndex];

    var newOrder = currentOrder.slice();
    newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movingGolfer);

    this.setState({
      draggingIndex: null,
      tempTempPriorityOrder: newOrder
    });
  },

  _onDragStart: function (i, e) {
    this.setState({ draggingIndex: i });
  },

  _onDragEnd: function (e) {
    this.setState({ draggingIndex: null });
  },

  _onDragOver: function (e) {
    e.preventDefault();
  }

});

module.exports = PickListEditor;
