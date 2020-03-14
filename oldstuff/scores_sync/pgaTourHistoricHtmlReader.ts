import { parseInt, find, slice, isEmpty } from 'lodash';
import { Reader, ReaderResult, UpdateGolfer, TourneyConfigSpec } from './Types';
import { JSDOM } from 'jsdom';
import constants from '../common/constants';
import { fetchData } from './util';

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
  const parRowText = ensureTruthy(find(possibleSpans, it => it.textContent.startsWith('PAR: ')), 'Par not found').textContent;
  return parseInt(parRowText.split(': ')[1]);
}

function parseDayScore(td: Element, par: number): number | 'MC' {
  const text = td.textContent.trim();
  if (isEmpty(text)) {
    // TODO: Turn this into typescript compatible
    return constants.MISSED_CUT as 'MC';
  }
  return parseInt(text) - par;
}

class PgaTourFieldReader implements Reader {

  async run(_config: TourneyConfigSpec, url: string): Promise<ReaderResult> {
    const data = await fetchData(url);
    const dom = new JSDOM(data);
    const doc = dom.window.document;

    const par: number = findPar(doc);

    const golferTrs = Array.from(doc.querySelectorAll('table.table-styled > tbody > tr')).slice(1); // slice(1) to skip header row
    const golfers: UpdateGolfer[] = golferTrs.map(tr => {
      const tds = tr.querySelectorAll('td');
      const name = tds[0].textContent.trim();
      const dayScores = slice(tds, 2, 6).map(td => parseDayScore(td, par));
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
