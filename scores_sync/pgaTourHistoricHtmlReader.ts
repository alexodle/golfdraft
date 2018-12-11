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
  /*
  <ul class="ul-inline past-results-cols">
    <li class="col-left">
      <h2 class="title">
        PAST <b>RESULTS</b><span class="pic"></span>
        <span class="row">The Open Championship</span>
      </h2>
      <span class="header-row">
        <b>Ending: 7/17/2016</b> <span class="pic"></span>
        <span class="row">Purse: $9,300,000</span>
        <span class="pic"></span>
        <span class="row">PAR: 71</span>
  */

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

    /*
    <td class="cell">
        Henrik Stenson
    </td>
    <td>1</td>
    <td class="hidden-small">68</td>
    <td class="hidden-small">65</td>
    <td class="hidden-small">68</td>
    <td class="hidden-small">63</td>
    <td>264</td>
    <td class="hidden-small">$1,549,590.00</td>
    <td>600.00</td>*/
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
