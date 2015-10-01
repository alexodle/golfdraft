'use strict';

var _ = require('lodash');
var cx = require('react/lib/cx');
var DraftActions = require('../actions/DraftActions');
var GolfDraftPanel = require('./GolfDraftPanel.jsx');
var GolferLogic = require('../logic/GolferLogic');
var PlayerStore = require('../stores/PlayerStore');
var React = require('react');

function sortGolfers(golfers, sortKey) {
  return _.sortBy(golfers, [sortKey, 'name']);
}

var DraftChooser = React.createClass({

  getInitialState: function () {
    return _.extend(this._getSelectionState(this.props.golfersRemaining), {
      sortKey: 'name'
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

    var sortedGolfers = sortGolfers(golfersRemaining, sortKey);

    var header = null;
    if (this.props.currentUser.player === currentPick.player) {
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
        </form>
      </GolfDraftPanel>
    );
  },

  _getSelectionState: function (golfersRemaining) {
    var state = this.state || {};
    var selectedGolfer = state.selectedGolfer;
    var sortKey = state.sortKey || 'name';

    if (!selectedGolfer || !golfersRemaining[selectedGolfer]) {
      selectedGolfer = _.first(sortGolfers(golfersRemaining, sortKey)).id;
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
    this.setState({
      sortKey: sortKey,
      selectedGolfer: _.first(sortGolfers(golfersRemaining, sortKey)).id
    });
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
