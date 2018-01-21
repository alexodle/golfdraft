import * as $ from 'jquery';
import * as _ from 'lodash';
import * as React from 'react';
import DraftActions from '../actions/DraftActions';
import GolferLogic from '../logic/GolferLogic';
import GolferStore from '../stores/GolferStore';

const MIN_COEFF = 0.5;
const TEXTAREA_PLACEHOLDER = "Sergio Garcia\nPhil Mickelson\nTiger Woods\nDustin Johnson\nJason Day\n...";

interface SuggestionOption {
  target: string;
  dist: number;
  coeff: number;
}

interface Suggestion {
  source: string;
  results: SuggestionOption[];
}

interface SuggestionSelectorProps {
  suggestion: Suggestion;
  hasGoodSuggestion: boolean;
  selectedValue: string;
  disabled: boolean;
  onSelectionChange: (target: string) => void;
}

interface SuggestionSelectorState {
  isViewingAll: boolean;
}

function calcHasGoodSuggestion(results: SuggestionOption[]) {
  return results[0].coeff >= MIN_COEFF;
}

class SuggestionSelector extends React.Component<SuggestionSelectorProps, SuggestionSelectorState> {

  constructor(props) {
    super(props);
    this.state = { isViewingAll: !this.props.hasGoodSuggestion };
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
      .map('target')
      .sortBy()
      .value();

    return (
      <section>
        {hasGoodSuggestion ? null : (
          <p className='text-danger'><em>Could not find a potential match.. Please select golfer from list:</em></p>
        )}
        <select
          className='form-control'
          value={selectedValue}
          onChange={this._onSelectValueChange}
        >
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
    this.props.onSelectionChange(ev.target.value);
  }

  _onViewAll = (ev) => {
    ev.preventDefault();
    this.setState({ isViewingAll: true });
  }

};

export interface FreeTextPickListEditorProps {
  onCancel: () => void;
  onComplete: () => void;
}

interface FreeTextPickListEditorState {
  text: string;
  isPosting: boolean;
  suggestions?: Suggestion[];
  suggestionSelections: { [key: string]: SuggestionOption };
  errorMessage?: string;
}

export default class FreeTextPickListEditor extends React.Component<FreeTextPickListEditorProps, FreeTextPickListEditorState> {

  constructor(props) {
    super(props);
    this.state = {
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
        {_.map(suggestions, (suggestion: Suggestion) => {
          const hasGoodSuggestion = calcHasGoodSuggestion(suggestion.results);
          return (
            <SuggestionSelector
              key={suggestion.source}
              hasGoodSuggestion={hasGoodSuggestion}
              disabled={isPosting}
              suggestion={suggestion}
              selectedValue={suggestionSelections[suggestion.source].target}
              onSelectionChange={(target: string) => this._onSuggestionSelectionChange(suggestion.source, target)}
            />
          );
        })}
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

  _onSuggestionSelectionChange = (source: string, target: string) => {
    const newSuggestionSelections = _.extend({}, this.state.suggestionSelections, { [source]: target });
    this.setState({ suggestionSelections: newSuggestionSelections });
  }

  _onSave = () => {
    this.setState({ isPosting: true });

    const data = { pickListNames: this._cleanedGolfers() };
    $.post('/draft/pickList', data)

      .done((result) => {
        DraftActions.setPickList(result.pickList);
        this.props.onComplete();
      })

      .fail((err) => {
        if (err.status === 300) {
          this._setSuggestions(err.responseJSON.suggestions);
        } else {
          this.setState({
            isPosting: false,
            errorMessage: 'Failed to save pickList. Try again in a minute. If that doesn\'t work, contact Odle.'
          });
        }
        window.location.href = '#InlinePickListEditor';
      });
  }

};
