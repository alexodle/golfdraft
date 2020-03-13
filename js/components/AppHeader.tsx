import '../../less/app_header.less'

import * as React from 'react';
import LogoutButton from './LogoutButton';
import { User } from '../types/ClientTypes';

export interface AppHeaderProps {
  tourneyName: string;
  currentUser: User;
  drafting?: boolean;
}

export default class AppHeader extends React.Component<AppHeaderProps, {}> {

  render() {
    return (
      <div className='page-header draft-page-header'>
        <div className='header-title-section'>
          <h1>
            Welcome to the Pool Party<br />
            <small>{this.props.tourneyName}</small>
          </h1>
        </div>
        <div className='header-user-section'>
          <span className='name'>{this.props.currentUser.name}</span>
          <LogoutButton currentUser={this.props.currentUser} />
        </div>
      </div>
    );
  }

};
