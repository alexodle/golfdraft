"use strict";

var $ = require("jquery");
var _ = require("lodash");
var GolferLogic = require("../logic/GolferLogic");
var GolferStore = require("../stores/GolferStore");
var React = require("react");

var MIN_COEFF = 0.61;

var FreeTextPickListEditor = React.createClass({

  getInitialState: function () {
    return {
      text: "",
      isPosting: false,
      suggestions: null
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
    return (
      <div>
        {_.map(suggestions, function (suggestion) {
          var filteredSuggestions = _.filter(suggestion.results, function (r) {
            return r.coeff > MIN_COEFF;
          });
          return (
            <div key={suggestion.source} className="panel panel-default">
              <div className="panel-body">
                <h3>{suggestion.source}</h3>
                {_.map(filteredSuggestions, function (result) {
                  var radioId = suggestion.source + "_" + result.target;
                  return (
                    <div key={result.target} className="radio">
                      <label>
                        <input type="radio" name={suggestion.source} id={radioId} value={result.target} /> {result.target}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
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
    return _.chain(this.state.text.split('\n'))
      .invoke('trim')
      .reject(_.isEmpty)
      .uniq()
      .value();
  },

  _onChange: function (ev) {
    this.setState({ text: ev.target.value });
  },

  _onSave: function () {
    this.setState({ isPosting: true });

    var that = this;
    var data = { priorityNames: this._cleanedGolfers() };
    $.post('/draft/priority', data)
    .done(function (result) {
      console.log('TODO');
    })
    .fail(function (err) {
      if (err.status === 300) {
        that.setState({
          isPosting: false,
          suggestions: err.responseJSON.suggestions
        });
      } else {
        // Not really handled
        window.location.reload();
      }
    })
  }

});

module.exports = FreeTextPickListEditor;
