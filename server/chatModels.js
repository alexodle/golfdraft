'use strict';

var mongoose = require('mongoose');

var messageSchema = mongoose.Schema({
  tourneyId: mongoose.Schema.ObjectId,
  player: mongoose.Schema.ObjectId,
  isBot: Boolean,
  message: String,
  date: Date
});
messageSchema.index({ tourneyId: 1 });

var Message = mongoose.model('Message', messageSchema);

module.exports = {
  Message: Message
};
