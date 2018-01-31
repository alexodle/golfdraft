"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongooseUtil_1 = require("./mongooseUtil");
const passportLocalMongoose = require("passport-local-mongoose");
const Schema = mongooseUtil_1.mongoose.Schema;
const User = new Schema({
    name: { type: String, required: true, unique: true }
});
User.plugin(passportLocalMongoose, {
    limitAttempts: true,
    maxAttempts: 10
});
exports.default = mongooseUtil_1.mongoose.model('User', User);
