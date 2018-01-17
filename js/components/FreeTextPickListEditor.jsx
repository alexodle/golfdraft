// @flow
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

class SuggestionSelector extends React.Component {

  constructor(props) {
    super(props);
    this.state = this._getInitialState();
  }

  _getInitialState() {
    return {
      isViewingAll: !this.props.hasGoodSuggestion
    };
  }

  render() {
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
  }

  _renderSuggestion() {
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
        <p><a href="#" onClick={this._onViewAll}>Nope</a></p>
      </section>
    );
  }

  _renderChoices() {
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
  }

  _onSelectValueChange = (ev) => {
    const target = _.find(this.props.suggestion.results, { target: ev.target.value });
    this.props.onSelectionChange(target);
  }

  _onViewAll = (ev) => {
    ev.preventDefault();
    this.setState({ isViewingAll: true });
  }

};

class FreeTextPickListEditor extends React.Component {

  constructor(props) {
    super(props);
    this.state = this._getInitialState();
  }

  _getInitialState() {
    return {
      text: '',
      isPosting: false,
      suggestions: null,
      suggestionSelections: {},
      errorMessage: null
    };
  }

  render() {
    const suggestions = this.state.suggestions;
    if (!suggestions) {
      return this._renderFreeText();
    } else {
      return this._renderSuggestions();
    }
  }

  _renderSuggestions() {
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
              selectedValue={suggestionSelections[suggestion.source].target}
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
  }

  _renderFreeText() {
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
  }

  _cleanedGolfers() {
    const suggestionSelections = this.state.suggestionSelections;
    return _.chain(this.state.text.split('\n'))
      .invoke('trim')
      .reject(_.isEmpty)
      .map(function (name) {
        return suggestionSelections[name] ? suggestionSelections[name].target : name;
      })
      .uniq()
      .value();
  }

  _onChange = (ev) => {
    this.setState({ text: ev.target.value });
  }

  _setSuggestions(suggestions) {
    const suggestionSelections = {};
    _.each(suggestions, function (suggestion) {
      let selection = suggestion.results[0];
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
  }

  _onSuggestionSelectionChange = (source, target) => {
    const newSuggestionSelections = _.extend({}, this.state.suggestionSelections, { [source]: target });
    this.setState({ suggestionSelections: newSuggestionSelections });
  }

  _onSave = () => {
    this.setState({ isPosting: true });

    const data = { pickListNames: this._cleanedGolfers() };
    $.post('/draft/pickList', data)

      .done(function (result) {
        DraftActions.setPickList(result.pickList);
        this.props.onComplete();
      }.bind(this))

      .fail(function (err) {
        if (err.status === 300) {
          this._setSuggestions(err.responseJSON.suggestions);
        } else {
          this.setState({
            isPosting: false,
            errorMessage: 'Failed to save pickList. Try again in a minute. If that doesn\'t work, contact Odle.'
          });
        }
        window.location.href = '#InlinePickListEditor';
      }.bind(this));
  }

};

module.exports = FreeTextPickListEditor;
