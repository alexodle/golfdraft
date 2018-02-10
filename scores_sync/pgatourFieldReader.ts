import * as _ from 'lodash';
import * as request from 'request';
import {Reader, ReaderResult, UpdateGolfer} from './Types';

function parseJson(json: string): UpdateGolfer[] {
  const parsedJson = JSON.parse(json);
  const golfers = _.map(parsedJson.Tournament.Players, (p) => {
    const lastFirst = (<any>p).PlayerName.split(', ');
    return {
      golfer: lastFirst[1] + ' ' + lastFirst[0],
      scores: [0, 0, 0, 0],
      thru: 0,
      day: 0
    } as UpdateGolfer;
  });
  return golfers;
}

class PgaTourFieldReader implements Reader {

  run(url: string): Promise<ReaderResult> {
    return new Promise(function (fulfill, reject) {
      request({ url }, function (error, response, body) {
        if (error) {
          console.log(error);
          reject(error);
          return;
        }

        const golfers = parseJson(body);
        fulfill({
          par: 72, // hack for now
          golfers
        } as ReaderResult);
      });
    });
  }

  parseJson(json: string): UpdateGolfer[]  {
    return parseJson(json);
  }
}

export default new PgaTourFieldReader();
