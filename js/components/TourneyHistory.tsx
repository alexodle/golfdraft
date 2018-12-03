import * as React from 'react';
import {Indexed, Tourney} from '../types/ClientTypes';
import {sortBy} from 'lodash';

interface TourneyHistoryProps {
  activeTourneyId: string;
  allTourneys: Indexed<Tourney>;
}

export class TourneyHistory extends React.Component<TourneyHistoryProps, {}> {

  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const sortedTourneys = sortBy(this.props.allTourneys, t => t.startDate);
    return (
      <section>
        <h1>Tourney history</h1>
        <ol>
          {sortedTourneys.map(t => (
            <li key={t._id}><a href={`/${t._id}`}>{t.name} - {JSON.stringify(t)}</a></li>
          ))}
        </ol>
      </section>
    );
  }

}