"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const Assets_1 = require("../constants/Assets");
const moment = require("moment");
const React = require("react");
const GolfDraftPanel_1 = require("./GolfDraftPanel");
const TIME_INTERVAL = 1000;
const WARNING_TIME = 1000 * 60 * 2;
const OVERTIME = 1000 * 60 * 3;
const FINAL_COUNTDOWN_THRESHOLD = 1000 * 15;
const WARNING_SOUND_INTERVAL_SECONDS = 10;
const pickWarningSound = new Audio(Assets_1.default.PICK_WARNING_SOUND);
class DraftClock extends React.Component {
    constructor(props) {
        super(props);
        this.state = this._getInitialState();
    }
    _getInitialState() {
        return _.extend({ intervalId: null }, this._getTotalMillis());
    }
    componentDidMount() {
        const intervalId = window.setInterval(() => {
            this.setState(this._getTotalMillis());
        }, TIME_INTERVAL);
        this.setState({ intervalId });
    }
    componentWillUnmount() {
        if (this.state.intervalId) {
            window.clearInterval(this.state.intervalId);
            this.setState({ intervalId: null });
        }
    }
    componentWillReceiveProps(nextProps) {
        this.setState(this._getTotalMillis(nextProps));
    }
    componentDidUpdate(prevProps, prevState) {
        const displayTimeChanged = this._getDisplayTime(prevState) !== this._getDisplayTime();
        const isMyPick = this.props.isMyPick;
        const totalMillis = this.state.totalMillis;
        if (!displayTimeChanged || !isMyPick || !totalMillis || totalMillis < WARNING_TIME) {
            return;
        }
        if (totalMillis + FINAL_COUNTDOWN_THRESHOLD >= OVERTIME) {
            pickWarningSound.play();
        }
        else if (moment.utc(totalMillis).seconds() % WARNING_SOUND_INTERVAL_SECONDS === 0) {
            pickWarningSound.play();
        }
    }
    render() {
        let body = null;
        const totalMillis = this.state.totalMillis || 0;
        let className = "";
        if (totalMillis > OVERTIME) {
            className = "text-danger";
        }
        else if (totalMillis > WARNING_TIME) {
            className = "text-warning";
        }
        const format = this._getDisplayTime();
        body = (React.createElement("p", { className: 'draft-clock' },
            React.createElement("b", { className: className }, format)));
        return (React.createElement(GolfDraftPanel_1.default, { heading: 'Draft Clock' }, body));
    }
    _getDisplayTime(state) {
        state = state || this.state;
        if (state.totalMillis === null) {
            return 'NS';
        }
        const totalMillis = state.totalMillis || 0;
        return moment.utc(totalMillis).format("mm:ss");
    }
    _getTotalMillis(props) {
        props = props || this.props;
        if (_.isEmpty(props.draftPicks) || !this.props.allowClock) {
            return { totalMillis: null };
        }
        const lastPick = _.last(props.draftPicks);
        const currentTime = new Date();
        const totalMillis = Math.max(0, currentTime.getTime() - lastPick.clientTimestamp.getTime());
        return {
            totalMillis: totalMillis
        };
    }
}
exports.default = DraftClock;
;
