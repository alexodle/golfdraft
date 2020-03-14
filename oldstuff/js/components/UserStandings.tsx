import * as _ from 'lodash';
import * as cx from 'classnames';
import * as React from 'react';
import * as utils from '../../common/utils';
import constants from '../../common/constants';
import GolferStore from '../stores/GolferStore';
import UserStore from '../stores/UserStore';
import { User, DraftPick, TourneyStandings, DraftPickOrder } from '../types/ClientTypes';

export interface UserStandingsProps {
  tourneyStandings: TourneyStandings;
  pickOrder: DraftPickOrder[];
  onUserSelect: (pid: string) => void;
  currentUser: User;
  selectedUser: string;
}

export default class UserStandings extends React.Component<UserStandingsProps, {}> {

  render() {
    const tourneyStandings = this.props.tourneyStandings;
    const currentDayIndex = tourneyStandings.currentDay - 1;
    const topScore = tourneyStandings.playerScores[0].totalScore;

    const trs = _.map(tourneyStandings.playerScores, (ps, i) => {
      const p = UserStore.getUser(ps.player);
      const userIsMe = this.props.currentUser._id === p._id;
      const userIsSelected = this.props.selectedUser === p._id;
      const viewUser = _.partial(this._onUserSelect, p._id);

      const holesLeft = _.sumBy(ps.dayScores[currentDayIndex].golferScores, gs => {
        if (gs.missedCut) {
          return 0;
        } else if (gs.thru === null) {
          return constants.NHOLES;
        } else {
          return constants.NHOLES - gs.thru;
        }
      });

      const pickNumber = _.findIndex(this.props.pickOrder, dpo => dpo.user === ps.player);

      return (
        <tr
          key={p._id}
          className={cx({
            'selected-user-row': userIsSelected
          })}
          onClick={viewUser}
        >
          <td>{ps.standing + 1}</td>
          <td>{userIsMe ? (<b>{p.name}</b>) : p.name}</td>
          <td>{utils.toGolferScoreStr(ps.totalScore)}</td>
          <td>{pickNumber + 1}</td>
          <td className='hidden-xs'>{holesLeft > 0 ? holesLeft : 'F'}</td>
          {_.map(ps.dayScores, ds => {
            return (<td className='hidden-xs' key={ds.day}>{utils.toGolferScoreStr(ds.totalScore)}</td>);
          })}
          <td className='visible-xs'><a href='#UserDetails' onClick={viewUser}>Details</a></td>
        </tr>
      );
    });

    return (
      <section>
        <p>
          <small>
            <b>Tip:</b> Click on a player row to view details
          </small>
        </p>
        <table className='table standings-table table-hover'>
          <thead>
            <tr>
              <th>#</th>
              <th>Pool Player</th>
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
