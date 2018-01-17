'use strict';

const _ = require("lodash");
const AppConstants = require('../constants/AppConstants');
const DraftActions = require("../actions/DraftActions");
const FreeTextPickListEditor = require("./FreeTextPickListEditor");
const GolferLogic = require("../logic/GolferLogic");
const GolferStore = require("../stores/GolferStore");
const React = require("react");

class PickListEditor extends React.Component {

  constructor(props) {
    super(props);
    this.state = this._getInitialState();
  }

  _getInitialState() {
    return {
      draggingIndex: null,
      draggingHoverIndex: null,
      isFreeTextMode: false
    };
  }

  render() {
    if (this.props.syncedPickList == AppConstants.PROPERTY_LOADING) {
      return this._renderLoading();
    }

    if (this.state.isFreeTextMode) {
      return (
        <FreeTextPickListEditor
          onCancel={this._onFreeTextComplete}
          onComplete={this._onFreeTextComplete}
        />
      );
    }

    let pickList = this._getDisplayPickList();

    const hasPickListList = !_.isEmpty(this.props.syncedPickList);
    const draggingIndex = this.state.draggingIndex;
    const draggingHoverIndex = this.state.draggingHoverIndex;
    const unsavedChanges = this.props.syncedPickList !== this.props.pendingPickList;
    const preDraftMode = !!this.props.preDraftMode;
    const draggingGolferId = _.isNumber(draggingIndex) ? pickList[draggingIndex] : null;

    if (_.isNumber(draggingHoverIndex)) {
      pickList = this._newOrder(draggingIndex, draggingHoverIndex);
    }

    return (
      <section>

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
            {hasPickListList ? null : (
              <p><small><b>Note:</b> You have not set a pick list, so we default to WGR.</small></p>
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
                {_.map(pickList, function (gid, i) {
                  const g = GolferStore.getGolfer(gid);
                  return (
                    <tr
                      key={g._id}
                      className={!draggingGolferId || draggingGolferId !== g._id ? "" : "info"}
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
                          {this._renderArrowLink("glyphicon-arrow-down", this._onDownOne.bind(this, i), i + 1 === pickList.length)}
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
  }

  _renderArrowLink(arrowClass, onClick, isDisabled) {
    if (isDisabled) {
      return (<span className={"text-muted glyphicon " + arrowClass} />);
    }
    return (
      <a href="#" onClick={onClick}>
        <span className={"glyphicon " + arrowClass} />
      </a>
    );
  }

  _renderLoading() {
    return (<span>Loading...</span>);
  }

  _getDisplayPickList() {
    const pendingPickList = this.props.pendingPickList;
    if (pendingPickList === AppConstants.PROPERTY_LOADING) return pendingPickList;

    return !_.isEmpty(pendingPickList) ? pendingPickList : _.chain(this.props.golfersRemaining)
      .sortBy(['wgr', 'name'])
      .pluck('_id')
      .value();
  }

  _newOrder(fromIndex, toIndex) {
    const currentOrder = this._getDisplayPickList();
    const movingGolfer = currentOrder[fromIndex];
    const newOrder = currentOrder.slice();
    newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movingGolfer);
    return newOrder;
  }

  _onUpOne = (i, e) => {
    e.preventDefault();
    const newOrder = this._newOrder(i, i - 1);
    DraftActions.updatePendingPickList(newOrder);
  }

  _onDownOne = (i, e) => {
    e.preventDefault();
    const newOrder = this._newOrder(i, i + 1);
    DraftActions.updatePendingPickList(newOrder);
  }

  _onReset = () => {
    DraftActions.resetPendingPickList();
  }

  _onSave = () => {
    DraftActions.savePickList();
  }

  _onDrop = (toIndex, e) => {
    e.preventDefault();

    const fromIndex = this.state.draggingIndex;
    const newOrder = this._newOrder(fromIndex, toIndex);

    DraftActions.updatePendingPickList(newOrder);
  }

  _onDragStart = (i, e) => {
    this.setState({ draggingIndex: i });
  }

  _onDragEnd = (e) => {
    this.setState({
      draggingIndex: null,
      draggingHoverIndex: null
    });
  }

  _onDragOver = (i, e) => {
    e.preventDefault();
    if (this.state.draggingHoverIndex !== i) {
      this.setState({ draggingHoverIndex: i });
    }
  }

  _onFreeTextClick = () => {
    this.setState({ isFreeTextMode: true });
    window.location.href = '#InlinePickListEditor';
  }

  _onFreeTextComplete = () => {
    this.setState({ isFreeTextMode: false });
    window.location.href = '#InlinePickListEditor';
  }

};

module.exports = PickListEditor;
