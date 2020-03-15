import * as React from 'react';

export interface GolfDraftPanelProps {
  heading?: JSX.Element | string;
  height?: string;
}

export default class GolfDraftPanel extends React.Component<GolfDraftPanelProps, {}> {
  render() {
    return (
      <div
        className='panel panel-default golfdraft-panel'
        style={{ height: this.props.height }}
      >
        {!this.props.heading ? null : (
          <div className='panel-heading'>
            <h3 className='panel-title'>{this.props.heading}</h3>
          </div>
        )}
        <div className='panel-body'>
          {this.props.children}
        </div>
      </div>
    );
  }

};
