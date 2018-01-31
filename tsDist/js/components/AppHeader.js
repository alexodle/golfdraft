"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const LogoutButton_1 = require("./LogoutButton");
class AppHeader extends React.Component {
    render() {
        return (React.createElement("div", { className: 'page-header draft-page-header' },
            React.createElement("h1", null,
                "Welcome to the ",
                this.props.tourneyName,
                !this.props.drafting ? null : ' Draft',
                React.createElement("br", null),
                React.createElement("small", null, this.props.currentUser.name),
                React.createElement("span", null, " "),
                React.createElement("span", { className: 'logout-button' },
                    React.createElement(LogoutButton_1.default, { currentUser: this.props.currentUser })))));
    }
}
exports.default = AppHeader;
;
