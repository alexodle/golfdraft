import {isEmpty, last} from 'lodash';
import Assets from '../constants/Assets';
import * as moment from 'moment';
import * as React from 'react';
import GolfDraftPanel from './GolfDraftPanel';
import {DraftPick} from '../types/ClientTypes';

const TIME_INTERVAL = 1000;
const WARNING_TIME = 1000 * 60 * 2;
const OVERTIME = 1000 * 60 * 3;
const FINAL_COUNTDOWN_THRESHOLD = 1000 * 15;
const WARNING_SOUND_INTERVAL_SECONDS = 10;

const pickWarningSound = new Audio(Assets.PICK_WARNING_SOUND);

export interface DraftClockProps {
  isMyPick: boolean;
  allowClock: boolean;
  draftPicks: DraftPick[];
}

interface DraftClockState {
  totalMillis: number;
  intervalId?: number;
}

export default class DraftClock extends React.Component<DraftClockProps, DraftClockState> {

  constructor(props: DraftClockProps) {
    super(props);
    this.state = this._getInitialState();
  }

  _getInitialState() {
    return { intervalId: null, ...this._getTotalMillis() };
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
    } else if (moment.utc(totalMillis).seconds() % WARNING_SOUND_INTERVAL_SECONDS === 0) {
      pickWarningSound.play();
    }
  }

  render() {
    let body = null;

    const totalMillis = this.state.totalMillis || 0;
    let className = "";
    if (totalMillis > OVERTIME) {
      className = "text-danger";
    } else if (totalMillis > WARNING_TIME) {
      className = "text-warning";
    }

    const format = this._getDisplayTime();
    body = (
      <p className='draft-clock'><b className={className}>{format}</b></p>
    );

    return (
      <GolfDraftPanel heading='Draft Clock'>
        {body}
      </GolfDraftPanel>
    );
  }

  _getDisplayTime(state?) {
    state = state || this.state;

    if (state.totalMillis === null) {
      return 'NS';
    }

    const totalMillis = state.totalMillis || 0;
    return moment.utc(totalMillis).format("mm:ss");
  }

  _getTotalMillis(props? : DraftClockProps) {
    props = props || this.props;

    if (isEmpty(props.draftPicks) || !this.props.allowClock) {
      return { totalMillis: null };
    }

    const lastPick = last(props.draftPicks);
    const currentTime = new Date();
    const totalMillis = Math.max(0, currentTime.getTime() - lastPick.clientTimestamp.getTime());
    return {
      totalMillis: totalMillis
    };
  }

};
