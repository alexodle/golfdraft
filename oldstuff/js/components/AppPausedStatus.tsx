import * as React from 'react';

export default class AppPausedStatus extends React.Component {
  render() {
    return (
      <div className="jumbotron">
        <h1>Pause!</h1>

        <p>
          <em><small>noun</small></em>
          <ol>
            <li>
              <span>a temporary stop in action or speech.</span><br />
              <span className='dict-definition'>
                "she dropped me outside during a brief pause in the rain"<br />
                <em>synonyms:</em> stop, cessation, break, halt, interruption, check, lull, respite, breathing space, discontinuation, hiatus, gap, interlude;
              </span>
            </li>
          </ol>
        </p>

        <p>
          <small>verb</small>
          <ol>
            <li>
              <span>interrupt action or speech briefly.</span><br />
              <span className='dict-definition'>
                "she paused, at a loss for words"<br />
                <em>synonyms:</em> stop, cease, halt, discontinue, break off, take a break;
              </span>
            </li>
          </ol>
        </p>
      </div>
    );
  }

};
