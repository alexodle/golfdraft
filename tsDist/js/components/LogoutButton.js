"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const UserActions_1 = require("../actions/UserActions");
const react_router_1 = require("react-router");
class LogoutButton extends React.Component {
    constructor(props) {
        super(props);
        this._onClick = (ev) => {
            ev.preventDefault();
            UserActions_1.default.setCurrentUser(null);
            this.setState({ redirectTo: '/whoisyou' });
        };
        this.state = this._getInitialState();
    }
    _getInitialState() {
        return { redirectTo: null };
    }
    render() {
        const { redirectTo } = this.state;
        if (redirectTo) {
            return (React.createElement(react_router_1.Redirect, { to: redirectTo }));
        }
        return (React.createElement("a", { href: "#noop", className: "logout-button", onClick: this._onClick },
            "I\u2019m not ",
            this.props.currentUser.name));
    }
}
exports.default = LogoutButton;
;
