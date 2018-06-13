import * as _ from 'lodash';
import * as cx from 'classnames';
import DraftStore from '../stores/DraftStore';
import * as React from 'react';
import UserStore from '../stores/UserStore';
import GolfDraftPanel from './GolfDraftPanel';
import {DraftPickOrder, User, Indexed} from '../types/ClientTypes';
import constants from '../../common/constants';

export interface DraftPickOrderProps {
  pickOrder: DraftPickOrder[];
  pickingForUsers: string[];
  currentPick?: DraftPickOrder;
  currentUser: User;
  autoPickUsers: Indexed<string>;
  onUserSelected: (pid: string) => void;
}

export default class DraftPickOrderView extends React.Component<DraftPickOrderProps, {}> {

  render() {
    const {pickingForUsers, currentPick, currentUser, autoPickUsers} = this.props;
    const myUser = currentUser._id;

    const pickOrder = _.take(this.props.pickOrder, this.props.pickOrder.length / constants.NGOLFERS);

    return (
      <div>
        <p><small>
          <b>Tip:</b> your are picking for all users in bold
        </small></p>
        <p><small>
          <b>Pro Tip:</b> click on a user to see their picks
        </small></p>
        <ol className='pick-order-list'>
          {_.map(pickOrder, (pick, i) => {
            return (
              <li
                key={pick.user}
                className={cx({
                  'my-user': (
                    myUser === pick.user ||
                    _.includes(pickingForUsers, pick.user)
                  ),
                  'current-user': currentPick.user === pick.user
                })}
              >
                {!autoPickUsers[pick.user] ? null : (
                  <span><span className='label label-success auto-label'>AUTO</span> </span>
                )}
                <a href='#DraftHistory' onClick={_.partial(this._onSelect, pick.user)}>
                  {UserStore.getUser(pick.user).name}
                </a>
              </li>);
          })}
        </ol>
      </div>
    );
  }

  _onSelect = (pid) => {
    this.props.onUserSelected(pid);
  }

};
