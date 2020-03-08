import * as React from 'react';
import { User } from '../types/ClientTypes';

export interface LogoutButtonProps {
  currentUser: User;
}

interface LogoutButtonState {
  enabled: boolean;
}

export default class LogoutButton extends React.Component<LogoutButtonProps, LogoutButtonState> {

  constructor(props) {
    super(props);
    this.state = { enabled: true };
  }

  render() {
    return (
      <form action='/logout' method='post'>
        <input
          type='submit'
          className="logout-button"
          value={`I'm not ${this.props.currentUser.name}`}
          onSubmit={this._onSubmit}
          disabled={!this.state.enabled}
        />
      </form>
    );
  }

  _onSubmit = () => {
    this.setState({ enabled: false });
  }

};
