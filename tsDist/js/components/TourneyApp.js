"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const moment = require("moment");
const React = require("react");
const ChatRoom_1 = require("./ChatRoom");
const constants_1 = require("../../common/constants");
const GolfDraftPanel_1 = require("./GolfDraftPanel");
const GolferLogic_1 = require("../logic/GolferLogic");
const GolferStore_1 = require("../stores/GolferStore");
const ScoreLogic_1 = require("../logic/ScoreLogic");
const UserDetails_1 = require("./UserDetails");
const UserStandings_1 = require("./UserStandings");
const utils = require("../../common/utils");
const NDAYS = constants_1.default.NDAYS;
function getState(state, props) {
    return {
        userDetailsUser: state.userDetailsUser || props.currentUser._id
    };
}
class TourneyApp extends React.Component {
    constructor(props) {
        super(props);
        this._onUserSelect = (userId) => {
            window.location.href = '#UserDetails';
            this.setState({ userDetailsUser: userId });
        };
        this.state = this._getInitialState();
    }
    _getInitialState() {
        return getState({}, this.props);
    }
    render() {
        const userScores = ScoreLogic_1.default.calcUserScores(this.props.draft.draftPicks, this.props.scores);
        const scores = this.props.scores;
        const worstScoresPerDay = _.chain(NDAYS)
            .times((day) => {
            const worstScore = _.chain(scores)
                .reject((s) => s.missedCuts[day])
                .maxBy((s) => s.scores[day])
                .value();
            return {
                day: day,
                golfer: worstScore.golfer,
                score: worstScore.scores[day]
            };
        })
            .takeWhile(function (s) {
            // Assume 0 means they haven't started playing this day yet
            return s.score > 0;
        })
            .value();
        return (React.createElement("section", null,
            React.createElement("p", null,
                React.createElement("small", null,
                    "Scores sync every 10 minutes. Last sync: ",
                    React.createElement("b", null, moment(this.props.lastScoresUpdate).calendar()))),
            React.createElement(GolfDraftPanel_1.default, { heading: 'Overall Standings' },
                React.createElement(UserStandings_1.default, { currentUser: this.props.currentUser, userScores: userScores, selectedUser: this.state.userDetailsUser, onUserSelect: this._onUserSelect })),
            React.createElement("a", { id: 'UserDetails' }),
            React.createElement(GolfDraftPanel_1.default, { heading: 'Score Details' },
                React.createElement(UserDetails_1.default, { userId: this.state.userDetailsUser, userScores: userScores, draftPicks: this.props.draft.draftPicks })),
            !worstScoresPerDay.length ? null : (React.createElement(GolfDraftPanel_1.default, { heading: 'Worst Scores of the Day' },
                React.createElement("ul", null, _.map(worstScoresPerDay, (s) => {
                    return (React.createElement("li", { key: s.day, className: 'list-unstyled' },
                        React.createElement("b", null,
                            "Day ",
                            s.day + 1),
                        ": ",
                        utils.toGolferScoreStr(s.score),
                        React.createElement("span", null, " "),
                        GolferLogic_1.default.renderGolfer(GolferStore_1.default.getGolfer(s.golfer))));
                })))),
            React.createElement(ChatRoom_1.default, { currentUser: this.props.currentUser, messages: this.props.chatMessages, activeUsers: this.props.activeUsers })));
    }
}
;
exports.default = TourneyApp;
