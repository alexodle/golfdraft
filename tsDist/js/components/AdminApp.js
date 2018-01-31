"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const React = require("react");
const DraftHistory_1 = require("./DraftHistory");
const DraftStatus_1 = require("./DraftStatus");
const UserActions_1 = require("../actions/UserActions");
const fetch_1 = require("../fetch");
function togglePause(isPaused) {
    return fetch_1.putJson('/admin/pause', { isPaused });
}
function toggleAllowClock(allowClock) {
    return fetch_1.putJson('/admin/allowClock', { allowClock });
}
function toggleDraftHasStarted(draftHasStarted) {
    return fetch_1.putJson('/admin/draftHasStarted', { draftHasStarted });
}
function toggleAutoPick(userId, autoPick) {
    return fetch_1.putJson('/admin/autoPickUsers', { userId, autoPick });
}
class PasswordInput extends React.Component {
    constructor(props) {
        super(props);
        this._onChange = (ev) => {
            this.setState({ password: ev.target.value });
        };
        this._onSubmit = (ev) => {
            ev.preventDefault();
            this.setState({ busy: true });
            fetch_1.postJson('/admin/login', { password: this.state.password })
                .then(() => UserActions_1.default.setIsAdmin(true))
                .catch(() => this.setState({ busy: false }));
        };
        this.state = {
            password: '',
            busy: false
        };
    }
    render() {
        return (React.createElement("section", null,
            React.createElement("form", { onSubmit: this._onSubmit },
                React.createElement("div", { className: 'form-group' },
                    React.createElement("label", { htmlFor: 'adminPassword' }, "Password"),
                    React.createElement("input", { type: 'password', className: 'form-control', id: 'adminPassword', name: 'password', onChange: this._onChange, value: this.state.password, disabled: this.state.busy })),
                React.createElement("button", { type: 'submit', className: 'btn btn-default', disabled: this.state.busy }, "Submit"))));
    }
}
;
class AdminApp extends React.Component {
    constructor(props) {
        super(props);
        this._onStartDraft = () => {
            toggleDraftHasStarted(true);
        };
        this._onUnstartDraft = () => {
            toggleDraftHasStarted(false);
        };
        this._onPause = () => {
            togglePause(true);
        };
        this._onUnpause = () => {
            togglePause(false);
        };
        this._onAllowClock = () => {
            toggleAllowClock(true);
        };
        this._onStopClock = () => {
            toggleAllowClock(false);
        };
        this._onUndoLastPick = () => {
            this.setState({ confirmingUndo: true });
        };
        this._onConfirmUndoLastPick = () => {
            fetch_1.del('/admin/lastPick');
            this._onCancelUndoLastPick();
        };
        this._onCancelUndoLastPick = () => {
            this.setState({ confirmingUndo: false });
        };
        this.state = { confirmingUndo: false };
    }
    render() {
        const props = this.props;
        const confirmingUndo = this.state.confirmingUndo;
        if (!props.isAdmin) {
            return (React.createElement(PasswordInput, null));
        }
        return (React.createElement("section", null,
            React.createElement("h1", null, "Hello admin!"),
            props.draftHasStarted ? (React.createElement("h2", null, "Draft has started!")) : (React.createElement("h2", null, "Draft has not started yet")),
            React.createElement("div", { className: 'panel' },
                React.createElement("div", { className: 'panel-body' },
                    React.createElement("button", { type: 'button', className: 'btn btn-default', onClick: this._onStartDraft }, "Start Draft"),
                    React.createElement("span", null, " "),
                    React.createElement("button", { type: 'button', className: 'btn btn-default', onClick: this._onUnstartDraft }, "Unstart Draft"))),
            props.isPaused ? (React.createElement("h2", null, "Paused!")) : (React.createElement("h2", null, "Not Paused")),
            React.createElement("div", { className: 'panel' },
                React.createElement("div", { className: 'panel-body' },
                    React.createElement("button", { type: 'button', className: 'btn btn-default', onClick: this._onPause }, "Pause"),
                    React.createElement("span", null, " "),
                    React.createElement("button", { type: 'button', className: 'btn btn-default', onClick: this._onUnpause }, "Unpause"))),
            React.createElement("h2", null, "Auto picks"),
            React.createElement("div", { className: 'panel' },
                React.createElement("div", { className: 'panel-body' },
                    React.createElement("ul", { className: 'list-unstyled' }, _.map(props.users, (user) => {
                        const checked = !!props.autoPickUsers[user._id];
                        return (React.createElement("li", { key: user._id },
                            React.createElement("div", { className: 'checkbox' },
                                React.createElement("label", null,
                                    React.createElement("input", { type: 'checkbox', checked: checked, onChange: toggleAutoPick.bind(null, user._id, !checked) }),
                                    " ",
                                    user.name))));
                    })))),
            props.allowClock ? (React.createElement("h2", null, "Allowing clock")) : (React.createElement("h2", null, "Not allowing clock!")),
            React.createElement("div", { className: 'panel' },
                React.createElement("div", { className: 'panel-body' },
                    React.createElement("button", { type: 'button', className: 'btn btn-default', onClick: this._onAllowClock }, "Allow clock"),
                    React.createElement("span", null, " "),
                    React.createElement("button", { type: 'button', className: 'btn btn-default', onClick: this._onStopClock }, "Pause clock"))),
            React.createElement("div", { className: 'panel' },
                React.createElement("div", { className: 'panel-body' },
                    confirmingUndo ? null : (React.createElement("button", { className: 'btn btn-default', type: 'button', onClick: this._onUndoLastPick }, "Undo Pick")),
                    !confirmingUndo ? null : (React.createElement("span", null,
                        React.createElement("label", null, "Are you sure you want to undo the last pick?"),
                        React.createElement("button", { className: 'btn btn-default', type: 'button', onClick: this._onConfirmUndoLastPick }, "I'm sure"),
                        React.createElement("span", null, " "),
                        React.createElement("button", { className: 'btn btn-default', type: 'button', onClick: this._onCancelUndoLastPick }, "Cancel"))))),
            React.createElement("div", { className: 'panel' },
                React.createElement("div", { className: 'panel-body' },
                    React.createElement("button", { className: 'btn btn-default', onClick: this._forceRefresh }, "Force Refresh"))),
            !props.currentPick ? null : (React.createElement(DraftStatus_1.default, { currentPick: props.currentPick })),
            React.createElement(DraftHistory_1.default, { draftPicks: props.draftPicks })));
    }
    _forceRefresh() {
        fetch_1.put('/admin/forceRefresh');
    }
}
;
exports.default = AdminApp;
