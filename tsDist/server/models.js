"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = require("./User");
const mongooseUtil_1 = require("./mongooseUtil");
const SchemaTypes = mongooseUtil_1.mongoose.Schema.Types;
const golferSchema = new mongooseUtil_1.mongoose.Schema({
    tourneyId: { type: SchemaTypes.ObjectId, required: true },
    name: { type: String, required: true }
});
golferSchema.index({ name: 1, tourneyId: 1 }, { unique: true });
// Keep this separate for now, that way I don't have to change it often
const wgrSchema = new mongooseUtil_1.mongoose.Schema({
    name: { type: String, required: true, unique: true },
    wgr: { type: Number, required: true }
});
wgrSchema.index({ name: 1 });
wgrSchema.index({ name: 1, wgr: 1 }, { unique: true });
const draftPickOrderSchema = new mongooseUtil_1.mongoose.Schema({
    tourneyId: { type: SchemaTypes.ObjectId, required: true },
    pickNumber: { type: Number, required: true },
    user: { type: SchemaTypes.ObjectId, required: true }
});
draftPickOrderSchema.index({ pickNumber: 1, tourneyId: 1 }, { unique: true });
const draftPickSchema = new mongooseUtil_1.mongoose.Schema({
    tourneyId: { type: SchemaTypes.ObjectId, required: true },
    user: { type: SchemaTypes.ObjectId, required: true },
    golfer: { type: SchemaTypes.ObjectId, required: true },
    pickNumber: { type: Number, required: true },
    timestamp: { type: Date, required: true }
});
draftPickSchema.index({ tourneyId: 1, pickNumber: 1 }, { unique: true });
draftPickSchema.index({ tourneyId: 1, golfer: 1 }, { unique: true });
const draftPickListSchema = new mongooseUtil_1.mongoose.Schema({
    tourneyId: { type: SchemaTypes.ObjectId, required: true },
    userId: { type: SchemaTypes.ObjectId, required: true },
    golferPickList: [SchemaTypes.ObjectId]
});
draftPickListSchema.index({ tourneyId: 1, userId: 1 }, { unique: true });
const golferScoreSchema = new mongooseUtil_1.mongoose.Schema({
    tourneyId: { type: SchemaTypes.ObjectId, required: true },
    golfer: { type: SchemaTypes.ObjectId, required: true },
    day: Number,
    thru: Number,
    scores: [SchemaTypes.Mixed]
});
golferScoreSchema.index({ tourneyId: 1, golfer: 1 }, { unique: true });
const appStateSchema = new mongooseUtil_1.mongoose.Schema({
    tourneyId: { type: SchemaTypes.ObjectId, required: true, unique: true },
    isDraftPaused: Boolean,
    allowClock: Boolean,
    draftHasStarted: Boolean,
    autoPickUsers: [SchemaTypes.ObjectId]
});
appStateSchema.index({ tourneyId: 1 }, { unique: true });
const tourneySchema = new mongooseUtil_1.mongoose.Schema({
    name: { type: String, required: true },
    lastUpdated: { type: Date, required: true },
    par: Number
});
exports.User = User_1.default;
exports.Golfer = mongooseUtil_1.mongoose.model('Golfer', golferSchema);
exports.WGR = mongooseUtil_1.mongoose.model('WGR', wgrSchema);
exports.DraftPickOrder = mongooseUtil_1.mongoose.model('DraftPickOrder', draftPickOrderSchema);
exports.DraftPick = mongooseUtil_1.mongoose.model('DraftPick', draftPickSchema);
exports.DraftPickList = mongooseUtil_1.mongoose.model('DraftPickList', draftPickListSchema);
exports.GolferScore = mongooseUtil_1.mongoose.model('GolferScore', golferScoreSchema);
exports.GolferScoreOverrides = mongooseUtil_1.mongoose.model('GolferScoreOverrides', golferScoreSchema);
exports.AppState = mongooseUtil_1.mongoose.model('AppState', appStateSchema);
exports.Tourney = mongooseUtil_1.mongoose.model('Tourney', tourneySchema);
