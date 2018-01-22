import DraftStore from '../stores/DraftStore';;
import GolferLogic from '../logic/GolferLogic';;
import GolferStore from '../stores/GolferStore';;
import * as React from 'react';
import UserStore from '../stores/UserStore';;
import * as _ from 'lodash';;
import GolfDraftPanel from './GolfDraftPanel';
import {DraftPick} from '../types/Types';

export interface DraftHistoryProps {
  selectedUserId?: string;
  draftPicks: DraftPick[];
  onSelectionChange?: (pid?: string) => void;
}

export default class DraftHistory extends React.Component<DraftHistoryProps, {}> {

  render() {
    const selectedUserId = this.props.selectedUserId;
    const onPersonClick = this.props.onSelectionChange ? this._onPersonClick : null;
    let draftPicks = _.clone(this.props.draftPicks).reverse();
    let heading: JSX.Element | string;

    heading = 'Draft History';
    if (selectedUserId) {
      draftPicks = _.filter(draftPicks, { user: selectedUserId });
      heading = (
        <span>
          <a href='#DraftHistory' onClick={this._onDeselectPerson}>Draft History</a>
          <span> - </span>{UserStore.getUser(selectedUserId).name}
        </span>
      );
    }

    return (
      <div>
        <a id='DraftHistory' />
        <GolfDraftPanel heading={heading}>
          {!selectedUserId ? null : (
            <p><small>
              <b>Tip:</b> click "Draft History" (above) to view all picks again
            </small></p>
          )}
          <table className='table'>
            <thead><tr><th>#</th><th>Pool User</th><th>Golfer</th></tr></thead>
            <tbody>
              {_.map(draftPicks, (p) => {
                const userName = UserStore.getUser(p.user).name;
                return (
                  <tr key={p.pickNumber}>
                    <td>{p.pickNumber + 1}</td>
                    <td>
                      {selectedUserId ? userName : (
                        <a href='#DraftHistory' onClick={!onPersonClick ? null : _.partial(onPersonClick, p.user)}>
                          {userName}
                        </a>
                      )}
                    </td>
                    <td>{GolferLogic.renderGolfer(GolferStore.getGolfer(p.golfer))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </GolfDraftPanel>
      </div>
    );
  }

  _onPersonClick = (pid) => {
    this.props.onSelectionChange(pid);
  }

  _onDeselectPerson = () => {
    this.props.onSelectionChange(null);
  }

};
