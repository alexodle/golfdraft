import DraftActions from '../actions/DraftActions';
import UserStore from '../stores/UserStore';
import * as React from 'react';
import {DraftPickOrder} from '../types/ClientTypes';

export interface DraftStatusProps {
  currentPick: DraftPickOrder;
}

export default class DraftStatus extends React.Component<DraftStatusProps, {}> {
  render() {
    const currentPick = this.props.currentPick;
    const userName = UserStore.getUser(currentPick.user).name;
    return (
      <div>
        <p className='draft-status'>
          Now drafting (Pick #{currentPick.pickNumber + 1}): <b>{userName}</b>
        </p>
        <a href='#' onClick={this._onTakePick}>I'll pick for {userName}</a>
      </div>
    );
  }

  _onTakePick = (ev) => {
    ev.preventDefault();
    DraftActions.draftForUser(this.props.currentPick.user);
  }

};
