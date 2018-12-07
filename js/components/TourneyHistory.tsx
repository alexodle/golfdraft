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
    const {activeTourneyId} = this.props;
    return (
      <section>
        <h1>Tourney history</h1>
        <ol>
          {sortedTourneys.map(t => {
            if (t._id === activeTourneyId) {
              return (<li key={t._id}><a href={`/${t._id}/`}><b>{t.name}</b></a></li>);
            }
            return (<li key={t._id}><a href={`/${t._id}/`}>{t.name}</a></li>);
          })}
        </ol>
      </section>
    );
  }

}