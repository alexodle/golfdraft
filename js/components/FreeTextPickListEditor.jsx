"use strict";

var $ = require("jquery");
var _ = require("lodash");
var DraftActions = require("../actions/DraftActions");
var GolferLogic = require("../logic/GolferLogic");
var GolferStore = require("../stores/GolferStore");
var React = require("react");

var MIN_COEFF = 0.61;

var SuggestionSelector = React.createClass({

  getInitialState: function () {
    var results = this.props.suggestion.results;
    var isViewingAll = _.isEmpty(results) || results[0].coeff < MIN_COEFF;
    return {
      isViewingAll: isViewingAll
    };
  },

  render: function () {
    var suggestion = this.props.suggestion;
    var isViewingAll = this.state.isViewingAll;
    return (
      <div key={suggestion.source} className="panel panel-default">
        <div className="panel-body">
          <p>You entered: <b>{suggestion.source}</b></p>
          <p><small><em>Did you mean:</em></small></p>
          {this._renderChoices()}
          {isViewingAll ? null : (
            <a href="#" onClick={this._viewAll}>None of the above</a>
          )}
        </div>
      </div>
    );
  },

  _renderChoices: function () {
    var suggestion = this.props.suggestion;
    var selectedValue = this.props.selectedValue;
    var suggestionList = this._getSuggestionList();
    var isViewingAll = this.state.isViewingAll;

    if (!isViewingAll) {
      return (
        <div>
          {_.map(suggestionList, function (targetName) {
            var radioId = suggestion.source + "_" + targetName;
            return (
              <div key={targetName} className="radio">
                <label>
                  <input
                    type="radio"
                    name={suggestion.source}
                    id={radioId}
                    value={targetName}
                    checked={targetName === selectedValue}
                    onChange={this._onRadioChange.bind(this, targetName)}
                  /> {targetName}
                </label>
              </div>
            );
          }, this)}
        </div>
      );
    } else {

      return (
        <select className="form-control" value={selectedValue} onChange={this._onSelectValueChange}>
          {_.map(suggestionList, function (targetName, i) {
            return (
              <option key={targetName} value={targetName}>{targetName}</option>
            );
          })}
        </select>
      );
    }
  },

  _getSuggestionList: function () {
    var isViewingAll = this.state.isViewingAll;
    var results = this.props.suggestion.results;

    if (!isViewingAll) {
      results = _.filter(results, function (r) {
        return r.coeff > MIN_COEFF;
      });
    } else {
      results = _.sortBy(results, 'target');
    }

    return _.pluck(results, 'target');
  },

  _viewAll: function (ev) {
    ev.preventDefault();
    this.setState({ isViewingAll: true });
  },

  _onSelectValueChange: function (ev) {
    this.props.onSelectionChange(ev.target.value);
  },

  _onRadioChange: function (targetName) {
    this.props.onSelectionChange(targetName);
  }

});

var FreeTextPickListEditor = React.createClass({

  getInitialState: function () {
    return {
      text: "Chris Wood2\nJohnny Miller\nJason Gay",
      isPosting: false,
      suggestions: null,
      suggestionSelections: {}
    };
  },

  render: function () {
    var suggestions = this.state.suggestions;
    if (!suggestions) {
      return this._renderFreeText();
    } else {
      return this._renderSuggestions();
    }
  },

  _renderSuggestions: function () {
    var suggestions = this.state.suggestions;
    var suggestionSelections = this.state.suggestionSelections;
    return (
      <div>
        <div className="alert alert-warning">Could not get an exact name match on the following golfers.</div>
        {_.map(suggestions, function (suggestion) {
          return (
            <SuggestionSelector
              key={suggestion.source}
              suggestion={suggestion}
              selectedValue={suggestionSelections[suggestion.source]}
              onSelectionChange={this._onSuggestionSelectionChange.bind(this, suggestion.source)}
            />
          );
        }, this)}
        <button className="btn btn-primary" type="button" onClick={this._onSave}>Looks good</button>
      </div>
    );
  },

  _renderFreeText: function () {
    var text = this.state.text;
    var isPosting = this.state.isPosting;
    return (
      <div>
        <div className="text-right">
          <button
            className="btn btn-default"
            type="button"
            onClick={this.props.onCancel}
            disabled={isPosting}
          >Cancel</button>
          <span> </span>
          <button
            className="btn btn-default btn-primary"
            type="button"
            onClick={this._onSave}
            disabled={isPosting}
          >Save</button>
        </div>
        <p>One golfer per line:</p>
        <textarea disabled={isPosting} style={{width:"100%", height: "30em"}} onChange={this._onChange} value={text} />
      </div>
    );
  },

  _cleanedGolfers: function () {
    var suggestionSelections = this.state.suggestionSelections;
    return _.chain(this.state.text.split('\n'))
      .invoke('trim')
      .reject(_.isEmpty)
      .map(function (name) {
        return suggestionSelections[name] || name;
      })
      .uniq()
      .value();
  },

  _onChange: function (ev) {
    this.setState({ text: ev.target.value });
  },

  _setSuggestions: function (suggestions) {
    var suggestionSelections = {};
    _.each(suggestions, function (suggestion) {
      suggestionSelections[suggestion.source] = suggestion.results[0].target;
    });

    this.setState({
      isPosting: false,
      suggestionSelections: suggestionSelections,
      suggestions: suggestions
    });
  },

  _onSuggestionSelectionChange: function (source, target) {
    var updateObj = {};
    updateObj[source] = target;

    var newSuggestionSelections = _.extend({}, this.state.suggestionSelections, updateObj);
    this.setState({ suggestionSelections: newSuggestionSelections });
  },

  _onSave: function () {
    this.setState({ isPosting: true });

    var that = this;
    var data = { priorityNames: this._cleanedGolfers() };
    $.post('/draft/priority', data)
    .done(function (result) {
      DraftActions.setPriority(result.priority);
      that.props.onComplete();
    })
    .fail(function (err) {
      if (err.status === 300) {
        that._setSuggestions(err.responseJSON.suggestions);
      } else {
        // Not really handled
        //window.location.reload(); todo TODO
      }
    })
  }

});

module.exports = FreeTextPickListEditor;
