"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const AppPausedStatus_1 = require("./AppPausedStatus");
const Assets_1 = require("../constants/Assets");
const ChatRoom_1 = require("./ChatRoom");
const DraftChooser_1 = require("./DraftChooser");
const DraftClock_1 = require("./DraftClock");
const DraftHistory_1 = require("./DraftHistory");
const DraftPickOrderView_1 = require("./DraftPickOrderView");
const DraftStatus_1 = require("./DraftStatus");
const GolfDraftPanel_1 = require("./GolfDraftPanel");
const PickListEditor_1 = require("./PickListEditor");
const react_router_1 = require("react-router");
const myTurnSound = new Audio(Assets_1.default.MY_TURN_SOUND);
const pickMadeSound = new Audio(Assets_1.default.PICK_MADE_SOUND);
class DraftApp extends React.Component {
    constructor(props) {
        super(props);
        this._onDraftHistorySelectionChange = (userId) => {
            this.setState({ draftHistoryUserId: userId });
        };
        this.state = { draftHistoryUserId: null };
    }
    componentWillReceiveProps(nextProps) {
        const props = this.props;
        if (!props.isMyDraftPick && nextProps.isMyDraftPick) {
            myTurnSound.play();
        }
        else if (props.draftPicks.length + 1 === nextProps.draftPicks.length) {
            pickMadeSound.play();
        }
    }
    _renderPickListHeader() {
        return (React.createElement("span", null,
            React.createElement("span", null, "Pick List Editor"),
            React.createElement("span", { className: 'pull-right' },
                React.createElement("em", null, "NEW!"))));
    }
    _renderPreDraft() {
        return (React.createElement("section", null,
            React.createElement("div", { className: 'row' },
                React.createElement("div", { className: 'col-md-12' },
                    React.createElement("div", { className: 'jumbotron' },
                        React.createElement("h1", null, "Draft not started."),
                        React.createElement("em", null,
                            "New feature: ",
                            React.createElement("a", { href: '#InlinePickListEditor' }, "Set up your pick list beforehand"))))),
            React.createElement("div", { className: 'row' },
                React.createElement("div", { className: 'col-md-12' },
                    React.createElement("a", { id: 'InlinePickListEditor' }),
                    React.createElement(GolfDraftPanel_1.default, { heading: this._renderPickListHeader() },
                        React.createElement(PickListEditor_1.default, { preDraftMode: true, golfersRemaining: this.props.golfersRemaining, syncedPickList: this.props.syncedPickList, pendingPickList: this.props.pendingPickList, height: '30em' })))),
            React.createElement("div", { className: 'row' },
                React.createElement("div", { className: 'col-md-12' },
                    React.createElement(ChatRoom_1.default, { currentUser: this.props.currentUser, messages: this.props.chatMessages, activeUsers: this.props.activeUsers })))));
    }
    _renderDraftComplete() {
        return (React.createElement("section", null,
            React.createElement("div", { className: "row" },
                React.createElement("div", { className: 'col-md-12' },
                    React.createElement("div", { className: 'jumbotron' },
                        React.createElement("h1", null, "The draft is over!"),
                        React.createElement("p", null,
                            React.createElement(react_router_1.Link, { to: '/' }, "Check out the live leaderboard"))))),
            React.createElement("div", { className: 'row' },
                React.createElement("div", { className: 'col-md-12' },
                    React.createElement(ChatRoom_1.default, { currentUser: this.props.currentUser, messages: this.props.chatMessages, activeUsers: this.props.activeUsers }))),
            React.createElement("div", { className: 'row' },
                React.createElement("div", { className: 'col-md-12' },
                    React.createElement(DraftHistory_1.default, { draftPicks: this.props.draftPicks, selectedUserId: this.state.draftHistoryUserId, onSelectionChange: this._onDraftHistorySelectionChange })))));
    }
    render() {
        if (!this.props.draftHasStarted) {
            return this._renderPreDraft();
        }
        const isDraftComplete = !this.props.currentPick;
        if (isDraftComplete) {
            return this._renderDraftComplete();
        }
        const isMyPick = this.props.isMyDraftPick;
        const isDraftPaused = this.props.isPaused;
        return (React.createElement("div", null,
            isDraftPaused ? (React.createElement(AppPausedStatus_1.default, null)) : (React.createElement("div", { className: 'row' },
                React.createElement("div", { className: 'col-md-9' }, !isMyPick ? (React.createElement(GolfDraftPanel_1.default, { heading: 'Draft Status' },
                    React.createElement(DraftStatus_1.default, { currentPick: this.props.currentPick }))) : (React.createElement(DraftChooser_1.default, { currentUser: this.props.currentUser, golfersRemaining: this.props.golfersRemaining, currentPick: this.props.currentPick, syncedPickList: this.props.syncedPickList }))),
                React.createElement("div", { className: 'col-md-3' },
                    React.createElement(DraftClock_1.default, { draftPicks: this.props.draftPicks, isMyPick: this.props.isMyDraftPick, allowClock: this.props.allowClock })))),
            React.createElement("div", { className: 'row' },
                React.createElement("div", { className: 'col-md-4' },
                    React.createElement(GolfDraftPanel_1.default, { heading: 'Draft Order' },
                        React.createElement("a", { id: 'InlineDraftPickListEditor' }),
                        React.createElement(DraftPickOrderView_1.default, { currentUser: this.props.currentUser, currentPick: this.props.currentPick, pickingForUsers: this.props.pickingForUsers, autoPickUsers: this.props.autoPickUsers, onUserSelected: this._onDraftHistorySelectionChange }))),
                React.createElement("div", { className: 'col-md-8' },
                    React.createElement(GolfDraftPanel_1.default, { heading: this._renderPickListHeader() },
                        React.createElement(PickListEditor_1.default, { golfersRemaining: this.props.golfersRemaining, syncedPickList: this.props.syncedPickList, pendingPickList: this.props.pendingPickList, height: '29em' })))),
            React.createElement("div", { className: 'row' },
                React.createElement("div", { className: 'col-md-12' },
                    React.createElement(ChatRoom_1.default, { currentUser: this.props.currentUser, messages: this.props.chatMessages, activeUsers: this.props.activeUsers }))),
            React.createElement("div", { className: 'row' },
                React.createElement("div", { className: 'col-md-12' },
                    React.createElement(DraftHistory_1.default, { draftPicks: this.props.draftPicks, selectedUserId: this.state.draftHistoryUserId, onSelectionChange: this._onDraftHistorySelectionChange })))));
    }
}
exports.default = DraftApp;
;
