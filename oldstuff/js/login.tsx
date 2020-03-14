// load css right away
//import 'bootstrap/dist/css/bootstrap.css';
//import 'font-awesome/css/font-awesome.css';
import '../less/app.less';
import '../less/bootstrap_repl.less'

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import WhoIsYou from './components/WhoIsYou';


function getUsernames(): string[] {
  // Should be stamped on page
  return (window as any).usernames as string[];
}

function render(rootNode: Element) {
  ReactDOM.render(
    <div className="container">
      <div className="row">
        <div className="col-md-offset-1 col-md-10">
          <WhoIsYou usernames={getUsernames()} />
        </div>
      </div>
    </div>, rootNode);
}

const node = document.getElementById('golfdraftapp');
if (node === null) {
  console.log('root node not found! golfdraftapp');
} else {
  render(node);
}
