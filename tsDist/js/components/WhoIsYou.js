"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const React = require("react");
const UserActions_1 = require("../actions/UserActions");
const UserStore_1 = require("../stores/UserStore");
const react_router_dom_1 = require("react-router-dom");
const fetch_1 = require("../fetch");
function getSortedUsers() {
    return _.sortBy(UserStore_1.default.getAll(), 'name');
}
class WhoIsYou extends React.Component {
    constructor(props) {
        super(props);
        this._onUserChange = (ev) => {
            this.setState({ selectedUser: ev.target.value });
        };
        this._onPasswordChange = (ev) => {
            this.setState({ password: ev.target.value });
        };
        this._onSubmit = (ev) => {
            ev.preventDefault();
            this.setState({ isLoading: true, badAuth: false });
            fetch_1.postJson('/login', {
                username: UserStore_1.default.getUser(this.state.selectedUser).username,
                password: this.state.password
            })
                .then(() => {
                UserActions_1.default.setCurrentUser(this.state.selectedUser);
                const locationState = this.props.location.state;
                const redirectTo = (locationState && locationState.from) || '/';
                this.setState({ redirectTo });
            })
                .catch(() => {
                this.setState({ isLoading: false, badAuth: true, password: '' });
                this.refs.passwordInput.focus();
            });
        };
        this.state = this._getInitialState();
    }
    _getInitialState() {
        const selectedUser = getSortedUsers()[0]._id;
        return {
            selectedUser,
            password: '',
            isLoading: false,
            badAuth: false,
            redirectTo: null
        };
    }
    render() {
        const { badAuth, isLoading, password, selectedUser, redirectTo } = this.state;
        if (redirectTo) {
            return (React.createElement(react_router_dom_1.Redirect, { to: redirectTo }));
        }
        const submitDisabled = !password || isLoading;
        return (React.createElement("div", null,
            React.createElement("h2", null, "Who is you?"),
            !badAuth ? null : (React.createElement("div", { className: 'alert alert-danger', role: 'alert' }, "Invalid password. Try again.")),
            React.createElement("div", { className: 'panel panel-default' },
                React.createElement("div", { className: 'panel-body' },
                    React.createElement("form", { role: 'form' },
                        React.createElement("div", { className: 'form-group' },
                            React.createElement("select", { id: 'userSelect', value: this.state.selectedUser, onChange: this._onUserChange, size: 15, className: 'form-control' }, _.map(getSortedUsers(), function (u) {
                                return (React.createElement("option", { key: u._id, value: u._id }, u.name));
                            }))),
                        React.createElement("div", { className: 'form-group' + (badAuth ? ' has-error' : '') },
                            React.createElement("input", { ref: 'passwordInput', id: 'password', type: 'password', className: 'form-control', placeholder: 'password', disabled: isLoading, onChange: this._onPasswordChange, value: password })),
                        React.createElement("button", { className: 'btn btn-default btn-primary', onClick: this._onSubmit, disabled: submitDisabled }, "Sign in"))))));
    }
}
exports.default = WhoIsYou;
;
