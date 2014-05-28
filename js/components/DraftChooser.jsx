/** @jsx React.DOM */
'use strict';

var React = require('react');
var _ = require('underscore');

var PlayerStore = require('../stores/PlayerStore');
var DraftActions = require('../actions/DraftActions');

function sortedGolfers(golfers) {
  var sortedGolfers = _.chain(golfers)
    .values()
    .sortBy(function (g) { return g.name; })
    .value();
  return sortedGolfers;
}

var DraftChooser = React.createClass({

  getInitialState: function () {
    return this._getState(this.props.golfersRemaining);
  },

  componentWillReceiveProps: function (nextProps) {
    var newState = this._getState(nextProps.golfersRemaining);
    this.setState(newState);
  },

  render: function () {
    var options = _.chain(sortedGolfers(this.props.golfersRemaining))
      .map(function (g) {
        return (<option key={g.id} value={g.id}>{g.name}</option>);
      })
      .value();
    return (
      <div>
        <div className="panel panel-default">
          <div className="panel-body">
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
                  {options}
                </select>
              </div>
              <button
                className="btn btn-default btn-primary"
                onClick={this._onSubmit}
              >
                Pick
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  },

  _getState: function (golfersRemaining) {
    var selectedGolfer = (this.state || {}).selectedGolfer;
    if (!selectedGolfer || !golfersRemaining[selectedGolfer]) {
      selectedGolfer = sortedGolfers(golfersRemaining)[0].id;
    }
    return {selectedGolfer: selectedGolfer};
  },

  _onChange: function (ev) {
    this.setState({selectedGolfer: ev.target.value});
  },

  _onSubmit: function (ev) {
    ev.preventDefault();
    DraftActions.makePick(this.state.selectedGolfer);
  }

});

module.exports = DraftChooser;
