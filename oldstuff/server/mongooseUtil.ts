import config from './config';
import * as mongoose from 'mongoose';

(<any>mongoose).Promise = Promise;

export function connect() {
  mongoose.connect(config.mongo_url);

  return new Promise(function (fulfill, reject) {
    mongoose.connection.once('open', () => fulfill());
    mongoose.connection.once('error', err => reject(err));
  });
}

export function close() {
  mongoose.connection.close();
}

export const connection = mongoose.connection;

export { mongoose };
