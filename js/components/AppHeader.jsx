'use strict';

import LogoutButton from './LogoutButton';
import * as React from 'react';

class AppHeader extends React.Component {

  render() {
    return (
      <div className='page-header draft-page-header'>
        <h1>
          Welcome to the {this.props.tourneyName}
          {!this.props.drafting ? null : ' Draft'}<br />
          <small>{this.props.currentUser.name}</small>
          <span> </span>
          <span className='logout-button'>
            <LogoutButton
              currentUser={this.props.currentUser}
              location={this.props.location}
            />
          </span>
        </h1>
      </div>
    );
  }

};

module.exports = AppHeader;
