import { parseInt, find, tail, slice, isEmpty } from 'lodash';
import { Reader, ReaderResult, UpdateGolfer } from './Types';
import { JSDOM } from 'jsdom';
import * as request from 'request';
import constants from '../common/constants';

function assert(cond, msg: string) {
  if (!cond) {
    throw new Error(msg);
  }
}

function ensureTruthy(o, msg: string) {
  assert(o, msg);
  return o;
}

function findPar(doc: Document): number {
  const possibleSpans = doc.querySelectorAll('span.header-row span.row');
  const parRow = ensureTruthy(find(possibleSpans, it => it.textContent.startsWith('PAR: ')), 'Par not found');
  return parseInt(parRow.split(': ')[1]);
}

function parseDayScore(td: Element): number | 'MC' {
  const text = td.textContent.trim();
  if (isEmpty(text)) {
    // TODO: Turn this into typescript compatible
    return constants.MISSED_CUT as 'MC';
  }
  return parseInt(text);
}

class PgaTourFieldReader implements Reader {

  async run(url: string): Promise<ReaderResult> {
    const htmlBodyStr = await new Promise<string>((fulfill, reject) => {
      request({ url }, (error, response, body: string) => {
        error ? reject(error) : fulfill(body);
      });
    });

    const dom = new JSDOM(htmlBodyStr);
    const doc = dom.window.document;

    const par: number = findPar(doc);

    const golfers: UpdateGolfer[] = tail(doc.querySelectorAll('table.table-styled > tr')) // tail() to skip header row
      .map(tr => {
        const tds = tr.querySelectorAll('td');
        const name = tds[0].textContent.trim();
        const dayScores = slice(tds, 2, 6).map(parseDayScore);
        return {
          scores: dayScores,
          golfer: name,
          day: dayScores.length,
          thru: constants.NHOLES
        };
      });

    return { par, golfers };
  }

}

export default new PgaTourFieldReader();
