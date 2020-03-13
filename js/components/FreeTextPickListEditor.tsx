import { isEmpty, uniq } from 'lodash';
import * as React from 'react';
import DraftActions from '../actions/DraftActions';
import { Indexed } from '../types/ClientTypes';
import { postJson } from '../fetch';

const TEXTAREA_PLACEHOLDER = "Sergio Garcia\nPhil Mickelson\nTiger Woods\nDustin Johnson\nJason Day\n...";

interface SuggestionOption {
  target: string;
  dist: number;
  coeff: number;
}

interface Suggestion {
  type: 'SUGGESTION';
  source: string;
  allResults: SuggestionOption[];
  isGoodSuggestion: boolean;
  suggestion: string;
}

interface Match {
  type: 'EXACT';
  source: string;
}

type SuggestionResponse = Match | Suggestion;


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

export interface FreeTextPickListEditorProps {
  onCancel?: () => void;
  onComplete: () => void;
}

interface FreeTextPickListEditorState {
  text: string;
  isPosting: boolean;
  suggestions?: SuggestionResponse[];
  errorMessage?: string;
}

interface SuggestionSelectorsProps {
  errorMessage: string;
  suggestions: SuggestionResponse[];
  isPosting: boolean;
  onCancel: () => void;
  onSave: (pickListNames: string[]) => void;
}

interface SuggestionSelectorsState {
  selections: Indexed<string>;
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
    const hasGoodSuggestion = this.props.hasGoodSuggestion;
    const suggestions = this.props.suggestion.allResults
      .map(r => r.target)
      .sort();

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
          {suggestions.map(targetName => (
            <option key={targetName} value={targetName}>{targetName}</option>
          ))}
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

class SuggestionSelectors extends React.Component<SuggestionSelectorsProps, SuggestionSelectorsState> {

  constructor(props: SuggestionSelectorsProps) {
    super(props);

    const initialSelections = {};
    props.suggestions.forEach(s => {
      if (s.type === "EXACT") {
        initialSelections[s.source] = s.source;
      } else {
        initialSelections[s.source] = s.suggestion;
      }
    });

    this.state = {
      selections: initialSelections
    }
  }

  render() {
    const { suggestions, errorMessage, isPosting, onCancel } = this.props;
    const { selections } = this.state;
    return (
      <div>
        <div className='text-right' style={{ marginBottom: '1em' }}>
          <button
            className='btn btn-default'
            type='button'
            onClick={onCancel}
            disabled={isPosting}
          >Back</button>
        </div>
        {!errorMessage ? null : (
          <div className='alert alert-danger'>{errorMessage}</div>
        )}
        <div className='alert alert-warning'>Could not find an exact name match for all golfers. Please verify the following matches are correct:</div>
        {suggestions.map(s => (s.type === "EXACT" ? null : (
          <SuggestionSelector
            key={s.source}
            hasGoodSuggestion={s.isGoodSuggestion}
            disabled={isPosting}
            suggestion={s}
            selectedValue={selections[s.source]}
            onSelectionChange={(target: string) => this._onSuggestionSelectionChange(s.source, target)}
          />
        )))}
        <div className='text-right'>
          <button
            className='btn btn-default'
            type='button'
            onClick={onCancel}
            disabled={isPosting}
          >Back</button>
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

  _onSuggestionSelectionChange(source: string, target: string) {
    this.setState({ selections: { ...this.state.selections, [source]: target } });
  }

  _onSave = () => {
    const newPicks = this.props.suggestions.map(s => this.state.selections[s.source]);
    this.props.onSave(newPicks);
  }

}

export default class FreeTextPickListEditor extends React.Component<FreeTextPickListEditorProps, FreeTextPickListEditorState> {

  constructor(props) {
    super(props);
    this.state = {
      text: '',
      isPosting: false,
      suggestions: null,
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
    return (
      <SuggestionSelectors
        errorMessage={this.state.errorMessage}
        suggestions={this.state.suggestions}
        isPosting={this.state.isPosting}
        onCancel={this._onSuggestionCancel}
        onSave={this._onSaveSuggestions}
      />
    );
  }

  _onSuggestionCancel = () => {
    this.setState({ suggestions: null });
  }

  _onSaveSuggestions = (pickListNames: string[]) => {
    this._save(pickListNames);
  }

  _onSaveFreeText = () => {
    this._save(this._cleanedGolfers());
  }

  _renderFreeText() {
    const text = this.state.text;
    const isPosting = this.state.isPosting;
    return (
      <div>
        <div className='text-right'>
          {!this.props.onCancel ? null : (
            <span>
              <button
                className='btn btn-default'
                type='button'
                onClick={this.props.onCancel}
                disabled={isPosting}
              >Cancel</button>{" "}
            </span>
          )}
          <button
            className='btn btn-primary'
            type='button'
            onClick={this._onSaveFreeText}
            disabled={isPosting || isEmpty(text)}
          >Save</button>
        </div>
        <p>One golfer per line:</p>
        <textarea
          className='form-control'
          placeholder={TEXTAREA_PLACEHOLDER}
          disabled={isPosting}
          style={{ width: '100%', height: '30em', resize: 'vertical' }}
          onChange={this._onChange}
          value={text}
        />
      </div>
    );
  }

  _onChange = (ev) => {
    this.setState({ text: ev.target.value });
  }

  _setSuggestions(suggestions: SuggestionResponse[]) {
    this.setState({
      isPosting: false,
      suggestions
    });
  }

  async _save(pickListNames: string[]) {
    this.setState({ isPosting: true });

    try {
      const data = { pickListNames };
      const result = await postJson('/draft/pickList', data);
      DraftActions.setPickList(result.pickList);
      this.props.onComplete();
    } catch (err) {
      const resp = err.response as Response;
      if (resp.status === 300) {
        const json = await resp.json();
        this._setSuggestions(json.suggestions);
      } else {
        this.setState({
          isPosting: false,
          errorMessage: 'Failed to save pickList. Try again in a minute. If that doesn\'t work, contact Odle.'
        });
      }

      window.location.href = '#InlinePickListEditor';
    }
  }

  _cleanedGolfers() {
    return uniq(this.state.text
      .split('\n')
      .map(l => l.trim())
      .filter(g => !isEmpty(g)));
  }

};
