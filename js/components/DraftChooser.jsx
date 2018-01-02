'use strict';

var _ = require('lodash');
var cx = require('classnames');
var DraftActions = require('../actions/DraftActions');
var GolfDraftPanel = require('./GolfDraftPanel.jsx');
var GolferLogic = require('../logic/GolferLogic');
var GolferStore = require('../stores/GolferStore');
var PlayerStore = require('../stores/PlayerStore');
var React = require('react');

var DraftChooser = React.createClass({

  getInitialState: function () {
    return _.extend(this._getSelectionState(this.props.golfersRemaining), {
      sortKey: 'priority'
    });
  },

  componentWillReceiveProps: function (nextProps) {
    var newState = this._getSelectionState(nextProps.golfersRemaining);
    this.setState(newState);
  },

  render: function () {
    var golfersRemaining = this.props.golfersRemaining;
    var currentPick = this.props.currentPick;
    var sortKey = this.state.sortKey;
    var isProxyPick = this._isProxyPick();
    var sortedGolfers = this._sortedGolfers(golfersRemaining, sortKey);

    var header = null;
    if (!isProxyPick) {
      header = (<h4>It&#8217;s your turn! Make your pick.</h4>);
    } else {
      var playerName = PlayerStore.getPlayer(currentPick.player).name;
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
    var isProxyPick = this._isProxyPick();
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
    var state = this.state || {};
    var selectedGolfer = state.selectedGolfer;
    var sortKey = state.sortKey || 'priority';

    if (!selectedGolfer || !golfersRemaining[selectedGolfer]) {
      var firstGolfer = _.first(this._sortedGolfers(golfersRemaining, sortKey));
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

    var golfersRemaining = this.props.golfersRemaining;
    var firstGolfer = _.first(this._sortedGolfers(golfersRemaining, sortKey));
    var selectedGolfer = firstGolfer ? firstGolfer.id : null;
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
