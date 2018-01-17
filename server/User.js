'use strict';

const mongoose = require('./mongooseUtil').mongoose;
const passportLocalMongoose = require('passport-local-mongoose');

const Schema = mongoose.Schema;

const User = new Schema({
  name: { type: String, required: true, unique: true }
});

User.plugin(passportLocalMongoose, {
  limitAttempts: true,
  maxAttempts: 10
});

module.exports = mongoose.model('User', User);
