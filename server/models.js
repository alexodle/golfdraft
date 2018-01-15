'use strict';

const mongoose = require('mongoose');
const Promise = require('promise');
const User = require('./User');


const SchemaTypes = mongoose.Schema.Types;
mongoose.Promise = Promise;


const golferSchema = mongoose.Schema({
  tourneyId: { type: SchemaTypes.ObjectId, required: true },
  name: { type: String, required: true, unique: true }
});
golferSchema.index({ name: 1, tourneyId: 1 });

// Keep this separate for now, that way I don't have to change it often
const wgrSchema = mongoose.Schema({
  name: { type: String, required: true, unique: true },
  wgr: { type: Number, required: true, unique: true }
});
wgrSchema.index({ name: 1 });

const draftPickOrderSchema = mongoose.Schema({
  tourneyId: { type: SchemaTypes.ObjectId, required: true },
  pickNumber: { type: Number, required: true },
  user: { type: SchemaTypes.ObjectId, required: true }
});
draftPickOrderSchema.index({ pickNumber: 1, tourneyId: 1 }, { unique: true });

const draftPickSchema = mongoose.Schema({
  tourneyId: { type: SchemaTypes.ObjectId, required: true },
  user: { type: SchemaTypes.ObjectId, required: true },
  golfer: { type: SchemaTypes.ObjectId, required: true },
  pickNumber: { type: Number, required: true },
  timestamp: { type: Date, required: true }
});
draftPickSchema.index({ tourneyId: 1, pickNumber: 1 }, { unique: true });
draftPickSchema.index({ tourneyId: 1, golfer: 1 }, { unique: true });

const draftPickListSchema = mongoose.Schema({
  tourneyId: { type: SchemaTypes.ObjectId, required: true },
  userId: { type: SchemaTypes.ObjectId, required: true },
  golferPickList: [SchemaTypes.ObjectId]
});
draftPickListSchema.index({ tourneyId: 1, userId: 1 }, { unique: true });

const golferScoreSchema = mongoose.Schema({
  tourneyId: { type: SchemaTypes.ObjectId, required: true },
  golfer: { type: SchemaTypes.ObjectId, required: true },
  day: Number,
  thru: Number,
  scores: [SchemaTypes.Mixed]
});
golferScoreSchema.index({ tourneyId: 1, golfer: 1 }, { unique: true });

const appStateSchema = mongoose.Schema({
  tourneyId: { type: SchemaTypes.ObjectId, required: true, unique: true },
  isDraftPaused: Boolean,
  allowClock: Boolean,
  draftHasStarted: Boolean,
  autoPickUsers: [SchemaTypes.ObjectId]
});
appStateSchema.index({ tourneyId: 1 }, { unique: true });

const tourneySchema = mongoose.Schema({
  name: { type: String, required: true },
  lastUpdated: { type: Date, required: true },
  par: Number
});

const Golfer = mongoose.model('Golfer', golferSchema);
const WGR = mongoose.model('WGR', wgrSchema);
const DraftPickOrder = mongoose.model('DraftPickOrder', draftPickOrderSchema);
const DraftPick = mongoose.model('DraftPick', draftPickSchema);
const DraftPickList = mongoose.model('DraftPickList', draftPickListSchema);
const GolferScore = mongoose.model('GolferScore', golferScoreSchema);
const GolferScoreOverrides = mongoose.model(
  'GolferScoreOverrides',
  golferScoreSchema
);
const AppState = mongoose.model('AppState', appStateSchema);
const Tourney = mongoose.model('Tourney', tourneySchema);

module.exports = {
  AppState,
  DraftPick,
  DraftPickList,
  DraftPickOrder,
  Golfer,
  GolferScore,
  GolferScoreOverrides,
  Tourney,
  User,
  WGR,
};
