"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const cx = require("classnames");
const React = require("react");
const utils = require("../../common/utils");
const UserStore_1 = require("../stores/UserStore");
class UserStandings extends React.Component {
    constructor() {
        super(...arguments);
        this._onUserSelect = (pid) => {
            this.props.onUserSelect(pid);
        };
    }
    render() {
        const userScores = _.sortBy(this.props.userScores, 'total');
        const userTotals = _.map(userScores, 'total');
        const topScore = userTotals[0];
        const trs = _.map(userScores, (ps) => {
            const p = UserStore_1.default.getUser(ps.user);
            const userIsMe = this.props.currentUser._id === p._id;
            const userIsSelected = this.props.selectedUser === p._id;
            const viewUser = _.partial(this._onUserSelect, p._id);
            const holesLeft = _.sumBy(_.values(ps.scoresByGolfer), function (gs) {
                if (_.some(gs.missedCuts)) {
                    return 0;
                }
                else if (gs.thru === null) {
                    return 18;
                }
                else {
                    return 18 - gs.thru;
                }
            });
            return (React.createElement("tr", { key: p._id, className: cx({
                    'selected-user-row': userIsSelected
                }), onClick: viewUser },
                React.createElement("td", null, _.sortedIndex(userTotals, ps.total) + 1),
                React.createElement("td", null, userIsMe ? (React.createElement("b", null, p.name)) : p.name),
                React.createElement("td", null, utils.toGolferScoreStr(ps.total)),
                React.createElement("td", null, ps.pickNumber + 1),
                React.createElement("td", { className: 'hidden-xs' }, holesLeft > 0 ? holesLeft : 'F'),
                _.map(ps.scoresByDay, function (ds) {
                    return (React.createElement("td", { className: 'hidden-xs', key: ds.day }, utils.toGolferScoreStr(ds.total)));
                }),
                React.createElement("td", { className: 'visible-xs' },
                    React.createElement("a", { href: '#UserDetails', onClick: viewUser }, "Details"))));
        });
        return (React.createElement("section", null,
            React.createElement("p", null,
                React.createElement("small", null,
                    React.createElement("b", null, "Tip:"),
                    " Click on a user row to view score details")),
            React.createElement("table", { className: 'table standings-table table-hover' },
                React.createElement("thead", null,
                    React.createElement("tr", null,
                        React.createElement("th", null, "#"),
                        React.createElement("th", null, "Pool User"),
                        React.createElement("th", null, "Total"),
                        React.createElement("th", null, "Pick Number"),
                        React.createElement("th", { className: 'hidden-xs' }, "Holes Left Today"),
                        React.createElement("th", { className: 'hidden-xs' }, "Day 1"),
                        React.createElement("th", { className: 'hidden-xs' }, "Day 2"),
                        React.createElement("th", { className: 'hidden-xs' }, "Day 3"),
                        React.createElement("th", { className: 'hidden-xs' }, "Day 4"),
                        React.createElement("th", { className: 'visible-xs' }))),
                React.createElement("tbody", null, trs))));
    }
}
exports.default = UserStandings;
;
