'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
class AppPausedStatus extends React.Component {
    render() {
        return (React.createElement("div", { className: "jumbotron" },
            React.createElement("h1", null, "Pause!"),
            React.createElement("p", null,
                React.createElement("em", null,
                    React.createElement("small", null, "noun")),
                React.createElement("ol", null,
                    React.createElement("li", null,
                        React.createElement("span", null, "a temporary stop in action or speech."),
                        React.createElement("br", null),
                        React.createElement("span", { className: 'dict-definition' },
                            "\"she dropped me outside during a brief pause in the rain\"",
                            React.createElement("br", null),
                            React.createElement("em", null, "synonyms:"),
                            " stop, cessation, break, halt, interruption, check, lull, respite, breathing space, discontinuation, hiatus, gap, interlude;")))),
            React.createElement("p", null,
                React.createElement("small", null, "verb"),
                React.createElement("ol", null,
                    React.createElement("li", null,
                        React.createElement("span", null, "interrupt action or speech briefly."),
                        React.createElement("br", null),
                        React.createElement("span", { className: 'dict-definition' },
                            "\"she paused, at a loss for words\"",
                            React.createElement("br", null),
                            React.createElement("em", null, "synonyms:"),
                            " stop, cease, halt, discontinue, break off, take a break;"))))));
    }
}
exports.default = AppPausedStatus;
;
