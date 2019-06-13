import {take, includes, partial} from 'lodash';
import * as cx from 'classnames';
import * as React from 'react';
import UserStore from '../stores/UserStore';
import {DraftPickOrder, User, Indexed} from '../types/ClientTypes';
import constants from '../../common/constants';

export interface DraftPickOrderProps {
  pickOrder: DraftPickOrder[];
  pickingForUsers: string[];
  currentPick?: DraftPickOrder;
  currentUser: User;
  autoPickUsers: Indexed<string>;
  pickListUsers: Indexed<string>;
  onUserSelected: (pid: string) => void;
}

export default class DraftPickOrderView extends React.Component<DraftPickOrderProps, {}> {

  render() {
    const {pickingForUsers, currentPick, currentUser, autoPickUsers, pickListUsers} = this.props;
    const myUser = currentUser._id;

    const pickOrder = take(this.props.pickOrder, this.props.pickOrder.length / constants.NGOLFERS);

    return (
      <div>
        <ol className='pick-order-list'>
          {pickOrder.map(pick => {
            return (
              <li
                key={pick.user}
                className={cx({
                  'my-user': (
                    myUser === pick.user ||
                    includes(pickingForUsers, pick.user)
                  ),
                  'current-user': currentPick.user === pick.user
                })}
              >
                <a href='#DraftHistory' onClick={partial(this._onSelect, pick.user)}>
                  {UserStore.getUser(pick.user).name}
                </a>
                {!autoPickUsers[pick.user] ? null : (
                  <span> <span className='label label-success info-label'>AUTO</span></span>
                )}
                {!pickListUsers[pick.user] ? null : (
                  <span> <span className='label label-info info-label'>PL</span></span>
                )}
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
