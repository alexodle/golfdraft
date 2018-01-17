'use strict';

const config = require('./config');
const mongoose = require('mongoose');
const Promise = require('promise');

function connect() {
  mongoose.connect(config.mongo_url, {
    useMongoClient: true
  });

  return new Promise(function (fulfill, reject) {
    mongoose.connection.once('open', function () {
      fulfill();
    });
    mongoose.connection.once('error', function (err) {
      reject(err);
    });
  });
}

function close() {
  mongoose.connection.close();
}

if (!config.prod) {
  mongoose.set('debug', true);
}

mongoose.Promise = Promise;

module.exports = {
  mongoose,
  connect,
  close,
  connection: mongoose.connection
};
