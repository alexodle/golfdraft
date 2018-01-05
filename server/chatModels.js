'use strict';

const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
  tourneyId: mongoose.Schema.ObjectId,
  player: mongoose.Schema.ObjectId,
  isBot: Boolean,
  message: String,
  date: Date
});
messageSchema.index({ tourneyId: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = {
  Message: Message
};
