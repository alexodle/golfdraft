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
  Tourney,  
  TourneyDoc,
  TourneyStandings,
  TourneyStandingsDoc,
  ObjectId,
  ScoreOverride,
  ScoreOverrideDoc,
  User,
  UserDoc,
  WGR,
  WGRDoc,
} from './ServerTypes';

const UNKNOWN_WGR = constants.UNKNOWN_WGR;

async function extendWithTourneyId(obj) {
  const tourneyId = await getCurrentTourneyId();
  return { ...obj, tourneyId };
}

function extendAllWithTourneyId(objs) {
  return Promise.all(_.map(objs, extendWithTourneyId));
}

async function multiUpdate(model: Model<Document>, queryMask: string[], objs: {}[]) {
  objs = await extendAllWithTourneyId(objs);
  return Promise.all(_.map(objs, (o) => {
    const query = _.pick(o, queryMask);
    return model.update(query, o, {upsert: true}).exec();
  }));
};

async function getAll(model: Model<Document>) {
  const tourneyId = await getCurrentTourneyId();
  return model.find({ tourneyId }).exec();
};

async function clearAll(model: Model<Document>) {
  const tourneyId = await getCurrentTourneyId();
  return model.remove({ tourneyId }).exec();
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

// Statically cached for lifetime of server
export const getCurrentTourney = _.once(async function (): Promise<Tourney> {
  return models.Tourney.find({ isCurrent: true }).exec()
    .then((tourneys?: TourneyDoc[]) => {
      if (!tourneys.length) {
        throw new Error("No current tourney found");
      } else if (tourneys.length > 1) {
        throw new Error("Multiple current tourneys found");
      }
      return tourneys[0];
    });
});

export function getCurrentTourneyId(): Promise<ObjectId> {
  return getCurrentTourney().then(t => t._id);
}

export async function getPickList(userId: string): Promise<string[]> {
  const tourneyId = await getCurrentTourneyId();
  const query = { tourneyId, userId };
  return models.DraftPickList.findOne(query).exec()
    .then((pickList?: DraftPickListDoc) => {
      return pickList ? _.map(pickList.golferPickList, (oid) => oid.toString()) : null;
    });
}

export async function updatePickList(userId: string, pickList: string[]) {
  const tourneyId = await getCurrentTourneyId();
  pickList = _.uniq(pickList);
  const query = { tourneyId, userId };
  return models.DraftPickList
    .update(
      query,
      { $set: { golferPickList: pickList } },
      { upsert: true }
    ).exec()
    .then(() => {
      return {
        completed: true,
        pickList: pickList,
        suggestions: null
      };
    });
}

export async function updateAutoPick(userId: string, autoPick: boolean) {
  const tourneyId = await getCurrentTourneyId();
  const query = { tourneyId };

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

export async function getGolfer(golferId: string): Promise<Golfer> {
  const tourneyId = await getCurrentTourneyId();
  const query = { _id: golferId, tourneyId };
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

export function getUserByUsername(username: string): Promise<UserDoc> {
  return models.User.findOne({ username }).exec() as Promise<UserDoc>;
}

export async function getGolfers(): Promise<Golfer[]> {
  const tourneyId = await getCurrentTourneyId();
  return Promise.all([
      models.WGR.find().exec(),
      models.Golfer.find({ tourneyId }).exec(),
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

export async function getTourneyStandings(): Promise<TourneyStandingsDoc> {
  const tourneyId = await getCurrentTourneyId();
  return models.TourneyStandings.findOne({ tourneyId }).exec() as Promise<TourneyStandingsDoc>;
}

export function getPicks(): Promise<DraftPickDoc[]> {
  return getAll(models.DraftPick) as Promise<DraftPickDoc[]>;
}

export function getScoreOverrides(): Promise<ScoreOverrideDoc[]> {
  return getAll(models.GolferScoreOverrides) as Promise<ScoreOverrideDoc[]>;
}

export async function getAppState(): Promise<AppSettings> {
  const tourneyId = await getCurrentTourneyId();
  return models.AppState.findOne({ tourneyId }).exec()
    .then((appState? : AppSettingsDoc) => {
      return appState || {
        tourneyId,
        isDraftPaused: false,
        allowClock: true,
        draftHasStarted: false,
        autoPickUsers: [],
      } as AppSettings;
    });
}

export async function updateAppState(props: AppSettings) {
  const tourneyId = await getCurrentTourneyId();
  return models.AppState.update(
    { tourneyId },
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
  .then(results => {
    const pickList = results[0] || [];
    const golfers = results[1];
    const picks = results[2];

    const pickedGolfers = _.chain(picks)
      .map('golfer')
      .keyBy()
      .value();

    let golferToPick = _.chain(pickList)
      .filter((gid) => !pickedGolfers[gid.toString()])
      .nth()
      .value();

    // If no golfer from the pickList list is available, use wgr
    const isPickListPick = !!golferToPick;
    if (!golferToPick) {
      const remainingGolfers = _.chain(golfers)
        .filter(g => !pickedGolfers[g._id.toString()])
        .sortBy(['wgr', 'name'])
        .value();
      golferToPick = remainingGolfers[Math.min(constants.ABSENT_PICK_NTH_BEST_WGR - 1, remainingGolfers.length - 1)]._id;
    }

    const pick = {
      pickNumber,
      user: new mongoose.Types.ObjectId(userId),
      golfer: new mongoose.Types.ObjectId(golferToPick),
    } as DraftPick;
    return makePick(pick)
      .then(resp => ({ isPickListPick, ...resp }));
  });
}

export async function makePick(pick: DraftPick, ignoreOrder?: boolean): Promise<DraftPick> {
  const tourneyId = await getCurrentTourneyId();
  const pickOrderQuery = {
    tourneyId,
    pickNumber: pick.pickNumber,
    user: pick.user
  };
  const golferDraftedQuery = { tourneyId, golfer: pick.golfer };
  const golferExistsQuery = { tourneyId, _id: pick.golfer };

  const result = await Promise.all([
    // Ensure correct pick numnber
    models.DraftPick.count({ tourneyId }).exec(),

    // Ensure this user is actually up in the draft
    models.DraftPickOrder.findOne(pickOrderQuery).exec(),

    // Ensure golfer isn't already picked
    models.DraftPick.findOne(golferDraftedQuery).exec(),

    // Ensure this golfer actually exists
    models.Golfer.findOne(golferExistsQuery).exec()
  ]);
  
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

  pick = await extendWithTourneyId(pick);
  pick.timestamp = new Date();

  await models.DraftPick.create(pick);
  return pick;
}

export async function undoLastPick(): Promise<DraftPickDoc> {
  const tourneyId = await getCurrentTourneyId();
  return models.DraftPick.count({ tourneyId }).exec()
    .then((nPicks) => {
      return models.DraftPick.findOneAndRemove({ pickNumber: nPicks - 1 }).exec() as Promise<DraftPickDoc>;
    });
}

export async function getDraft(): Promise<Draft> {
  const tourneyId = await getCurrentTourneyId();
  return Promise.all([
      models.DraftPickOrder.find({ tourneyId }).exec(),
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

export async function updateTourney(props) {
  const tourneyId = await getCurrentTourneyId();
  props = _.extend({}, props, { lastUpdated: new Date() });
  return models.Tourney.update(
    { tourneyId },
    props,
    { upsert: true }
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
    .then(() => models.WGR.create(wgrEntries));
}

export function setPickOrder(objs: DraftPickOrder[]) {
  return multiUpdate(models.DraftPickOrder, ['tourneyId', 'user', 'pickNumber'], objs);
}

export function updateScores(objs: GolferScore[]) {
  return multiUpdate(models.GolferScore, ['golfer', 'tourneyId'], objs);
}

export async function updateTourneyStandings(tourneyStandings: TourneyStandings) {
  const tourneyId = await getCurrentTourneyId();
  return models.TourneyStandings.update(
    { tourneyId },
    { $set: { tourneyId, ...tourneyStandings } },
    { upsert: true });
}

// Chat

export async function getChatMessages(): Promise<ChatMessageDoc[]> {
  const tourneyId = await getCurrentTourneyId();
  return chatModels.Message.find({ tourneyId }).exec() as Promise<ChatMessageDoc[]>;
}

export async function createChatMessage(message: ChatMessage) {
  message = await extendWithTourneyId(message);
  message.date = new Date(); // probably not needed b/c we can use ObjectId
  await chatModels.Message.create(message);

  io.sockets.emit('change:chat', {
    data: message,
    evType: 'change:chat',
    action: 'chat:newMessage'
  });
}

export function createChatBotMessage(message: { message: string }) {
  return createChatMessage({ ...message, isBot: true } as ChatMessage);
}

  // DEBUGGING/TESTING

export async function clearTourney() {
  const tourneyId = await getCurrentTourneyId();
  return models.Tourney.remove({ tourneyId }).exec();
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

export function clearTourneyStandings() {
  return clearAll(models.TourneyStandings);
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

export async function resetTourney() {
  const tourneyId = await getCurrentTourneyId();
  return Promise.all([
    models.Tourney.update({ tourneyId }, { name: null, par: -1 }).exec(),
      clearPickOrder(),
      clearDraftPicks(),
      clearGolfers(),
      clearGolferScores(),
      clearTourneyStandings(),
      clearGolferScoreOverrides(),
      clearChatMessages(),
      clearPickLists(),
      clearAppState(),
      clearUsers()
    ]);
}
