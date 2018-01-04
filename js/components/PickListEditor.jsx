"use strict";

const _ = require("lodash");
const DraftActions = require("../actions/DraftActions");
const FreeTextPickListEditor = require("./FreeTextPickListEditor.jsx");
const GolferLogic = require("../logic/GolferLogic");
const GolferStore = require("../stores/GolferStore");
const React = require("react");

const PickListEditor = React.createClass({

  getInitialState: function () {
    return {
      draggingIndex: null,
      draggingHoverIndex: null,
      isFreeTextMode: false
    };
  },

  render: function () {
    let priority = this._getPriority();
    if (!priority) {
      return this._renderLoading();
    }

    if (this.state.isFreeTextMode) {
      return (<FreeTextPickListEditor onCancel={this._onFreeTextComplete} onComplete={this._onFreeTextComplete} />);
    }

    const draggingIndex = this.state.draggingIndex;
    const draggingHoverIndex = this.state.draggingHoverIndex;
    const draggingGolferId = priority[draggingIndex];
    const unsavedChanges = this.props.syncedPriority !== priority;
    const preDraftMode = !!this.props.preDraftMode;

    if (draggingHoverIndex != null) {
      priority = this._newOrder(draggingIndex, draggingHoverIndex);
    }

    return (
      <section>

        <p>
          <span className="hidden-xs">
            <small><b>Tip:</b> drag and drop players to make one-off changes to your list</small><br />
          </span>
          <small><b>Pro Tip:</b> use the "Paste list" button to paste in a list of golfers (one line per golfer)</small>
        </p>

        <div className="row" style={{marginBottom: "1em"}}>
          <div className="col-md-12">
            {!preDraftMode ? null : (
              <span>
                <button
                  className="btn btn-default"
                  disabled={unsavedChanges} 
                  type="button"
                  onClick={this._onFreeTextClick}
                >Paste list</button>
              </span>
            )}
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
            {!unsavedChanges ? null : (
              <p><small>* Unsaved changes</small></p>
            )}
          </div>
        </div>
        <div className="row" style={{
          height: this.props.height || "100%",
          overflowY: "scroll"
        }}>
          <div className="col-md-12">
            <table className="table table-condensed table-striped">
              <thead></thead>
              <tbody>
                {_.map(priority, function (gid, i) {
                  const g = GolferStore.getGolfer(gid);
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

      </section>
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
    const currentOrder = this._getPriority();
    const movingGolfer = currentOrder[fromIndex];
    const newOrder = currentOrder.slice();
    newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movingGolfer);
    return newOrder;
  },

  _onUpOne: function (i, e) {
    e.preventDefault();
    const newOrder = this._newOrder(i, i - 1);
    DraftActions.updatePendingPriority(newOrder);
  },

  _onDownOne: function (i, e) {
    e.preventDefault();
    const newOrder = this._newOrder(i, i + 1);
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

    const fromIndex = this.state.draggingIndex;
    const newOrder = this._newOrder(fromIndex, toIndex);

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
