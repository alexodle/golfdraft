import * as React from 'react';

export interface WhoIsYouProps {
  usernames: string[];
  redirectTo?: string;
}

interface WhoIsYouState {
  selectedUser: string;
  password: string;
  isSubmitting: boolean;
  invalidAuth: boolean;
}

function isEmpty(v): boolean {
  return !v || !(v.length && v.length > 0);
}

export default class WhoIsYou extends React.Component<WhoIsYouProps, WhoIsYouState> {

  constructor(props) {
    super(props);

    const selectedUser = props.usernames.sort()[0];
    this.state = {
      selectedUser,
      password: '',
      isSubmitting: false,
      invalidAuth: false,
    };
  }

  render() {
    const { redirectTo } = this.props;
    const { invalidAuth, isSubmitting, selectedUser, password } = this.state;

    const submitDisabled = isSubmitting || isEmpty(password);
    return (
      <div>
        <h2>Who is you?</h2>
        {!invalidAuth || isSubmitting ? null : (
          <div className='alert alert-danger' role='alert'>
            Invalid password. Try again.
          </div>
        )}
        <div className='panel panel-default'>
          <div className='panel-body'>
            <form role='form' onSubmit={this._onSubmit}>
              <div className='form-group'>
                <select
                  id='userSelect'
                  name='username'
                  value={selectedUser}
                  onChange={this._onUserChange}
                  size={15}
                  className='form-control'
                  autoFocus
                >
                  {this.props.usernames.sort().map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className={'form-group' + (invalidAuth ? ' has-error' : '')}>
                <input
                  ref='passwordInput'
                  name='password'
                  type='password'
                  placeholder='Password'
                  className='form-control'
                  onChange={this._onPasswordChange}
                  disabled={isSubmitting}
                  value={password}
                />
              </div>
              {isEmpty(redirectTo) ? null : (
                <input type='hidden' name='redirect' value={redirectTo} />
              )}
              <input
                type='submit'
                className='btn btn-default btn-primary'
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

  _onSubmit = async (ev) => {
    ev.preventDefault()
    this.setState({ isSubmitting: true });

    try {
      const res = await fetch(`${process.env.BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: this.state.selectedUser,
          password: this.state.password,
        })
      })
      if (!res.ok) {
        throw new Error('invalid')
      }
      const resp = await res.json()
      console.log(resp)
    } catch (e) {
      console.error(e.stack)
      this.setState({ invalidAuth: true })
    }
  }

};
