'use strict';

const _ = require('lodash');
const DraftStore = require('../stores/DraftStore');
const GolfDraftPanel = require('./GolfDraftPanel.jsx');
const GolferLogic = require('../logic/GolferLogic');
const GolferStore = require('../stores/GolferStore');
const PlayerStore = require('../stores/PlayerStore');
const React = require('react');
const ReactCSSTransitionGroup = require('react/lib/ReactCSSTransitionGroup');

const DraftHistory = React.createClass({

  render: function () {
    const selectedPlayerId = this.props.selectedPlayerId;
    const onPersonClick = this._onPersonClick;
    let heading = 'Draft History';
    let draftPicks = _.clone(this.props.draftPicks).reverse();

    if (selectedPlayerId) {
      draftPicks = _.where(draftPicks, { player: selectedPlayerId });
      heading = (
        <span>
          <a href='#DraftHistory' onClick={this._onDeselectPerson}>Draft History</a>
          <span> - </span>{PlayerStore.getPlayer(selectedPlayerId).name}
        </span>
      );
    }

    return (
      <div>
        <a name='DraftHistory' />
        <GolfDraftPanel heading={heading}>
          {!selectedPlayerId ? null : (
            <p><small>
              <b>Tip:</b> click "Draft History" (above) to view all picks again
            </small></p>
          )}
          <table className='table'>
            <thead><tr><th>#</th><th>Pool Player</th><th>Golfer</th></tr></thead>
            <tbody>
              {_.map(draftPicks, function (p) {
                const playerName = PlayerStore.getPlayer(p.player).name;
                return (
                  <tr key={p.pickNumber}>
                    <td>{p.pickNumber + 1}</td>
                    <td>
                      {selectedPlayerId ? playerName : (
                        <a href='#DraftHistory' onClick={_.partial(onPersonClick, p.player)}>
                          {playerName}
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
  },

  _onPersonClick: function (pid) {
    this.props.onSelectionChange(pid);
  },

  _onDeselectPerson: function () {
    this.props.onSelectionChange(null);
  }

});

module.exports = DraftHistory;
