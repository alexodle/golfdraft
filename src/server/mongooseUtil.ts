import { once } from 'lodash';
import * as mongoose from 'mongoose';
import config from './config';

(<any>mongoose).Promise = Promise;

export const ensureMongoConnect = once(async () => {
  await connect();
})

export function connect(): Promise<void> {
  mongoose.connect(config.mongo_url, { autoIndex: process.env.NODE_ENV !== 'production' });

  return new Promise(function (fulfill, reject) {
    mongoose.connection.once('open', () => fulfill());
    mongoose.connection.once('error', err => reject(err));
  });
}

export function close() {
  mongoose.connection.close();
}

export const connection = mongoose.connection;

export function model(name, schema): mongoose.Model<mongoose.Document, {}> {
  return mongoose.models[name] || mongoose.model(name, schema)
}

export { mongoose };
