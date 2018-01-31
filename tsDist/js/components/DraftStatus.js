"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DraftActions_1 = require("../actions/DraftActions");
const UserStore_1 = require("../stores/UserStore");
const React = require("react");
class DraftStatus extends React.Component {
    constructor() {
        super(...arguments);
        this._onTakePick = (ev) => {
            ev.preventDefault();
            DraftActions_1.default.draftForUser(this.props.currentPick.user);
        };
    }
    render() {
        const currentPick = this.props.currentPick;
        const userName = UserStore_1.default.getUser(currentPick.user).name;
        return (React.createElement("div", null,
            React.createElement("p", { className: 'draft-status' },
                "Now drafting (Pick #",
                currentPick.pickNumber + 1,
                "): ",
                React.createElement("b", null, userName)),
            React.createElement("a", { href: '#', onClick: this._onTakePick },
                "I'll pick for ",
                userName)));
    }
}
exports.default = DraftStatus;
;
