import {some} from 'lodash';
import constants from './constants';

export function getOrdinal(n: number): string {
  const s=["th","st","nd","rd"],
      v=n%100;
  return n+(s[(v-20)%10]||s[v]||s[0]);
}

export function toGolferScoreStr(n: number): string {
  if (n === 0) {
    return 'E';
  } else if (n > 0) {
    return '+' + n;
  } else {
    return '' + n;
  }
}

export function toThruStr(thru: number): string {
  if (thru === null) {
    return 'NS';
  } else if (thru === constants.NHOLES) {
    return 'F';
  } else {
    return 'thru ' + thru;
  }
}

export function oidsAreEqual(a: any, b: any) {
  // We may have ObjectId OR String values, so ensure to convert both toString before comparing
  return a.toString() === b.toString();
}

export function containsObjectId(oidList: any[], targetOid: any) {
  return some(oidList, oid => oidsAreEqual(oid, targetOid));
}
