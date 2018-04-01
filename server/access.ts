import * as _ from 'lodash';
import * as chatModels from './chatModels';
import config from './config';
import constants from '../common/constants';
import io from './socketIO';
import * as levenshteinDistance from './levenshteinDistance';
import * as models from './models';
import {Model, Document} from 'mongoose';
import {mongoose} from './mongooseUtil';
import {
  AppSettings,
  AppSettingsDoc,
  ChatMessage,
  ChatMessageDoc,
  Draft,
  DraftPick,
  DraftPickDoc,
  DraftPickList,
  DraftPickListDoc,
  DraftPickOrder,
  DraftPickOrderDoc,
  Golfer,
  GolferDoc,
  GolferScore,
  GolferScoreDoc,
  ObjectId,
  ScoreOverride,
  ScoreOverrideDoc,
  User,
  UserDoc,
  WGR,
  WGRDoc,
} from './ServerTypes';

const UNKNOWN_WGR = constants.UNKNOWN_WGR;
const TOURNEY_ID = new mongoose.Types.ObjectId(config.tourney_id);
const TOURNEY_ID_QUERY = { _id: TOURNEY_ID };
const FK_TOURNEY_ID_QUERY = { tourneyId: TOURNEY_ID };

function extendWithTourneyId(obj) {
  return { ...obj, ...FK_TOURNEY_ID_QUERY };
}

function extendAllWithTourneyId(objs) {
  return _.map(objs, extendWithTourneyId);
}

function multiUpdate(model: Model<Document>, queryMask: string[], objs: {}[]) {
  objs = extendAllWithTourneyId(objs);
  return Promise.all(_.map(objs, (o) => {
    const query = _.pick(o, queryMask);
    return model.update(query, o, {upsert: true}).exec();
  }));
};

function getAll(model: Model<Document>) {
  return model.find(FK_TOURNEY_ID_QUERY).exec();
};

function clearAll(model: Model<Document>) {
  return model.remove(FK_TOURNEY_ID_QUERY).exec();
};

function mergeWGR(golfer: GolferDoc, wgrEntry: WGR): Golfer {
  let wgr = null;
  if (!wgrEntry) {
    wgr = UNKNOWN_WGR;
  } else {
    wgr = wgrEntry.wgr;
  }
  return { wgr, ...golfer.toObject() };
}

export function getTourney() {
  return models.Tourney.findOne(TOURNEY_ID_QUERY).exec();
}

export function getPickList(userId: string): Promise<string[]> {
  const query = _.extend({ userId }, FK_TOURNEY_ID_QUERY);
  return models.DraftPickList.findOne(query).exec()
    .then((pickList?: DraftPickListDoc) => {
      return pickList ? _.map(pickList.golferPickList, (oid) => oid.toString()) : null;
    });
}

export function updatePickList(userId: string, pickList: string[]) {
  pickList = _.uniq(pickList);
  const query = _.extend({ userId: userId }, FK_TOURNEY_ID_QUERY);
  return models.DraftPickList
    .update(
      query,
      { $set: { golferPickList: pickList } },
      { upsert: true }
    ).exec()
    .then(function () {
      return {
        completed: true,
        pickList: pickList,
        suggestions: null
      };
    });
}

export function updateAutoPick(userId: string, autoPick: boolean) {
  const query = FK_TOURNEY_ID_QUERY;

  let update = null;
  if (!!autoPick) {
    update = models.AppState.update(
      query,
      { $addToSet: { autoPickUsers: userId } },
      { upsert: true });
  } else {
    update = models.AppState.update(
      query,
      { $pull: { autoPickUsers: userId } },
      { multi: true });
  }

  return update.exec();
}


export function updatePickListFromNames(userId: string, pickListNames: string[]) {
  const MIN_COEFF = 0.5;

  return getGolfers()
    .then((golfers) => {
      const golfersByLcName = _.keyBy(golfers, function (g) {
        return g.name.toLowerCase();
      });

      const notFoundGolferNames = new Set<string>();
      const pickList = _.map(pickListNames, n => {
        const g = golfersByLcName[n.toLowerCase()];
        if (!g) {
          notFoundGolferNames.add(n);
          return null;
        }
        return g._id.toString();
      });

      if (_.isEmpty(notFoundGolferNames)) {
        // SUCCESS! Found all golfers by name, so go ahead and save them.
        return updatePickList(userId, pickList);
      }

      // Did not find at at least one golfer by name. Calculate closest matches and provide those
      // suggestions to the client.
      //
      // Note: In order to keep this whole process stateless for client and server, return good matches too
      const golferNames = _.map(golfers, 'name');
      const suggestions = _.map(pickListNames, n => {
        if (notFoundGolferNames.has(n)) {
          const levResult = levenshteinDistance.runAll(n, golferNames);

          let allResults = levResult.results;
          let bestResult = levResult.results[0];
          const isGoodSuggestion = bestResult.coeff >= MIN_COEFF;

          if (!isGoodSuggestion) {
            allResults = _.sortBy(allResults, 'target');
            bestResult = allResults[0];
          }

          return {
            type: 'SUGGESTION',
            source: levResult.source,
            suggestion: bestResult.target,
            allResults,
            isGoodSuggestion
          }
        } else {
          return { type: "EXACT", source: n };
        }
      });

      return {
        completed: false,
        suggestions: suggestions,
        pickList: null
      };
    });
}

export function getGolfer(golferId: string): Promise<Golfer> {
  const query = _.extend({ _id: golferId }, FK_TOURNEY_ID_QUERY);
  return models.Golfer.findOne(query).exec()
    .then((golfer: GolferDoc) => {
      return models.WGR.findOne({ name: golfer.name }).exec()
        .then((wgr: WGRDoc) => {
          return mergeWGR(golfer, wgr);
        });
    });
}

export function getUser(userId: string): Promise<UserDoc> {
  return models.User.findOne({ _id: userId }).exec() as Promise<UserDoc>;
}

export function getGolfers(): Promise<Golfer[]> {
  return Promise.all([
      models.WGR.find().exec(),
      models.Golfer.find(FK_TOURNEY_ID_QUERY).exec(),
    ])
    .then(([_wgrs, _golfers]) => {
      const wgrs = _.keyBy(_wgrs as WGRDoc[], 'name');
      return _.map(_golfers as GolferDoc[], (g) => mergeWGR(g, wgrs[g.name]));
    });
}

export function getUsers(): Promise<UserDoc[]> {
  return models.User.find({}).exec() as Promise<UserDoc[]>;
}

export function getScores(): Promise<GolferScoreDoc[]> {
  return getAll(models.GolferScore) as Promise<GolferScoreDoc[]>;
}

export function getPicks(): Promise<DraftPickDoc[]> {
  return getAll(models.DraftPick) as Promise<DraftPickDoc[]>;
}

export function getScoreOverrides(): Promise<ScoreOverrideDoc[]> {
  return getAll(models.GolferScoreOverrides) as Promise<ScoreOverrideDoc[]>;
}

export function getAppState(): Promise<AppSettings> {
  return models.AppState.findOne(FK_TOURNEY_ID_QUERY).exec()
    .then((appState? : AppSettingsDoc) => {
      return appState || {
        ...FK_TOURNEY_ID_QUERY,
        isDraftPaused: false,
        allowClock: true,
        draftHasStarted: false,
        autoPickUsers: [],
      } as AppSettings;
    });
}

export function updateAppState(props: AppSettings) {
  return models.AppState.update(
    FK_TOURNEY_ID_QUERY,
    props,
    { upsert: true }
  ).exec();
}

export function makePickListPick(userId: string, pickNumber: number) {
  return Promise.all([
    getPickList(userId),
    getGolfers(),
    getPicks()
  ])
  .then(function (results) {
    const pickList = results[0] || [];
    const golfers = results[1];
    const picks = results[2];

    const pickedGolfers = _.chain(picks)
      .map('golfer')
      .keyBy()
      .value();

    let golferToPick = _.chain(pickList)
      .filter((gid) => !pickedGolfers[gid.toString()])
      .first()
      .value();

    // If no golfer from the pickList list is available, use wgr
    let isPickListPick = !!golferToPick;
    golferToPick = golferToPick || _.chain(golfers)
      .sortBy(['wgr', 'name'])
      .map('_id')
      .filter((gid) => !pickedGolfers[gid.toString()])
      .first()
      .value();

    const pick = {
      pickNumber,
      user: new mongoose.Types.ObjectId(userId),
      golfer: new mongoose.Types.ObjectId(golferToPick),
    } as DraftPick;
    return makePick(pick)
      .then((resp) => {
        return { isPickListPick, ...resp };
      });
  });
}

export function makePick(pick: DraftPick, ignoreOrder?: boolean) {
  const pickOrderQuery = { ...FK_TOURNEY_ID_QUERY,
    pickNumber: pick.pickNumber,
    user: pick.user
  };
  const golferDraftedQuery = { ...FK_TOURNEY_ID_QUERY,
    golfer: pick.golfer
  };
  const golferExistsQuery = { ...FK_TOURNEY_ID_QUERY,
    _id: pick.golfer
  };
  return Promise.all([
      // Ensure correct pick numnber
      models.DraftPick.count(FK_TOURNEY_ID_QUERY).exec(),

      // Ensure this user is actually up in the draft
      models.DraftPickOrder.findOne(pickOrderQuery).exec(),

      // Ensure golfer isn't already picked
      models.DraftPick.findOne(golferDraftedQuery).exec(),

      // Ensure this golfer actually exists
      models.Golfer.findOne(golferExistsQuery).exec()
    ])
    .then(function (result) {
      const nPicks = result[0];
      const userIsUp = !!result[1];
      const golferAlreadyDrafted = result[2];
      const golferExists = !!result[3];

      if (nPicks !==  pick.pickNumber && !ignoreOrder) {
        throw new Error('invalid pick: pick order out of sync');
      } else if (!userIsUp && !ignoreOrder) {
        throw new Error('invalid pick: user picked out of order');
      } else if (golferAlreadyDrafted) {
        throw new Error('invalid pick: golfer already drafted');
      } else if (!golferExists) {
        throw new Error('invalid pick: invalid golfer');
      }

      pick = extendWithTourneyId(pick);
      pick.timestamp = new Date();
      return models.DraftPick.create(pick);
    })
    .then(() => pick);
}

export function undoLastPick(): Promise<DraftPickDoc> {
  return models.DraftPick.count(FK_TOURNEY_ID_QUERY).exec()
    .then((nPicks) => {
      return models.DraftPick.findOneAndRemove({ pickNumber: nPicks - 1 }).exec() as Promise<DraftPickDoc>;
    });
}

export function getDraft(): Promise<Draft> {
  return Promise.all([
      models.DraftPickOrder.find(FK_TOURNEY_ID_QUERY).exec(),
      getPicks()
    ])
    .then(([pickOrder, picks]) => {
      return {
        pickOrder: _.sortBy(pickOrder as DraftPickOrderDoc[], 'pickNumber'),
        picks: _.sortBy(picks, 'pickNumber'),
        serverTimestamp: new Date()
      };
    });
}

export function updateTourney(props) {
  props = _.extend({}, props, { lastUpdated: new Date() });
  return models.Tourney.update(
    TOURNEY_ID_QUERY,
    props,
    {upsert: true}
  ).exec();
}

export function ensureUsers(allUsers: User[]) {
  return getUsers()
    .then(users => {
      const existingUsersByName = _.keyBy(users, 'name');
      const usersToAdd = _.filter(allUsers, json => !existingUsersByName[json.name]);
      const promises = _.map(usersToAdd, u => {
        return new Promise((resolve, reject) => {
          (<any>models.User).register(new models.User({ username: u.username, name: u.name }), u.password, (err) => {
            if (err) reject(err);
            resolve();
          });
        });
      });
      return Promise.all(promises);
    });
}

export function ensureGolfers(objs: Golfer[]) {
  return multiUpdate(models.Golfer, ['name', 'tourneyId'], objs);
}

export function replaceWgrs(wgrEntries: WGR[]) {
  return models.WGR.remove({}).exec()
    .then(() => {
      return models.WGR.create(wgrEntries);
    });
}

export function setPickOrder(objs: DraftPickOrder[]) {
  return multiUpdate(models.DraftPickOrder, ['tourneyId', 'user', 'pickNumber'], objs);
}

export function updateScores(objs: GolferScore[]) {
  return multiUpdate(models.GolferScore, ['golfer', 'tourneyId'], objs);
}

// Chat

export function getChatMessages(): Promise<ChatMessageDoc[]> {
  return chatModels.Message.find(FK_TOURNEY_ID_QUERY).exec() as Promise<ChatMessageDoc[]>;
}

export function createChatMessage(message: ChatMessage) {
  message = extendWithTourneyId(message);
  message.date = new Date(); // probably not needed b/c we can use ObjectId
  return chatModels.Message.create(message)
    .then(() => {
      io.sockets.emit('change:chat', {
        data: message,
        evType: 'change:chat',
        action: 'chat:newMessage'
      });
    });
}

export function createChatBotMessage(message: { message: string }) {
  return createChatMessage({ ...message, isBot: true } as ChatMessage);
}

  // DEBUGGING/TESTING

export function clearTourney() {
  return models.Tourney.remove(TOURNEY_ID_QUERY).exec();
}

export function clearPickOrder() {
  return clearAll(models.DraftPickOrder);
}

export function clearDraftPicks() {
  return clearAll(models.DraftPick);
}

export function clearGolfers() {
  return clearAll(models.Golfer);
}

export function clearGolferScores() {
  return clearAll(models.GolferScore);
}

export function clearGolferScoreOverrides() {
  return clearAll(models.GolferScoreOverrides);
}

export function clearPickLists() {
  return clearAll(models.DraftPickList);
}

export function clearChatMessages() {
  return clearAll(chatModels.Message);
}

export function clearWgrs() {
  return clearAll(models.WGR);
}

export function clearAppState() {
  return clearAll(models.AppState);
}

export function clearUsers() {
  return models.User.remove({}).exec();
}

export function resetTourney() {
  return Promise.all([
    models.Tourney.update(TOURNEY_ID_QUERY, {
      name: null,
      par: -1
    }).exec(),
    clearPickOrder(),
    clearDraftPicks(),
    clearGolfers(),
    clearGolferScores(),
    clearGolferScoreOverrides(),
    clearChatMessages(),
    clearPickLists(),
    clearAppState(),
    clearUsers()
  ]);
}
