import * as React from 'react';
import LogoutButton from './LogoutButton';
import {User} from '../types/ClientTypes';

export interface AppHeaderProps {
  tourneyName: string;
  currentUser: User;
  drafting?: boolean;
}

export default class AppHeader extends React.Component<AppHeaderProps, {}> {

  render() {
    return (
      <div className='page-header draft-page-header'>
        <div className='row'>
          <div className='col col-md-6'>
            <h1>
              Welcome to the Pool Party<br />
              <small>{this.props.tourneyName}</small>
            </h1>
          </div>
          <div className='col col-md-6'>
            <h1 style={{ textAlign: 'right' }}>
              <small>{this.props.currentUser.name}</small><br />
              <span className='logout-button'>
                <LogoutButton currentUser={this.props.currentUser} />
              </span>
            </h1>
          </div>
        </div>
      </div>
    );
  }

};
