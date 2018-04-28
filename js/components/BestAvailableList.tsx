import * as React from 'react';
import { IndexedGolfers } from '../types/ClientTypes';
import * as _ from 'lodash';
import GolferLogic from '../logic/GolferLogic';

export interface BestAvailableListProps {
  golfersRemaining: IndexedGolfers;
  maxGolfers: number;
}

export default class BestAvailableList extends React.Component<BestAvailableListProps, {}> {

  render() {
    return (
      <ol>
        {_(this.props.golfersRemaining)
          .sortBy((g) => g.wgr, (g) => g.name)
          .take(this.props.maxGolfers)
          .map(g => (
            <li key={g._id}>
              {GolferLogic.renderGolfer(g)}
            </li>
          ))
          .value()}
      </ol>
    );
  }

};
