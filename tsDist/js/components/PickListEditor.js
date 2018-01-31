"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const React = require("react");
const DraftActions_1 = require("../actions/DraftActions");
const FreeTextPickListEditor_1 = require("./FreeTextPickListEditor");
const GolferLogic_1 = require("../logic/GolferLogic");
const GolferStore_1 = require("../stores/GolferStore");
class PickListEditor extends React.Component {
    constructor(props) {
        super(props);
        this._onUpOne = (i, e) => {
            e.preventDefault();
            const newOrder = this._newOrder(i, i - 1);
            DraftActions_1.default.updatePendingPickList(newOrder);
        };
        this._onDownOne = (i, e) => {
            e.preventDefault();
            const newOrder = this._newOrder(i, i + 1);
            DraftActions_1.default.updatePendingPickList(newOrder);
        };
        this._onReset = () => {
            DraftActions_1.default.resetPendingPickList();
        };
        this._onSave = () => {
            DraftActions_1.default.savePickList();
        };
        this._onDrop = (toIndex, e) => {
            e.preventDefault();
            const fromIndex = this.state.draggingIndex;
            const newOrder = this._newOrder(fromIndex, toIndex);
            DraftActions_1.default.updatePendingPickList(newOrder);
        };
        this._onDragStart = (i, e) => {
            this.setState({ draggingIndex: i });
        };
        this._onDragEnd = (e) => {
            this.setState({
                draggingIndex: null,
                draggingHoverIndex: null
            });
        };
        this._onDragOver = (i, e) => {
            e.preventDefault();
            if (this.state.draggingHoverIndex !== i) {
                this.setState({ draggingHoverIndex: i });
            }
        };
        this._onFreeTextClick = () => {
            this.setState({ isFreeTextMode: true });
            window.location.href = '#InlinePickListEditor';
        };
        this._onFreeTextComplete = () => {
            this.setState({ isFreeTextMode: false });
            window.location.href = '#InlinePickListEditor';
        };
        this.state = {
            draggingIndex: null,
            draggingHoverIndex: null,
            isFreeTextMode: false
        };
    }
    render() {
        if (!_.isArray(this.props.syncedPickList)) {
            return this._renderLoading();
        }
        if (this.state.isFreeTextMode) {
            return (React.createElement(FreeTextPickListEditor_1.default, { onCancel: this._onFreeTextComplete, onComplete: this._onFreeTextComplete }));
        }
        let pickList = this._getDisplayPickList();
        const hasPickListList = !_.isEmpty(this.props.syncedPickList);
        const draggingIndex = this.state.draggingIndex;
        const draggingHoverIndex = this.state.draggingHoverIndex;
        const unsavedChanges = this.props.syncedPickList !== this.props.pendingPickList;
        const preDraftMode = this.props.preDraftMode;
        const draggingGolferId = _.isNumber(draggingIndex) ? pickList[draggingIndex] : null;
        if (_.isNumber(draggingHoverIndex)) {
            pickList = this._newOrder(draggingIndex, draggingHoverIndex);
        }
        return (React.createElement("section", null,
            React.createElement("div", { className: "row", style: { marginBottom: "1em" } },
                React.createElement("div", { className: "col-md-12" },
                    !preDraftMode ? null : (React.createElement("span", null,
                        React.createElement("button", { className: "btn btn-default", disabled: unsavedChanges, type: "button", onClick: this._onFreeTextClick }, "Paste list"))),
                    React.createElement("span", { className: "pull-right" },
                        React.createElement("button", { className: "btn btn-default", disabled: !unsavedChanges, type: "button", onClick: this._onReset }, "Reset"),
                        React.createElement("span", null, " "),
                        React.createElement("button", { className: "btn btn-default btn-primary", disabled: !unsavedChanges, type: "button", onClick: this._onSave }, "Save")),
                    !unsavedChanges ? null : (React.createElement("p", null,
                        React.createElement("small", null, "* Unsaved changes"))),
                    hasPickListList ? null : (React.createElement("p", null,
                        React.createElement("small", null,
                            React.createElement("b", null, "Note:"),
                            " You have not set a pick list, so we default to WGR."))))),
            React.createElement("div", { className: "row", style: {
                    height: this.props.height || "100%",
                    overflowY: "scroll"
                } },
                React.createElement("div", { className: "col-md-12" },
                    React.createElement("table", { className: "table table-condensed table-striped" },
                        React.createElement("thead", null),
                        React.createElement("tbody", null, _.map(pickList, (gid, i) => {
                            const g = GolferStore_1.default.getGolfer(gid);
                            return (React.createElement("tr", { key: g._id, className: !draggingGolferId || draggingGolferId !== g._id ? "" : "info" },
                                React.createElement("td", { draggable: true, onDragStart: this._onDragStart.bind(this, i), onDrop: this._onDrop.bind(this, i), onDragEnd: this._onDragEnd, onDragOver: this._onDragOver.bind(this, i) },
                                    React.createElement("span", { className: "hidden-xs" },
                                        React.createElement("span", { className: "hidden-xs glyphicon glyphicon-menu-hamburger text-muted" }),
                                        "\u00A0\u00A0",
                                        i + 1,
                                        ".\u00A0\u00A0",
                                        GolferLogic_1.default.renderGolfer(g)),
                                    React.createElement("span", { className: "visible-xs" },
                                        this._renderArrowLink("glyphicon-arrow-up", this._onUpOne.bind(this, i), i === 0),
                                        React.createElement("span", null, "\u00A0"),
                                        this._renderArrowLink("glyphicon-arrow-down", this._onDownOne.bind(this, i), i + 1 === pickList.length),
                                        "\u00A0\u00A0",
                                        i + 1,
                                        ".\u00A0\u00A0",
                                        GolferLogic_1.default.renderGolfer(g)))));
                        })))))));
    }
    _renderArrowLink(arrowClass, onClick, isDisabled) {
        if (isDisabled) {
            return (React.createElement("span", { className: "text-muted glyphicon " + arrowClass }));
        }
        return (React.createElement("a", { href: "#", onClick: onClick },
            React.createElement("span", { className: "glyphicon " + arrowClass })));
    }
    _renderLoading() {
        return (React.createElement("span", null, "Loading..."));
    }
    _getDisplayPickList() {
        const pendingPickList = this.props.pendingPickList;
        return !_.isEmpty(pendingPickList) ? pendingPickList : _.chain(this.props.golfersRemaining)
            .sortBy(['wgr', 'name'])
            .map('_id')
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
}
exports.default = PickListEditor;
;
