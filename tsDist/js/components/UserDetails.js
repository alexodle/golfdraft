"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const cx = require("classnames");
const React = require("react");
const utils = require("../../common/utils");
const GolferStore_1 = require("../stores/GolferStore");
const UserStore_1 = require("../stores/UserStore");
class UserDetails extends React.Component {
    render() {
        const userId = this.props.userId;
        const userScore = this.props.userScores[userId];
        const scoresByDay = userScore.scoresByDay;
        const draftPicksByGolfer = _.keyBy(this.props.draftPicks, 'golfer');
        const sortedScores = _.chain(this.props.userScores)
            .map("total")
            .sortBy()
            .value();
        const userRank = _.sortedIndex(sortedScores, userScore.total);
        const isTied = sortedScores[userRank + 1] === userScore.total;
        const golferScores = _.sortBy(userScore.scoresByGolfer, 'total');
        const trs = _.map(golferScores, function (gs) {
            return (React.createElement("tr", { key: gs.golfer },
                React.createElement("td", null,
                    GolferStore_1.default.getGolfer(gs.golfer).name,
                    React.createElement("small", null,
                        " (",
                        utils.getOrdinal(draftPicksByGolfer[gs.golfer].pickNumber + 1),
                        " pick)")),
                React.createElement("td", null, utils.toGolferScoreStr(gs.total)),
                _.map(gs.scores, function (s, i) {
                    const missedCut = gs.missedCuts[i];
                    const scoreUsed = _.chain(scoresByDay[i].usedScores)
                        .map('golfer')
                        .includes(gs.golfer)
                        .value();
                    const currentDay = gs.day === i + 1;
                    return (React.createElement("td", { className: cx({
                            'missed-cut': missedCut,
                            'score-used': scoreUsed
                        }), key: i },
                        utils.toGolferScoreStr(s),
                        React.createElement("sup", { className: "missed-cut-text" }, " MC"),
                        !currentDay ? null : (React.createElement("sup", { className: "thru-text" },
                            " ",
                            utils.toThruStr(gs.thru)))));
                })));
        });
        const tieText = isTied ? "(Tie)" : "";
        return (React.createElement("section", null,
            React.createElement("h2", null,
                UserStore_1.default.getUser(userId).name,
                React.createElement("span", null, " "),
                "(",
                utils.toGolferScoreStr(userScore.total),
                ")",
                React.createElement("small", null,
                    " ",
                    utils.getOrdinal(userRank + 1),
                    " place ",
                    tieText)),
            React.createElement("table", { className: 'table user-details-table' },
                React.createElement("thead", null,
                    React.createElement("tr", null,
                        React.createElement("th", null, "Golfer"),
                        React.createElement("th", null, "Score"),
                        React.createElement("th", null, "Day 1"),
                        React.createElement("th", null, "Day 2"),
                        React.createElement("th", null, "Day 3"),
                        React.createElement("th", null, "Day 4"))),
                React.createElement("tbody", null, trs))));
    }
}
exports.default = UserDetails;
;
