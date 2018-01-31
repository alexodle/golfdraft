"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const React = require("react");
const DraftActions_1 = require("../actions/DraftActions");
const fetch_1 = require("../fetch");
const MIN_COEFF = 0.5;
const TEXTAREA_PLACEHOLDER = "Sergio Garcia\nPhil Mickelson\nTiger Woods\nDustin Johnson\nJason Day\n...";
function calcHasGoodSuggestion(results) {
    return results[0].coeff >= MIN_COEFF;
}
class SuggestionSelector extends React.Component {
    constructor(props) {
        super(props);
        this._onSelectValueChange = (ev) => {
            this.props.onSelectionChange(ev.target.value);
        };
        this._onViewAll = (ev) => {
            ev.preventDefault();
            this.setState({ isViewingAll: true });
        };
        this.state = { isViewingAll: !this.props.hasGoodSuggestion };
    }
    render() {
        const suggestion = this.props.suggestion;
        const hasGoodSuggestion = this.props.hasGoodSuggestion;
        const isViewingAll = this.state.isViewingAll;
        return (React.createElement("div", { key: suggestion.source, className: 'panel panel-default' },
            React.createElement("div", { className: 'panel-body' },
                React.createElement("div", { className: 'row' },
                    React.createElement("div", { className: 'col-md-2' },
                        React.createElement("p", null,
                            React.createElement("em", null, "You entered:"))),
                    React.createElement("div", { className: 'col-md-10' },
                        React.createElement("b", null, suggestion.source))),
                isViewingAll ?
                    this._renderChoices() :
                    this._renderSuggestion())));
    }
    _renderSuggestion() {
        const selectedValue = this.props.selectedValue;
        return (React.createElement("section", null,
            React.createElement("div", { className: 'row' },
                React.createElement("div", { className: 'col-md-2' },
                    React.createElement("p", null,
                        React.createElement("em", null, "Did you mean:"))),
                React.createElement("div", { className: 'col-md-10' },
                    React.createElement("b", null, selectedValue))),
            React.createElement("p", null,
                React.createElement("a", { href: "#", onClick: this._onViewAll }, "Nope"))));
    }
    _renderChoices() {
        const selectedValue = this.props.selectedValue;
        const disabled = this.props.disabled;
        const hasGoodSuggestion = this.props.hasGoodSuggestion;
        const suggestions = _.chain(this.props.suggestion.results)
            .map('target')
            .sortBy()
            .value();
        return (React.createElement("section", null,
            hasGoodSuggestion ? null : (React.createElement("p", { className: 'text-danger' },
                React.createElement("em", null, "Could not find a potential match.. Please select golfer from list:"))),
            React.createElement("select", { className: 'form-control', value: selectedValue, onChange: this._onSelectValueChange }, _.map(suggestions, function (targetName, i) {
                return (React.createElement("option", { key: targetName, value: targetName }, targetName));
            }))));
    }
}
;
class FreeTextPickListEditor extends React.Component {
    constructor(props) {
        super(props);
        this._onChange = (ev) => {
            this.setState({ text: ev.target.value });
        };
        this._onSuggestionSelectionChange = (source, target) => {
            const newSuggestionSelections = _.extend({}, this.state.suggestionSelections, { [source]: target });
            this.setState({ suggestionSelections: newSuggestionSelections });
        };
        this._onSave = () => {
            this.setState({ isPosting: true });
            const data = { pickListNames: this._cleanedGolfers() };
            fetch_1.postJson('/draft/pickList', data)
                .then((result) => {
                DraftActions_1.default.setPickList(result.pickList);
                this.props.onComplete();
            })
                .catch((err) => {
                const resp = err.response;
                if (resp.status === 300) {
                    return resp.json()
                        .then((json) => this._setSuggestions(json.suggestions));
                }
                else {
                    this.setState({
                        isPosting: false,
                        errorMessage: 'Failed to save pickList. Try again in a minute. If that doesn\'t work, contact Odle.'
                    });
                }
                window.location.href = '#InlinePickListEditor';
            });
        };
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
        }
        else {
            return this._renderSuggestions();
        }
    }
    _renderSuggestions() {
        const suggestions = this.state.suggestions;
        const suggestionSelections = this.state.suggestionSelections;
        const isPosting = this.state.isPosting;
        const errorMessage = this.state.errorMessage;
        return (React.createElement("div", null,
            React.createElement("div", { className: 'text-right', style: { marginBottom: '1em' } },
                React.createElement("button", { className: 'btn btn-default', type: 'button', onClick: this.props.onCancel, disabled: isPosting }, "Cancel")),
            !errorMessage ? null : (React.createElement("div", { className: 'alert alert-danger' }, errorMessage)),
            React.createElement("div", { className: 'alert alert-warning' }, "Could not find an exact match for all golfers. Please verify the following matches are correct:"),
            _.map(suggestions, (suggestion) => {
                const hasGoodSuggestion = calcHasGoodSuggestion(suggestion.results);
                return (React.createElement(SuggestionSelector, { key: suggestion.source, hasGoodSuggestion: hasGoodSuggestion, disabled: isPosting, suggestion: suggestion, selectedValue: suggestionSelections[suggestion.source].target, onSelectionChange: (target) => this._onSuggestionSelectionChange(suggestion.source, target) }));
            }),
            React.createElement("div", { className: 'text-right' },
                React.createElement("button", { className: 'btn btn-default', type: 'button', onClick: this.props.onCancel, disabled: isPosting }, "Cancel"),
                React.createElement("span", null, " "),
                React.createElement("button", { className: 'btn btn-primary', type: 'button', onClick: this._onSave, disabled: isPosting }, "Save"))));
    }
    _renderFreeText() {
        const text = this.state.text;
        const isPosting = this.state.isPosting;
        return (React.createElement("div", null,
            React.createElement("div", { className: 'text-right' },
                React.createElement("button", { className: 'btn btn-default', type: 'button', onClick: this.props.onCancel, disabled: isPosting }, "Cancel"),
                React.createElement("span", null, " "),
                React.createElement("button", { className: 'btn btn-primary', type: 'button', onClick: this._onSave, disabled: isPosting }, "Save")),
            React.createElement("p", null, "One golfer per line:"),
            React.createElement("textarea", { className: 'form-control', placeholder: TEXTAREA_PLACEHOLDER, disabled: isPosting, style: { width: '100%', height: '30em', resize: 'vertical' }, onChange: this._onChange, value: text })));
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
}
exports.default = FreeTextPickListEditor;
;
