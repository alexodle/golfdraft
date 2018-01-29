import * as _ from 'lodash';
import * as React from 'react';
import UserActions from '../actions/UserActions';
import UserStore from '../stores/UserStore';
import {Redirect} from 'react-router-dom';
import {Location} from '../types/ClientTypes';
import {postJson} from '../fetch';

export interface WhoIsYouProps {
  location: Location;
}

interface WhoIsYouState {
  selectedUser: string;
  password: string;
  isLoading: boolean;
  badAuth: boolean;
  redirectTo?: string;
}

function getSortedUsers() {
  return _.sortBy(UserStore.getAll(), 'name');
}

export default class WhoIsYou extends React.Component<WhoIsYouProps, WhoIsYouState> {

  constructor(props) {
    super(props);
    this.state = this._getInitialState();
  }

  _getInitialState() {
    const selectedUser = getSortedUsers()[0]._id;
    return {
      selectedUser,
      password: '',
      isLoading: false,
      badAuth: false,
      redirectTo: null
    };
  }

  render() {
    const {badAuth, isLoading, password, selectedUser, redirectTo} = this.state;
    if (redirectTo) {
      return (<Redirect to={redirectTo} />);
    }

    const submitDisabled = !password || isLoading;
    return (
      <div>
        <h2>Who is you?</h2>
        {!badAuth ? null : (
          <div className='alert alert-danger' role='alert'>
            Invalid password. Try again.
          </div>
        )}
        <div className='panel panel-default'>
          <div className='panel-body'>
            <form role='form'>
              <div className='form-group'>
                <select
                  id='userSelect'
                  value={this.state.selectedUser}
                  onChange={this._onUserChange}
                  size={15}
                  className='form-control'
                >
                  {_.map(getSortedUsers(), function (u) {
                    return (<option key={u._id} value={u._id}>{u.name}</option>);
                  })}
                </select>
              </div>
              <div className={'form-group' + (badAuth ? ' has-error' : '')}>
                <input
                  ref='passwordInput'
                  id='password'
                  type='password'
                  className='form-control'
                  placeholder='password'
                  disabled={isLoading}
                  onChange={this._onPasswordChange}
                  value={password}
                />
              </div>
              <button
                className='btn btn-default btn-primary'
                onClick={this._onSubmit}
                disabled={submitDisabled}
              >
                Sign in
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  _onUserChange = (ev) => {
    this.setState({ selectedUser: ev.target.value });
  }

  _onPasswordChange = (ev) => {
    this.setState({ password: ev.target.value });
  }

  _onSubmit = (ev) => {
    ev.preventDefault();

    this.setState({ isLoading: true, badAuth: false });

    postJson('/login', {
        username: UserStore.getUser(this.state.selectedUser).username,
        password: this.state.password
      })
      .then(() => {
        UserActions.setCurrentUser(this.state.selectedUser);

        const locationState = this.props.location.state;
        const redirectTo = (locationState && locationState.from) || '/';
        this.setState({ redirectTo });
      })
      .catch(() => {
        this.setState({ isLoading: false, badAuth: true, password: '' });
        (this.refs.passwordInput as HTMLInputElement).focus();
      });
  }

};
