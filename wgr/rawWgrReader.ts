import { JSDOM } from 'jsdom';
import { WGR } from '../server/ServerTypes';
import * as _ from 'lodash';
import * as request from 'request';

const AMATEUR_REGEX = /\(Am\)$/i;

export function rawWgrReader(url: string): Promise<WGR[]> {
  return new Promise(function (fulfill, reject) {
    request({ url }, function (error, response, body) {
      if (error) {
        reject(error);
        return;
      }

      let dom: JSDOM = null;
      try {
        dom = new JSDOM(body);
      } catch (err) {
        reject(err);
        return;
      }

      const wgrs: WGR[] = [];

      const trs = dom.window.document.body.querySelectorAll('#ranking_table > .table_container > table > tbody > tr');
      trs.forEach(tr => {
        const tds = tr.querySelectorAll('td');
        const wgr = _.parseInt(tds.item(0).textContent);
        const name = tr.querySelector('td.name')
          .textContent
          .trim()
          .replace(AMATEUR_REGEX, '');
        wgrs.push({ wgr, name } as WGR);
      });

      fulfill(wgrs);
    });
  });
}
