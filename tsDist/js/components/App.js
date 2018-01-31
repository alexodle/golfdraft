"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const React = require("react");
const AdminApp_1 = require("./AdminApp");
const AppHeader_1 = require("./AppHeader");
const AppSettingsStore_1 = require("../stores/AppSettingsStore");
const ChatStore_1 = require("../stores/ChatStore");
const DraftApp_1 = require("./DraftApp");
const DraftStore_1 = require("../stores/DraftStore");
const GolferStore_1 = require("../stores/GolferStore");
const ScoreStore_1 = require("../stores/ScoreStore");
const TourneyApp_1 = require("./TourneyApp");
const TourneyStore_1 = require("../stores/TourneyStore");
const UserStore_1 = require("../stores/UserStore");
const WhoIsYou_1 = require("./WhoIsYou");
const react_router_dom_1 = require("react-router-dom");
const RELEVANT_STORES = [
    AppSettingsStore_1.default,
    ChatStore_1.default,
    DraftStore_1.default,
    ScoreStore_1.default,
    UserStore_1.default
];
function getAppState() {
    return {
        tourneyName: TourneyStore_1.default.getTourneyName(),
        currentUser: UserStore_1.default.getCurrentUser(),
        activeUsers: UserStore_1.default.getActive(),
        golfers: GolferStore_1.default.getAll(),
        users: UserStore_1.default.getAll(),
        draft: {
            isMyDraftPick: DraftStore_1.default.getIsMyDraftPick(),
            currentPick: DraftStore_1.default.getCurrentPick(),
            draftPicks: DraftStore_1.default.getDraftPicks(),
            pickingForUsers: DraftStore_1.default.getPickingForUsers(),
            syncedPickList: DraftStore_1.default.getPickList(),
            pendingPickList: DraftStore_1.default.getPendingPickList()
        },
        scores: ScoreStore_1.default.getScores(),
        lastScoresUpdate: ScoreStore_1.default.getLastUpdated(),
        chatMessages: ChatStore_1.default.getMessages(),
        isAdmin: UserStore_1.default.isAdmin(),
        isPaused: AppSettingsStore_1.default.getIsPaused(),
        allowClock: AppSettingsStore_1.default.getAllowClock(),
        draftHasStarted: AppSettingsStore_1.default.getDraftHasStarted(),
        autoPickUsers: AppSettingsStore_1.default.getAutoPickUsers()
    };
}
function getGolfersRemaining(golfers, draftPicks) {
    const pickedGolfers = _.map(draftPicks, 'golfer');
    const golfersRemaining = _.omit(golfers, pickedGolfers);
    return golfersRemaining;
}
class DraftWrapper extends React.Component {
    render() {
        const props = this.props;
        return (React.createElement("section", null,
            React.createElement(AppHeader_1.default, { tourneyName: props.tourneyName, currentUser: props.currentUser, drafting: true }),
            React.createElement(DraftApp_1.default, { currentUser: props.currentUser, currentPick: props.draft.currentPick, isMyDraftPick: props.draft.isMyDraftPick, draftPicks: props.draft.draftPicks, chatMessages: props.chatMessages, isPaused: props.isPaused, golfersRemaining: props.golfersRemaining, pickingForUsers: props.draft.pickingForUsers, activeUsers: props.activeUsers, allowClock: props.allowClock, syncedPickList: props.draft.syncedPickList, pendingPickList: props.draft.pendingPickList, draftHasStarted: props.draftHasStarted, autoPickUsers: props.autoPickUsers })));
    }
}
;
class TourneyWrapper extends React.Component {
    render() {
        const props = this.props;
        return (React.createElement("section", null,
            React.createElement(AppHeader_1.default, { tourneyName: props.tourneyName, currentUser: props.currentUser }),
            React.createElement(TourneyApp_1.default, { currentUser: props.currentUser, scores: props.scores, draft: props.draft, lastScoresUpdate: props.lastScoresUpdate, chatMessages: props.chatMessages, activeUsers: props.activeUsers })));
    }
}
;
class AdminWrapper extends React.Component {
    render() {
        const props = this.props;
        return (React.createElement("section", null,
            React.createElement(AppHeader_1.default, { tourneyName: props.tourneyName, currentUser: props.currentUser }),
            React.createElement(AdminApp_1.default, { isAdmin: props.isAdmin, currentPick: props.draft.currentPick, draftPicks: props.draft.draftPicks, isPaused: props.isPaused, allowClock: props.allowClock, draftHasStarted: props.draftHasStarted, users: props.users, autoPickUsers: props.autoPickUsers })));
    }
}
;
class AppNode extends React.Component {
    constructor(props) {
        super(props);
        this._onChange = () => {
            this.setState(getAppState());
        };
        this.state = this._getInitialState();
    }
    _getInitialState() {
        return getAppState();
    }
    componentDidMount() {
        _.each(RELEVANT_STORES, (s) => {
            s.addChangeListener(this._onChange);
        });
    }
    componentWillUnmount() {
        _.each(RELEVANT_STORES, (s) => {
            s.removeChangeListener(this._onChange);
        });
    }
    _requireCurrentUser(from) {
        if (!this.state.currentUser) {
            return (React.createElement(react_router_dom_1.Redirect, { to: { pathname: '/whoisyou', state: { from: from } } }));
        }
    }
    _requireDraftComplete(from) {
        if (this.state.draft.currentPick) {
            return (React.createElement(react_router_dom_1.Redirect, { to: { pathname: '/draft', state: { from: from } } }));
        }
    }
    render() {
        const state = this.state;
        // Calculated here since it's used in multiple places
        const golfersRemaining = getGolfersRemaining(state.golfers, state.draft.draftPicks);
        const renderTourneyWrapper = (props) => {
            return this._requireCurrentUser(props.location.pathname) || this._requireDraftComplete(props.location) || (React.createElement(TourneyWrapper, Object.assign({}, props, state, { golfersRemaining: golfersRemaining })));
        };
        const renderDraftWrapper = (props) => {
            return this._requireCurrentUser(props.location.pathname) || (React.createElement(DraftWrapper, Object.assign({}, props, state, { golfersRemaining: golfersRemaining })));
        };
        const renderWhoIsYou = (props) => (React.createElement(WhoIsYou_1.default, Object.assign({}, props, state, { golfersRemaining: golfersRemaining })));
        const renderAdminWrapper = (props) => (React.createElement(AdminWrapper, Object.assign({}, props, state, { golfersRemaining: golfersRemaining })));
        return (React.createElement(react_router_dom_1.Switch, null,
            React.createElement(react_router_dom_1.Route, { exact: true, path: '/', render: renderTourneyWrapper }),
            React.createElement(react_router_dom_1.Route, { exact: true, path: '/draft', render: renderDraftWrapper }),
            React.createElement(react_router_dom_1.Route, { exact: true, path: '/whoisyou', render: renderWhoIsYou }),
            React.createElement(react_router_dom_1.Route, { exact: true, path: '/admin', render: renderAdminWrapper })));
    }
}
exports.default = AppNode;
;
