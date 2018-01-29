import * as _ from 'lodash';
import constants from '../common/constants';
import * as jsdom from 'jsdom';
import * as request from 'request';

const AMATEUR_REGEX = /\(Am\)$/i;

const RawWgrReader = {

  readRawWgr: function (url) {
    return new Promise(function (fulfill, reject) {
      request({ url: url }, function (error, response, body) {
        if (error) {
          reject(error);
          return;
        }

        jsdom.env(body, ['http://code.jquery.com/jquery.js'], function (errors, window) {
          if (errors) {
            console.log('Error retrieving: ' + fileName);
            reject(new Error(JSON.stringify(errors)));
            return;
          }
          const $ = window.$;
          const wgrs = [];

          $('#ranking_table > .table_container > table > tbody > tr').each(function () {
            $tr = $(this);
            const $tds = $('td', $tr);

            const wgr = _.parseInt($($tds.get(0)).text());
            const golferName = $('td.name', $tr)
              .text()
              .trim()
              .replace(AMATEUR_REGEX, '');

            wgrs.push({ wgr: wgr, name: golferName });
          });

          fulfill(wgrs);
        });
      });
    });
  }

};

export default RawWgrReader;
