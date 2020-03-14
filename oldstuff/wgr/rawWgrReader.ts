import { JSDOM } from 'jsdom';
import { WGR } from '../server/ServerTypes';
import * as _ from 'lodash';
import * as request from 'request';

const AMATEUR_REGEX = /\(Am\)$/i;

function download(url: string): Promise<string> {
  return new Promise((fulfill, reject) => {
    request({ url }, (error: Error, _response: Response, body: string) => {
      if (error) {
        reject(error);
        return;
      }
      fulfill(body);
    });
  });
}

export async function rawWgrReader(url: string): Promise<WGR[]> {
  const wgrs: WGR[] = [];

  const body = await download(url);
  const dom = new JSDOM(body);

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
  
  return wgrs;
}
