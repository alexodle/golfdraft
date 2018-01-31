"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
class GolfDraftPanel extends React.Component {
    render() {
        return (React.createElement("div", { className: 'panel panel-default golfdraft-panel', style: { height: this.props.height || "100%" } },
            !this.props.heading ? null : (React.createElement("div", { className: 'panel-heading' },
                React.createElement("h3", { className: 'panel-title' }, this.props.heading))),
            React.createElement("div", { className: 'panel-body' }, this.props.children)));
    }
}
exports.default = GolfDraftPanel;
;
