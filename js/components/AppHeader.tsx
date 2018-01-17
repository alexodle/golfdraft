import * as React from 'react';
import LogoutButton from './LogoutButton';
import {User} from '../types/Types';

export interface AppHeaderProps {
  tourneyName: string;
  currentUser: User;
  drafting: boolean;
}

export default class AppHeader extends React.Component<AppHeaderProps, {}> {

  render() {
    return (
      <div className='page-header draft-page-header'>
        <h1>
          Welcome to the {this.props.tourneyName}
          {!this.props.drafting ? null : ' Draft'}<br />
          <small>{this.props.currentUser.name}</small>
          <span> </span>
          <span className='logout-button'>
            <LogoutButton currentUser={this.props.currentUser} />
          </span>
        </h1>
      </div>
    );
  }

};
