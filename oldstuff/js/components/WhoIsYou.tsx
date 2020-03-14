import * as React from 'react';

export interface WhoIsYouProps {
  usernames: string[];
}

interface WhoIsYouState {
  selectedUser: string;
  password: string;
  badAuth: boolean;
  isSubmitted: boolean;
  redirectTo?: string;
}

function isEmpty(v): boolean {
  return !v || !(v.length && v.length > 0);
}

function getBadAuthParam(): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  return !!urlParams.get('invalidAuth');
}

function getRedirectToParam(): string {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('redirect');
}

export default class WhoIsYou extends React.Component<WhoIsYouProps, WhoIsYouState> {

  constructor(props) {
    super(props);

    const selectedUser = props.usernames.sort()[0];
    this.state = {
      selectedUser,
      password: '',
      isSubmitted: false,
      badAuth: getBadAuthParam(),
      redirectTo: getRedirectToParam(),
    };
  }

  componentDidMount() {
    (this.refs.userSelect as HTMLSelectElement).focus();
  }

  render() {
    const {badAuth, isSubmitted, selectedUser, redirectTo, password} = this.state;

    const submitDisabled = isSubmitted || isEmpty(password);
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
            <form role='form' action='/login' method='post'>
              <div className='form-group'>
                <select
                  ref='userSelect'
                  id='userSelect'
                  name='username'
                  value={selectedUser}
                  onChange={this._onUserChange}
                  size={15}
                  className='form-control'
                >
                  {this.props.usernames.sort().map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className={'form-group' + (badAuth ? ' has-error' : '')}>
                <input
                  ref='passwordInput'
                  name='password'
                  type='password'
                  placeholder='Password'
                  className='form-control'
                  onChange={this._onPasswordChange}
                  disabled={isSubmitted}
                  value={password}
                />
              </div>
              {isEmpty(redirectTo) ? null : (
                <input type='hidden' name='redirect' value={redirectTo} />
              )}
              <input
                type='submit'
                className='btn btn-default btn-primary'
                onSubmit={this._onSubmit}
                disabled={submitDisabled}
                value='Sign in'
              />
            </form>
          </div>
        </div>
      </div>
    );
  }

  _onPasswordChange = (ev) => {
    this.setState({ password: ev.target.value });
  }

  _onUserChange = (ev) => {
    this.setState({ selectedUser: ev.target.value });
  }

  _onSubmit = () => {
    this.setState({ isSubmitted: true, badAuth: false });
  }

};
