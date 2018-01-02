"use strict";

var $ = require("jquery");
var _ = require("lodash");
var GolferLogic = require("../logic/GolferLogic");
var GolferStore = require("../stores/GolferStore");
var React = require("react");

var FreeTextPickListEditor = React.createClass({

  getInitialState: function () {
    return {
      text: "",
      isPosting: false
    };
  },

  render: function () {
    return (
      <div>
        <div className="text-right">
          <button
            className="btn btn-default"
            type="button"
            onClick={this.props.onCancel}
          >Cancel</button>
          <span> </span>
          <button
            className="btn btn-default btn-primary"
            type="button"
            onClick={this._onSave}
          >Save</button>
        </div>
        <p>One golfer per line:</p>
        <textarea style={{width:"100%", height: "30em"}} onChange={this._onChange} value={this.state.text} />
      </div>
    );
  },

  _cleanedGolfers: function () {
    return _.chain(this.state.text.split('\n'))
      .invoke('trim')
      .reject(_.isEmpty)
      .value();
  },

  _onChange: function (ev) {
    this.setState({ text: ev.target.value });
  },

  _onSave: function () {
    this.setState({ isPosting: true });

    var data = { priorityNames: this._cleanedGolfers() };
    $.post('/draft/priority', data)
    .done(function () {
      console.log('Huh? TODO');
    })
    .fail(function (err) {
      console.log(err);
    })
  }

});

module.exports = FreeTextPickListEditor;
