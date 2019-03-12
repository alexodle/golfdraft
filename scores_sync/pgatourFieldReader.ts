import * as _ from 'lodash';
import {Reader, ReaderResult, UpdateGolfer} from './Types';

function parseName(name: string): string {
  const parts = name.split(', ');
  return _.last(parts) + ' ' + parts.slice(0, parts.length  - 1).join(', ');
}

function parseJson(json: string): UpdateGolfer[] {
  const parsedJson = JSON.parse(json);
  const golfers = _.map(parsedJson.Tournament.Players, (p) => {
    const name = parseName((<any>p).PlayerName);
    return {
      golfer: name,
      scores: [0, 0, 0, 0],
      thru: 0,
      day: 0
    } as UpdateGolfer;
  });
  return golfers;
}

class PgaTourFieldReader implements Reader {
  async run(data: any): Promise<ReaderResult> {
    const golfers = parseJson(data);
    return {
      par: 72, // hack for now
      golfers
    };
  }

  parseJson(json: string): UpdateGolfer[]  {
    return parseJson(json);
  }
}

export default new PgaTourFieldReader();
