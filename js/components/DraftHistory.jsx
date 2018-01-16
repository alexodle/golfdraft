// @flow
'use strict';

const _ = require('lodash');
const DraftStore = require('../stores/DraftStore');
const GolfDraftPanel = require('./GolfDraftPanel.jsx');
const GolferLogic = require('../logic/GolferLogic');
const GolferStore = require('../stores/GolferStore');
const UserStore = require('../stores/UserStore');
const React = require('react');

class DraftHistory extends React.Component {
  render() {
    const selectedUserId = this.props.selectedUserId;
    const onPersonClick = this._onPersonClick;
    let heading = 'Draft History';
    let draftPicks = _.clone(this.props.draftPicks).reverse();

    if (selectedUserId) {
      draftPicks = _.where(draftPicks, { user: selectedUserId });
      heading = (
        <span>
          <a href='#DraftHistory' onClick={this._onDeselectPerson}>Draft History</a>
          <span> - </span>{UserStore.getUser(selectedUserId).name}
        </span>
      );
    }

    return (
      <div>
        <a name='DraftHistory' />
        <GolfDraftPanel heading={heading}>
          {!selectedUserId ? null : (
            <p><small>
              <b>Tip:</b> click "Draft History" (above) to view all picks again
            </small></p>
          )}
          <table className='table'>
            <thead><tr><th>#</th><th>Pool User</th><th>Golfer</th></tr></thead>
            <tbody>
              {_.map(draftPicks, function (p) {
                const userName = UserStore.getUser(p.user).name;
                return (
                  <tr key={p.pickNumber}>
                    <td>{p.pickNumber + 1}</td>
                    <td>
                      {selectedUserId ? userName : (
                        <a href='#DraftHistory' onClick={_.partial(onPersonClick, p.user)}>
                          {userName}
                        </a>
                      )}
                    </td>
                    <td>{GolferLogic.renderGolfer(GolferStore.getGolfer(p.golfer))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </GolfDraftPanel>
      </div>
    );
  }

  _onPersonClick(pid) {
    this.props.onSelectionChange(pid);
  }

  _onDeselectPerson() {
    this.props.onSelectionChange(null);
  }

};

module.exports = DraftHistory;
