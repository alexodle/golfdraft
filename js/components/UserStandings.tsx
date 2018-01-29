import * as _ from 'lodash';
import * as cx from 'classnames';
import * as React from 'react';
import * as utils from '../../common/utils';
import GolferStore from '../stores/GolferStore';
import UserStore from '../stores/UserStore';
import {User, DraftPick, IndexedUserScores} from '../types/ClientTypes';

export interface UserStandingsProps {
  userScores: IndexedUserScores;
  onUserSelect: (pid: string) => void;
  currentUser: User;
  selectedUser: string;
}

export default class UserStandings extends React.Component<UserStandingsProps, {}> {

  render() {
    const userScores = _.sortBy(this.props.userScores, 'total');
    const userTotals = _.map(userScores, 'total');
    const topScore = userTotals[0];

    const trs = _.map(userScores, (ps) => {
      const p = UserStore.getUser(ps.user);
      const userIsMe = this.props.currentUser._id === p._id;
      const userIsSelected = this.props.selectedUser === p._id;
      const viewUser = _.partial(this._onUserSelect, p._id);
      const holesLeft = _.sumBy(_.values(ps.scoresByGolfer), function (gs) {
        if (_.some(gs.missedCuts)) {
          return 0;
        } else if (gs.thru === null) {
          return 18;
        } else {
          return 18 - gs.thru;
        }
      });

      return (
        <tr
          key={p._id}
          className={cx({
            'selected-user-row': userIsSelected
          })}
          onClick={viewUser}
        >
          <td>{_.sortedIndex(userTotals, ps.total) + 1}</td>
          <td>{userIsMe ? (<b>{p.name}</b>) : p.name}</td>
          <td>{utils.toGolferScoreStr(ps.total)}</td>
          <td>{ps.pickNumber + 1}</td>
          <td className='hidden-xs'>{holesLeft > 0 ? holesLeft : 'F'}</td>
          {_.map(ps.scoresByDay, function (ds) {
            return (<td className='hidden-xs' key={ds.day}>{utils.toGolferScoreStr(ds.total)}</td>);
          })}
          <td className='visible-xs'><a href='#UserDetails' onClick={viewUser}>Details</a></td>
        </tr>
      );
    });

    return (
      <section>
        <p>
          <small>
            <b>Tip:</b> Click on a user row to view score details
          </small>
        </p>
        <table className='table standings-table table-hover'>
          <thead>
            <tr>
              <th>#</th>
              <th>Pool User</th>
              <th>Total</th>
              <th>Pick Number</th>
              <th className='hidden-xs'>Holes Left Today</th>
              <th className='hidden-xs'>Day 1</th>
              <th className='hidden-xs'>Day 2</th>
              <th className='hidden-xs'>Day 3</th>
              <th className='hidden-xs'>Day 4</th>
              <th className='visible-xs'></th>
            </tr>
          </thead>
          <tbody>{trs}</tbody>
        </table>
      </section>
    );
  }

  _onUserSelect = (pid: string) => {
    this.props.onUserSelect(pid);
  }

};
