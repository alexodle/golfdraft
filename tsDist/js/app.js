"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// load css right away
require("bootstrap/dist/css/bootstrap.css");
require("font-awesome/css/font-awesome.css");
require("../less/app.less");
const App_1 = require("./components/App");
const React = require("react");
const ReactDOM = require("react-dom");
const react_router_dom_1 = require("react-router-dom");
const hydrate_1 = require("./hydrate");
const startSocketUpdates_1 = require("./startSocketUpdates");
function render(rootNode) {
    // hydrate BEFORE rendering
    hydrate_1.default();
    ReactDOM.render((React.createElement(react_router_dom_1.BrowserRouter, null,
        React.createElement("div", { className: "container" },
            React.createElement("div", { className: "row" },
                React.createElement("div", { className: "col-md-offset-1 col-md-10" },
                    React.createElement(react_router_dom_1.Route, { component: App_1.default, path: "/" })))))), rootNode);
    // Begin listening for live socket updates
    startSocketUpdates_1.default();
}
const node = document.getElementById('golfdraftapp');
if (node === null) {
    console.log('root node not found! golfdraftapp');
}
else {
    render(node);
}
