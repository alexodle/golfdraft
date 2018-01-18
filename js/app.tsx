// load css right away
import 'bootstrap/dist/css/bootstrap.css';
import 'font-awesome/css/font-awesome.css';
import '../less/app.less';

import * as $ from 'jquery';;
import {AppNode} from './components/App.jsx';
import ChatActions from './actions/ChatActions';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {BrowserRouter, Route} from 'react-router-dom';
import hydrate from './hydrate';
import startSocketUpdates from './startSocketUpdates';

function render(rootNode: Element) {
  // hydrate BEFORE rendering
  hydrate();

  ReactDOM.render(
    (<BrowserRouter>
      <div className="container">
        <div className="row">
          <div className="col-md-offset-1 col-md-10">
            <Route component={AppNode} path="/" />
          </div>
        </div>
      </div>
    </BrowserRouter>), rootNode);

  // Begin listening for live socket updates
  startSocketUpdates();

  // Lazily get chat messages
  //
  // TODO - move to separate server sync
  $.getJSON('/chat/messages').done(ChatActions.setMessages);
}

const node = document.getElementById('golfdraftapp');
if (node === null) {
  console.log('root node not found! golfdraftapp');
} else {
  render(node);
}
