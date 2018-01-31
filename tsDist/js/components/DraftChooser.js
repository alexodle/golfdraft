"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const cx = require("classnames");
const DraftActions_1 = require("../actions/DraftActions");
const GolferLogic_1 = require("../logic/GolferLogic");
const GolferStore_1 = require("../stores/GolferStore");
const React = require("react");
const UserStore_1 = require("../stores/UserStore");
const GolfDraftPanel_1 = require("./GolfDraftPanel");
function isProxyPick(props) {
    return props.currentUser._id !== props.currentPick.user;
}
function shouldShowPickListOption(props) {
    return isProxyPick(props) || !_.isEmpty(props.syncedPickList);
}
class DraftChooser extends React.Component {
    constructor(props) {
        super(props);
        this._onChange = (ev) => {
            this.setState({ selectedGolfer: ev.target.value });
        };
        this._onProxyPickListPick = (ev) => {
            ev.preventDefault();
            DraftActions_1.default.makePickListPick();
        };
        this._onSubmit = (ev) => {
            ev.preventDefault();
            DraftActions_1.default.makePick(this.state.selectedGolfer);
        };
        this._onStopTakingPick = (ev) => {
            ev.preventDefault();
            DraftActions_1.default.stopDraftingForUser(this.props.currentPick.user);
        };
        this.state = this._getInitialState();
    }
    _getInitialState() {
        return this._getSelectionState(this.props);
    }
    componentWillReceiveProps(nextProps) {
        const newState = this._getSelectionState(nextProps);
        this.setState(newState);
    }
    render() {
        if (this._isLoading()) {
            return this._renderLoading();
        }
        const golfersRemaining = this.props.golfersRemaining;
        const currentPick = this.props.currentPick;
        const sortKey = this.state.sortKey;
        const isProxyPick = this._isProxyPick();
        const sortedGolfers = this._sortedGolfers(golfersRemaining, sortKey);
        const showPickListOption = shouldShowPickListOption(this.props);
        let header = null;
        if (!isProxyPick) {
            header = (React.createElement("h4", null, "It\u2019s your turn! Make your pick."));
        }
        else {
            const userName = UserStore_1.default.getUser(currentPick.user).name;
            header = (React.createElement("section", null,
                React.createElement("h4", null,
                    "Make a pick for: ",
                    userName),
                React.createElement("p", null,
                    React.createElement("a", { href: '#', onClick: this._onStopTakingPick },
                        "I'll stop making picks for ",
                        userName))));
        }
        return (React.createElement(GolfDraftPanel_1.default, { heading: 'Draft Picker' },
            header,
            React.createElement("div", { className: 'btn-group', role: 'group', "aria-label": 'Sorting choices' },
                React.createElement("label", null, "Sort users by:"),
                React.createElement("br", null),
                !showPickListOption ? null : (React.createElement("button", { type: 'button', className: cx({
                        'btn btn-default': true,
                        'active': sortKey === 'pickList'
                    }), onClick: () => this._setSortKey('pickList') }, "User Pick List")),
                React.createElement("button", { type: 'button', className: cx({
                        'btn btn-default': true,
                        'active': sortKey === 'name'
                    }), onClick: () => this._setSortKey('name') }, "First Name"),
                React.createElement("button", { type: 'button', className: cx({
                        'btn btn-default': true,
                        'active': sortKey === 'wgr'
                    }), onClick: () => this._setSortKey('wgr') }, "World Golf Ranking")),
            React.createElement("form", { role: 'form' }, isProxyPick && sortKey === 'pickList' ? (React.createElement("div", { style: { marginTop: '1em' } },
                React.createElement("small", null, "* If no pick list is set, uses next WGR"),
                React.createElement("br", null),
                React.createElement("button", { className: 'btn btn-default btn-primary', onClick: this._onProxyPickListPick }, "Select next user on pick list"))) : (React.createElement("div", null,
                React.createElement("div", { className: 'form-group' },
                    React.createElement("label", { htmlFor: 'golfersRemaining' }, "Select your user:"),
                    React.createElement("select", { id: 'golfersRemaining', value: this.state.selectedGolfer, onChange: this._onChange, size: 10, className: 'form-control' }, _.map(sortedGolfers, (g) => {
                        return (React.createElement("option", { key: g._id, value: g._id }, GolferLogic_1.default.renderGolfer(g)));
                    }))),
                React.createElement("button", { className: 'btn btn-default btn-primary', onClick: this._onSubmit }, "Pick"))))));
    }
    _renderLoading() {
        return (React.createElement(GolfDraftPanel_1.default, { heading: 'Draft Picker' },
            React.createElement("span", null, "Loading...")));
    }
    _isLoading() {
        return !_.isArray(this.props.syncedPickList);
    }
    _isProxyPick() {
        return isProxyPick(this.props);
    }
    _sortedGolfers(golfers, sortKey) {
        const isProxyPick = this._isProxyPick();
        if (sortKey === 'pickList') {
            if (isProxyPick) {
                // special case, we cannot show the full list if this a proxy pick
                return null;
            }
            else {
                return _.chain(this.props.syncedPickList)
                    .map(GolferStore_1.default.getGolfer)
                    .value();
            }
        }
        return _.sortBy(golfers, [sortKey, 'name']);
    }
    _getSelectionState(props) {
        const state = this.state || {};
        const golfersRemaining = props.golfersRemaining;
        let sortKey = state.sortKey;
        let selectedGolfer = state.selectedGolfer;
        if (!sortKey || sortKey === 'pickList') {
            sortKey = shouldShowPickListOption(props) ? 'pickList' : 'wgr';
        }
        if (!selectedGolfer || !golfersRemaining[selectedGolfer]) {
            const firstGolfer = _.first(this._sortedGolfers(golfersRemaining, sortKey));
            selectedGolfer = firstGolfer ? firstGolfer._id : null;
        }
        return {
            selectedGolfer: selectedGolfer,
            sortKey: sortKey
        };
    }
    _setSortKey(sortKey) {
        if (sortKey === this.state.sortKey)
            return;
        const golfersRemaining = this.props.golfersRemaining;
        const firstGolfer = _.first(this._sortedGolfers(golfersRemaining, sortKey));
        const selectedGolfer = firstGolfer ? firstGolfer._id : null;
        this.setState({
            sortKey: sortKey,
            selectedGolfer: selectedGolfer
        });
    }
}
exports.default = DraftChooser;
;
