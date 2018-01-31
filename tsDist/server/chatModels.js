"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongooseUtil_1 = require("./mongooseUtil");
const messageSchema = new mongooseUtil_1.mongoose.Schema({
    tourneyId: mongooseUtil_1.mongoose.Schema.Types.ObjectId,
    user: mongooseUtil_1.mongoose.Schema.Types.ObjectId,
    isBot: Boolean,
    message: String,
    date: Date
});
messageSchema.index({ tourneyId: 1 });
exports.Message = mongooseUtil_1.mongoose.model('Message', messageSchema);
