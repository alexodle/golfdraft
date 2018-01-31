"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
;
const GolferLogic_1 = require("../logic/GolferLogic");
;
const GolferStore_1 = require("../stores/GolferStore");
;
const React = require("react");
const UserStore_1 = require("../stores/UserStore");
;
const _ = require("lodash");
;
const GolfDraftPanel_1 = require("./GolfDraftPanel");
class DraftHistory extends React.Component {
    constructor() {
        super(...arguments);
        this._onPersonClick = (pid) => {
            this.props.onSelectionChange(pid);
        };
        this._onDeselectPerson = () => {
            this.props.onSelectionChange(null);
        };
    }
    render() {
        const selectedUserId = this.props.selectedUserId;
        const onPersonClick = this.props.onSelectionChange ? this._onPersonClick : null;
        let draftPicks = _.clone(this.props.draftPicks).reverse();
        let heading;
        heading = 'Draft History';
        if (selectedUserId) {
            draftPicks = _.filter(draftPicks, { user: selectedUserId });
            heading = (React.createElement("span", null,
                React.createElement("a", { href: '#DraftHistory', onClick: this._onDeselectPerson }, "Draft History"),
                React.createElement("span", null, " - "),
                UserStore_1.default.getUser(selectedUserId).name));
        }
        return (React.createElement("div", null,
            React.createElement("a", { id: 'DraftHistory' }),
            React.createElement(GolfDraftPanel_1.default, { heading: heading },
                !selectedUserId ? null : (React.createElement("p", null,
                    React.createElement("small", null,
                        React.createElement("b", null, "Tip:"),
                        " click \"Draft History\" (above) to view all picks again"))),
                React.createElement("table", { className: 'table' },
                    React.createElement("thead", null,
                        React.createElement("tr", null,
                            React.createElement("th", null, "#"),
                            React.createElement("th", null, "Pool User"),
                            React.createElement("th", null, "Golfer"))),
                    React.createElement("tbody", null, _.map(draftPicks, (p) => {
                        const userName = UserStore_1.default.getUser(p.user).name;
                        return (React.createElement("tr", { key: p.pickNumber },
                            React.createElement("td", null, p.pickNumber + 1),
                            React.createElement("td", null, selectedUserId ? userName : (React.createElement("a", { href: '#DraftHistory', onClick: !onPersonClick ? null : _.partial(onPersonClick, p.user) }, userName))),
                            React.createElement("td", null, GolferLogic_1.default.renderGolfer(GolferStore_1.default.getGolfer(p.golfer)))));
                    }))))));
    }
}
exports.default = DraftHistory;
;
