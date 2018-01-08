'use strict';

const $ = require('jquery');
const _ = require('lodash');
const DraftActions = require('../actions/DraftActions');
const GolferLogic = require('../logic/GolferLogic');
const GolferStore = require('../stores/GolferStore');
const React = require('react');

const MIN_COEFF = 0.5;
const TEXTAREA_PLACEHOLDER = "Sergio Garcia\nPhil Mickelson\nTiger Woods\nDustin Johnson\nJason Day\n...";

function calcHasGoodSuggestion(results) {
  return results[0].coeff >= MIN_COEFF;
}

const SuggestionSelector = React.createClass({

  getInitialState: function () {
    return {
      isViewingAll: !this.props.hasGoodSuggestion
    };
  },

  render: function () {
    const suggestion = this.props.suggestion;
    const hasGoodSuggestion = this.props.hasGoodSuggestion;
    const isViewingAll = this.state.isViewingAll;

    return (
      <div key={suggestion.source} className='panel panel-default'>
        <div className='panel-body'>

          <div className='row'>
            <div className='col-md-2'>
              <p><em>You entered:</em></p>
            </div>
            <div className='col-md-10'>
              <b>{suggestion.source}</b>
            </div>
          </div>

          {isViewingAll ?
            this._renderChoices() :
            this._renderSuggestion()
          }
        </div>
      </div>
    );
  },

  _renderSuggestion: function () {
    const selectedValue = this.props.selectedValue;
    return (
      <section>
        <div className='row'>
          <div className='col-md-2'>
            <p><em>Did you mean:</em></p>
          </div>
          <div className='col-md-10'>
            <b>{selectedValue}</b>
          </div>
        </div>
        <p><a href="#" onClick={this._viewAll}>Nope</a></p>
      </section>
    );
  },

  _renderChoices: function () {
    const selectedValue = this.props.selectedValue;
    const disabled = this.props.disabled;
    const hasGoodSuggestion = this.props.hasGoodSuggestion;
    const suggestions = _.chain(this.props.suggestion.results)
      .pluck('target')
      .sortBy()
      .value();

    return (
      <section>
        {hasGoodSuggestion ? null : (
          <p className='text-danger'><em>Could not find a potential match.. Please select golfer from list:</em></p>
        )}
        <select disabled={disabled} className='form-control' value={selectedValue} onChange={this._onSelectValueChange}>
          {_.map(suggestions, function (targetName, i) {
            return (
              <option key={targetName} value={targetName}>{targetName}</option>
            );
          })}
        </select>
      </section>
    );
  },

  _onSelectValueChange: function (ev) {
    this.props.onSelectionChange(ev.target.value);
  },

  _viewAll: function (ev) {
    ev.preventDefault();
    this.setState({ isViewingAll: true });
  }

});

const FreeTextPickListEditor = React.createClass({

  getInitialState: function () {
    return {
      text: '',
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
        <div className='text-right' style={{marginBottom: '1em'}}>
          <button
            className='btn btn-default'
            type='button'
            onClick={this.props.onCancel}
            disabled={isPosting}
          >Cancel</button>
        </div>
        {!errorMessage ? null : (
          <div className='alert alert-danger'>{errorMessage}</div>
        )}
        <div className='alert alert-warning'>Could not find an exact match for all golfers. Please verify the following matches are correct:</div>
        {_.map(suggestions, function (suggestion) {
          const hasGoodSuggestion = calcHasGoodSuggestion(suggestion.results);
          return (
            <SuggestionSelector
              hasGoodSuggestion={hasGoodSuggestion}
              disabled={isPosting}
              key={suggestion.source}
              suggestion={suggestion}
              selectedValue={suggestionSelections[suggestion.source]}
              onSelectionChange={this._onSuggestionSelectionChange.bind(this, suggestion.source)}
            />
          );
        }, this)}
        <div className='text-right'>
          <button
            className='btn btn-default'
            type='button'
            onClick={this.props.onCancel}
            disabled={isPosting}
          >Cancel</button>
          <span> </span>
          <button
            className='btn btn-primary'
            type='button'
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
        <div className='text-right'>
          <button
            className='btn btn-default'
            type='button'
            onClick={this.props.onCancel}
            disabled={isPosting}
          >Cancel</button>
          <span> </span>
          <button
            className='btn btn-primary'
            type='button'
            onClick={this._onSave}
            disabled={isPosting}
          >Save</button>
        </div>
        <p>One golfer per line:</p>
        <textarea
          className='form-control'
          placeholder={TEXTAREA_PLACEHOLDER}
          disabled={isPosting}
          style={{width:'100%', height: '30em', resize: 'vertical'}}
          onChange={this._onChange}
          value={text}
        />
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
      let selection = suggestion.results[0].target;
      if (!calcHasGoodSuggestion(suggestion.results)) {
        selection = _.chain(suggestion.results)
          .sortBy('target')
          .first()
          .value();
      }
      suggestionSelections[suggestion.source] = selection;
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
    $.put('/draft/priority', data)

    .done(function (result) {
      DraftActions.setPriority(result.priority);
      this.props.onComplete();
    }.bind(this))

    .fail(function (err) {
      if (err.status === 300) {
        this._setSuggestions(err.responseJSON.suggestions);
      } else {
        this.setState({
          isPosting: false,
          errorMessage: 'Failed to save priority. Try again in a minute. If that doesn&#39;t work, contact Odle.'
        });
      }
      window.location.href = '#InlinePickListEditor';
    }.bind(this));
  }

});

module.exports = FreeTextPickListEditor;
