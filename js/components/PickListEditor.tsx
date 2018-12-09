import {isArray, isEmpty, isNumber} from 'lodash';
import * as React from 'react';
import DraftActions from '../actions/DraftActions';
import FreeTextPickListEditor from './FreeTextPickListEditor';
import GolferLogic from '../logic/GolferLogic';
import GolferStore from '../stores/GolferStore';
import {IndexedGolfers} from '../types/ClientTypes';

export interface PickListEditorProps {
  syncedPickList: string[];
  pendingPickList: string[];
  preDraftMode?: boolean;
  height?: string;
  golfersRemaining: IndexedGolfers;
}

interface PickListEditorState {
  draggingIndex?: number;
  draggingHoverIndex?: number;
  isFreeTextMode: boolean;
}

export default class PickListEditor extends React.Component<PickListEditorProps, PickListEditorState> {

  constructor(props) {
    super(props);
    this.state = {
      draggingIndex: null,
      draggingHoverIndex: null,
      isFreeTextMode: false
    };
  }

  render() {
    if (!isArray(this.props.syncedPickList)) {
      return this._renderLoading();
    }

    const hasPickList = !isEmpty(this.props.pendingPickList);
    if (this.state.isFreeTextMode || !hasPickList) {
      return (
        <FreeTextPickListEditor
          onCancel={hasPickList ? this._onFreeTextComplete : null}
          onComplete={this._onFreeTextComplete}
        />
      );
    }

    let pickList = this.props.pendingPickList;

    const draggingIndex = this.state.draggingIndex;
    const draggingHoverIndex = this.state.draggingHoverIndex;
    const unsavedChanges = this.props.syncedPickList !== this.props.pendingPickList;
    const preDraftMode = this.props.preDraftMode;
    const draggingGolferId = isNumber(draggingIndex) ? pickList[draggingIndex] : null;

    if (isNumber(draggingHoverIndex)) {
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
                {pickList.map((gid, i) => {
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
                })}
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

  _newOrder(fromIndex, toIndex) {
    const currentOrder = this.props.pendingPickList;
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
