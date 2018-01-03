'use strict';

const _ = require('lodash');
const cx = require('classnames');
const DraftActions = require('../actions/DraftActions');
const GolfDraftPanel = require('./GolfDraftPanel.jsx');
const GolferLogic = require('../logic/GolferLogic');
const GolferStore = require('../stores/GolferStore');
const PlayerStore = require('../stores/PlayerStore');
const React = require('react');

const DraftChooser = React.createClass({

  getInitialState: function () {
    return _.extend(this._getSelectionState(this.props.golfersRemaining), {
      sortKey: 'priority'
    });
  },

  componentWillReceiveProps: function (nextProps) {
    const newState = this._getSelectionState(nextProps.golfersRemaining);
    this.setState(newState);
  },

  render: function () {
    const golfersRemaining = this.props.golfersRemaining;
    const currentPick = this.props.currentPick;
    const sortKey = this.state.sortKey;
    const isProxyPick = this._isProxyPick();
    const sortedGolfers = this._sortedGolfers(golfersRemaining, sortKey);

    let header = null;
    if (!isProxyPick) {
      header = (<h4>It&#8217;s your turn! Make your pick.</h4>);
    } else {
      const playerName = PlayerStore.getPlayer(currentPick.player).name;
      header = (
        <section>
          <h4>Make a pick for: {playerName}</h4>
          <p>
            <a href="#" onClick={this._onStopTakingPick}>
              I&#39;ll stop making picks for {playerName}
            </a>
          </p>
        </section>
      );
    }

    return (
      <GolfDraftPanel heading='Draft Picker'>
        {header}

        <div className="btn-group" role="group" aria-label="Sorting choices">
          <label>Sort players by:</label><br />
          <button
            type="button"
            className={cx({
              "btn btn-default": true,
              "active": sortKey === 'priority'
            })}
            onClick={_.partial(this._setSortKey, 'priority')}
          >User Priority</button>
          <button
            type="button"
            className={cx({
              "btn btn-default": true,
              "active": sortKey === 'name'
            })}
            onClick={_.partial(this._setSortKey, 'name')}
          >First Name</button>
          <button
            type="button"
            className={cx({
              "btn btn-default": true,
              "active": sortKey === 'wgr'
            })}
            onClick={_.partial(this._setSortKey, 'wgr')}
          >World Golf Ranking</button>
        </div>

        <form role="form">
        {isProxyPick && sortKey === 'priority' ? (
          <div>
            <button
              style={{marginTop: "2em"}}
              className="btn btn-default btn-primary"
              onClick={this._onProxyPriorityPick}
            >Auto-pick next player on priority list</button>
          </div>
        ) : (
          <div>
            <div className="form-group">
              <label labelFor="golfersRemaining">Select your player:</label>
              <select
                id="golfersRemaining"
                value={this.state.selectedGolfer}
                onChange={this._onChange}
                size="10"
                className="form-control"
              >
                {_.map(sortedGolfers, function (g) {
                  return (
                    <option key={g.id} value={g.id}>
                      {GolferLogic.renderGolfer(g)}
                    </option>
                  );
                })}
              </select>
            </div>
            <button
              className="btn btn-default btn-primary"
              onClick={this._onSubmit}
            >
              Pick
            </button>
          </div>
        )}
        </form>
      </GolfDraftPanel>
    );
  },

  _isProxyPick: function () {
    return this.props.currentUser.player !== this.props.currentPick.player;
  },

  _sortedGolfers: function (golfers, sortKey) {
    const isProxyPick = this._isProxyPick();
    if (sortKey === 'priority') {
      if (isProxyPick) {
        // special case, we cannot show the full list if this a proxy pick
        return null;
      } else {
        return _.chain(this.props.syncedPriority)
        .map(GolferStore.getGolfer)
        .value();
      }
    }
    return _.sortBy(golfers, [sortKey, 'name']);
  },

  _getSelectionState: function (golfersRemaining) {
    const state = this.state || {};
    const sortKey = state.sortKey || 'priority';
    let selectedGolfer = state.selectedGolfer;

    if (!selectedGolfer || !golfersRemaining[selectedGolfer]) {
      const firstGolfer = _.first(this._sortedGolfers(golfersRemaining, sortKey));
      selectedGolfer = firstGolfer ? firstGolfer.id : null;
    }
    return {
      selectedGolfer: selectedGolfer
    };
  },

  _onChange: function (ev) {
    this.setState({ selectedGolfer: ev.target.value });
  },

  _setSortKey: function (sortKey) {
    if (sortKey === this.state.sortKey) return;

    const golfersRemaining = this.props.golfersRemaining;
    const firstGolfer = _.first(this._sortedGolfers(golfersRemaining, sortKey));
    const selectedGolfer = firstGolfer ? firstGolfer.id : null;
    this.setState({
      sortKey: sortKey,
      selectedGolfer: selectedGolfer
    });
  },

  _onProxyPriorityPick: function (ev) {
    ev.preventDefault();
    DraftActions.makeHighestPriorityPick();
  },

  _onSubmit: function (ev) {
    ev.preventDefault();
    DraftActions.makePick(this.state.selectedGolfer);
  },

  _onStopTakingPick: function (ev) {
    ev.preventDefault();
    DraftActions.stopDraftingForPlayer(this.props.currentPick.player);
  }

});

module.exports = DraftChooser;
