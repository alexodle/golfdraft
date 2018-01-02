"use strict";

var _ = require("lodash");
var DraftActions = require("../actions/DraftActions");
var GolferLogic = require("../logic/GolferLogic");
var GolferStore = require("../stores/GolferStore");
var React = require("react");

var PickListEditor = React.createClass({

  getInitialState: function () {
    return {
      draggingIndex: null,
      draggingHoverIndex: null
    };
  },

  render: function () {
    var priority = this._getPriority();
    if (!priority) {
      return this._renderLoading();
    }

    var draggingIndex = this.state.draggingIndex;
    var draggingHoverIndex = this.state.draggingHoverIndex;
    var draggingGolferId = priority[draggingIndex];
    var unsavedChanges = this.props.syncedPriority !== priority;

    if (draggingHoverIndex != null) {
      priority = this._newOrder(draggingIndex, draggingHoverIndex);
    }

    return (
      <div>
        <div className="row" style={{marginBottom: "1em"}}>
          <div className="col-md-12 text-right">
            <span>
              <button
                className="btn btn-default"
                disabled={!unsavedChanges} 
                type="button"
                onClick={this._onReset}
              >Reset</button>
              <span> </span>
              <button
                className="btn btn-default btn-primary"
                disabled={!unsavedChanges}
                type="button"
                onClick={this._onSave}
              >Save</button>
            </span>
          </div>
        </div>
        <div className="row" style={{
          height: this.props.height || "100%",
          overflowY: "scroll"
        }}>
          <div className="col-md-12">
            {!unsavedChanges ? null : (
              <small>* Unsaved changes</small>
            )}
            <table className="table table-condensed table-striped">
              <thead></thead>
              <tbody>
                {_.map(priority, function (gid, i) {
                  var g = GolferStore.getGolfer(gid);
                  return (
                    <tr
                      key={g.id}
                      className={!draggingGolferId || draggingGolferId !== g.id ? "" : "info"}
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
                        {GolferLogic.renderGolfer(g)}
                      </td>
                    </tr>
                  );
                }, this)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  },

  _renderLoading: function () {
    return (<span>Loading...</span>);
  },

  _getPriority: function () {
    return this.props.pendingPriority;
  },

  _newOrder: function (fromIndex, toIndex) {
    var currentOrder = this._getPriority();
    var movingGolfer = currentOrder[fromIndex];
    var newOrder = currentOrder.slice();
    newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movingGolfer);
    return newOrder;
  },

  _onReset: function () {
    DraftActions.resetPendingPriority();
  },

  _onSave: function () {
    DraftActions.savePriority();
  },

  _onDrop: function (toIndex, e) {
    e.preventDefault();

    var fromIndex = this.state.draggingIndex;
    var newOrder = this._newOrder(fromIndex, toIndex);

    DraftActions.updatePendingPriority(newOrder);
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
