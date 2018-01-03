"use strict";

const $ = require("jquery");
const _ = require("lodash");
const DraftActions = require("../actions/DraftActions");
const GolferLogic = require("../logic/GolferLogic");
const GolferStore = require("../stores/GolferStore");
const React = require("react");

const MIN_COEFF = 0.61;

const SuggestionSelector = React.createClass({

  getInitialState: function () {
    const results = this.props.suggestion.results;
    const isViewingAll = _.isEmpty(results) || results[0].coeff < MIN_COEFF;
    return {
      isViewingAll: isViewingAll
    };
  },

  render: function () {
    const suggestion = this.props.suggestion;
    const isViewingAll = this.state.isViewingAll;
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
    const suggestion = this.props.suggestion;
    const selectedValue = this.props.selectedValue;
    const suggestionList = this._getSuggestionList();
    const isViewingAll = this.state.isViewingAll;
    const disabled = this.props.disabled;

    if (!isViewingAll) {
      return (
        <div>
          {_.map(suggestionList, function (targetName) {
            const radioId = suggestion.source + "_" + targetName;
            return (
              <div key={targetName} className="radio">
                <label>
                  <input
                    disabled={disabled}
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
        <select disabled={disabled} className="form-control" value={selectedValue} onChange={this._onSelectValueChange}>
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
    const isViewingAll = this.state.isViewingAll;
    let results = this.props.suggestion.results;

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

const FreeTextPickListEditor = React.createClass({

  getInitialState: function () {
    return {
      text: "",
      isPosting: false,
      suggestions: null,
      suggestionSelections: {},
      errorMessage: null
    };
  },

  render: function () {
    const suggestions = this.state.suggestions;
    if (!suggestions) {
      return this._renderFreeText();
    } else {
      return this._renderSuggestions();
    }
  },

  _renderSuggestions: function () {
    const suggestions = this.state.suggestions;
    const suggestionSelections = this.state.suggestionSelections;
    const isPosting = this.state.isPosting;
    const errorMessage = this.state.errorMessage;
    return (
      <div>
        <div className="text-right" style={{marginBottom: "1em"}}>
          <button
            className="btn btn-default"
            type="button"
            onClick={this.props.onCancel}
            disabled={isPosting}
          >Cancel</button>
        </div>
        {!errorMessage ? null : (
          <div className="alert alert-danger">{errorMessage}</div>
        )}
        <div className="alert alert-warning">Could not get an exact name match on the following golfers:</div>
        {_.map(suggestions, function (suggestion) {
          return (
            <SuggestionSelector
              disabled={isPosting}
              key={suggestion.source}
              suggestion={suggestion}
              selectedValue={suggestionSelections[suggestion.source]}
              onSelectionChange={this._onSuggestionSelectionChange.bind(this, suggestion.source)}
            />
          );
        }, this)}
        <div className="text-right">
          <button
            className="btn btn-default"
            type="button"
            onClick={this.props.onCancel}
            disabled={isPosting}
          >Cancel</button>
          <span> </span>
          <button
            className="btn btn-primary"
            type="button"
            onClick={this._onSave}
            disabled={isPosting}
          >Save</button>
        </div>
      </div>
    );
  },

  _renderFreeText: function () {
    const text = this.state.text;
    const isPosting = this.state.isPosting;
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
            className="btn btn-primary"
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
    const suggestionSelections = this.state.suggestionSelections;
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
    const suggestionSelections = {};
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
    const updateObj = {};
    updateObj[source] = target;

    const newSuggestionSelections = _.extend({}, this.state.suggestionSelections, updateObj);
    this.setState({ suggestionSelections: newSuggestionSelections });
  },

  _onSave: function () {
    this.setState({ isPosting: true });

    const data = { priorityNames: this._cleanedGolfers() };
    $.post('/draft/priority', data)

    .done(function (result) {
      DraftActions.setPriority(result.priority);
      this.props.onComplete();
      window.location.href = "#InlineDraftPriorityEditor";
    }.bind(this))

    .fail(function (err) {
      if (err.status === 300) {
        this._setSuggestions(err.responseJSON.suggestions);
      } else {
        this.setState({
          isPosting: false,
          errorMessage: "Failed to save priority. Try again in a minute. If that doesn't work, contact Odle."
        });
      }
      window.location.href = "#InlineDraftPriorityEditor";
    }.bind(this));
  }

});

module.exports = FreeTextPickListEditor;
