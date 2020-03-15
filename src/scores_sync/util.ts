import * as fs from 'fs';
import { gzip } from 'node-gzip';
import * as request from 'request';
import moment = require('moment');

const TMP_DIR_MASK = '0777';
const FS_EXISTS_ERR = 'EEXIST';
const DATA_TMP_DIR = '/tmp/golfdraft_data'

export async function safeWriteGzippedTmpFile(filename: string, data: any) {
  const filePath = `${DATA_TMP_DIR}/${filename}.gz`;
  try {
    const compressed = await gzip(data);
    ensureDirectory(DATA_TMP_DIR);
    fs.writeFileSync(filePath, compressed);
    console.log("Wrote data to temp file:", filePath);
  } catch (e) {
    console.warn("Failed to write data to tmp file:", filePath, e);
  }
}

export function fetchData(url: string): Promise<any> {
  const ts = moment().format('YMMDD_HHmmss');
  return new Promise((fulfill, reject) => {
    request({ url }, (error, _response, body) => {
      if (error) {
        reject(error);
        return;
      }
      safeWriteGzippedTmpFile(`${ts}-rawdata`, body);
      fulfill(body);
    });
  });
}

function ensureDirectory(path: string) {
  try {
    fs.mkdirSync(path, TMP_DIR_MASK);
  } catch (e) {
    if (e.code !== FS_EXISTS_ERR) {
      throw e;
    }
  }
}
