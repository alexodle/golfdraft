"use strict";

var _ = require("lodash");
var DraftActions = require("../actions/DraftActions");
var FreeTextPickListEditor = require("./FreeTextPickListEditor.jsx");
var GolferLogic = require("../logic/GolferLogic");
var GolferStore = require("../stores/GolferStore");
var React = require("react");

var PickListEditor = React.createClass({

  getInitialState: function () {
    return {
      draggingIndex: null,
      draggingHoverIndex: null,
      isFreeTextMode: false
    };
  },

  render: function () {
    var priority = this._getPriority();
    if (!priority) {
      return this._renderLoading();
    }

    if (this.state.isFreeTextMode) {
      return (<FreeTextPickListEditor onCancel={this._onFreeTextComplete} onComplete={this._onFreeTextComplete} />);
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
          <div className="col-md-12">
            <span>
              <button
                className="btn btn-default"
                type="button"
                onClick={this._onFreeTextClick}
              >Paste list</button>
            </span>
            <span className="pull-right">
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

                        <span className="hidden-xs">
                          <span className="hidden-xs glyphicon glyphicon-menu-hamburger text-muted" />
                          &nbsp;&nbsp;{i+1}.&nbsp;&nbsp;{GolferLogic.renderGolfer(g)}
                        </span>
                        
                        <span className="visible-xs">
                          {this._renderArrowLink("glyphicon-arrow-up", this._onUpOne.bind(this, i), i === 0)}
                          <span>&nbsp;</span>
                          {this._renderArrowLink("glyphicon-arrow-down", this._onDownOne.bind(this, i), i + 1 === priority.length)}
                          &nbsp;&nbsp;{i+1}.&nbsp;&nbsp;{GolferLogic.renderGolfer(g)}
                        </span>

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

  _renderArrowLink: function (arrowClass, onClick, isDisabled) {
    if (isDisabled) {
      return (<span className={"text-muted glyphicon " + arrowClass} />);
    }
    return (
      <a href="#" onClick={onClick}>
        <span className={"glyphicon " + arrowClass} />
      </a>
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

  _onUpOne: function (i, e) {
    e.preventDefault();
    var newOrder = this._newOrder(i, i - 1);
    DraftActions.updatePendingPriority(newOrder);
  },

  _onDownOne: function (i, e) {
    e.preventDefault();
    var newOrder = this._newOrder(i, i + 1);
    DraftActions.updatePendingPriority(newOrder);
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
  },

  _onFreeTextClick: function () {
    this.setState({ isFreeTextMode: true });
  },

  _onFreeTextComplete: function () {
    this.setState({ isFreeTextMode: false });
  }

});

module.exports = PickListEditor;
