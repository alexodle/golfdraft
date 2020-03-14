// load css right away
//import 'bootstrap/dist/css/bootstrap.css';
import '../less/app.less';
import '../less/bootstrap_repl.less';

import AppNode from './components/App';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BrowserRouter, Route } from 'react-router-dom';
import hydrate from './hydrate';
import startSocketUpdates from './startSocketUpdates';
import TourneyStore from './stores/TourneyStore';

function render(rootNode: Element) {
  // hydrate BEFORE rendering
  hydrate();

  if (TourneyStore.isViewingActiveTourney()) {
    // Begin listening for live socket updates
    startSocketUpdates();
  }

  ReactDOM.render(
    (<BrowserRouter>
      <div className="container">
        <Route component={AppNode} path="/" />
      </div>
    </BrowserRouter>), rootNode);
}

const node = document.getElementById('golfdraftapp');
if (node === null) {
  console.log('root node not found! golfdraftapp');
} else {
  render(node);
}
