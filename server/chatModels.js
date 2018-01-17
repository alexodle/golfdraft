// @flow
'use strict';

const mongoose = require('./mongooseUtil').mongoose;

const messageSchema = mongoose.Schema({
  tourneyId: mongoose.Schema.ObjectId,
  user: mongoose.Schema.ObjectId,
  isBot: Boolean,
  message: String,
  date: Date
});
messageSchema.index({ tourneyId: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = {
  Message: Message
};
