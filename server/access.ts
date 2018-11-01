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

const _cache: { [tourneyId: string]: Access } = {};
export function getAccess(tourneyId: string): Access {
  if (!tourneyId || _.isEmpty(tourneyId)) {
    throw new Error("Empty tourney id");
  }
  
  let obj = _cache[tourneyId];
  if (obj) return obj;

  obj = _cache[tourneyId] = new Access(tourneyId);
  return obj;
}

function mergeWGR(golfer: GolferDoc, wgrEntry: WGR): Golfer {
  let wgr = null;
  if (!wgrEntry) {
    wgr = UNKNOWN_WGR;
  } else {
    wgr = wgrEntry.wgr;
  }
  return { wgr, ...golfer.toObject() };
}

export class Access {

  static readonly EVENTS = {
    standingsUpdate: 'standingsUpdate',
    pickMade: 'pickMade'
  }

  private tourneyId: ObjectId;
  private listeners: { [key: string]: Array<() => void> };

  constructor(tourneyId: string) {
    this.tourneyId = new mongoose.Types.ObjectId(tourneyId);
    this.listeners = {};
  }

  // TODO: Extract
  on(key: string, f: () => void) {
    const l = this.listeners[key] || (this.listeners[key] = []);
    l.push(f);
  }
  fire(key: string) {
    const l = this.listeners[key] || [];
    l.forEach(f => setTimeout(f, 0));
  }

  private extendWithTourneyId = (obj) => {
    return { ...obj, tourneyId: this.tourneyId };
  }

  private extendAllWithTourneyId = (objs) => {
    return _.map(objs, this.extendWithTourneyId);
  }

  private multiUpdate = async (model: Model<Document>, queryMask: string[], objs: {}[]) => {
    objs = this.extendAllWithTourneyId(objs);
    return Promise.all(_.map(objs, o => {
      const query = _.pick(o, queryMask);
      return model.update(query, o, { upsert: true }).exec();
    }));
  };

  private getAll = async (model: Model<Document>) => {
    return model.find({ tourneyId: this.tourneyId }).exec();
  };

  private clearAll = async (model: Model<Document>) => {
    return model.remove({ tourneyId: this.tourneyId }).exec();
  };

  async getTourney() {
    return models.Tourney.findOne({ _id: this.tourneyId }).exec();
  }

  async getPickList(userId: string): Promise<string[]> {
    const query = _.extend({ userId }, { tourneyId: this.tourneyId });
    const pickList = await models.DraftPickList.findOne(query).exec() as DraftPickListDoc;
    return pickList ? _.map(pickList.golferPickList, oid => oid.toString()) : null;
  }

  async updatePickList(userId: string, pickList: string[]) {
    pickList = _.uniq(pickList);
    const query = { userId: userId, tourneyId: this.tourneyId };
    await models.DraftPickList
      .update(
        query,
        { $set: { golferPickList: pickList } },
        { upsert: true }
      ).exec();
    return {
      completed: true,
      pickList: pickList,
      suggestions: null
    };
  }

  async updateAutoPick(userId: string, autoPick: boolean) {
    let update = null;
    if (!!autoPick) {
      update = models.AppState.update(
        {},
        { $addToSet: { autoPickUsers: userId } },
        { upsert: true });
    } else {
      update = models.AppState.update(
        {},
        { $pull: { autoPickUsers: userId } },
        { multi: true });
    }

    return update.exec();
  }


  async updatePickListFromNames(userId: string, pickListNames: string[]) {
    const MIN_COEFF = 0.5;

    const golfers = await this.getGolfers();
    const golfersByLcName = _.keyBy(golfers, g => g.name.toLowerCase());

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
      return this.updatePickList(userId, pickList);
    }

    // Did not find at at least one golfer by name. Calculate closest matches and provide those
    // suggestions to the client.
    //
    // Note: In order to keep this whole process stateless for client and server, return good matches too
    const golferNames = _.map(golfers, g => g.name);
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
        return { type: 'EXACT', source: n };
      }
    });

    return {
      completed: false,
      suggestions: suggestions,
      pickList: null
    };
  }

  async getGolfer(golferId: string): Promise<Golfer> {
    const query = { _id: golferId, tourneyId: this.tourneyId };
    const golfer = await models.Golfer.findOne(query).exec() as GolferDoc;
    const wgr = await models.WGR.findOne({ name: golfer.name }).exec() as WGRDoc;
    return mergeWGR(golfer, wgr);
  }

  async getUser(userId: string): Promise<UserDoc> {
    return models.User.findOne({ _id: userId }).exec() as Promise<UserDoc>;
  }

  async getUserByUsername(username: string): Promise<UserDoc> {
    return models.User.findOne({ username }).exec() as Promise<UserDoc>;
  }

  async getGolfers(): Promise<Golfer[]> {
    const [_wgrs, _golfers] = await Promise.all([
      models.WGR.find().exec(),
      models.Golfer.find({ tourneyId: this.tourneyId }).exec(),
    ]);
    const wgrs = _.keyBy(_wgrs as WGRDoc[], 'name');
    return _.map(_golfers as GolferDoc[], g => mergeWGR(g, wgrs[g.name]));
  }

  async getUsers(): Promise<UserDoc[]> {
    return models.User.find({}).exec() as Promise<UserDoc[]>;
  }

  async getScores(): Promise<GolferScoreDoc[]> {
    return this.getAll(models.GolferScore) as Promise<GolferScoreDoc[]>;
  }

  async getTourneyStandings(): Promise<TourneyStandingsDoc> {
    return models.TourneyStandings.findOne({ tourneyId: this.tourneyId }).exec() as Promise<TourneyStandingsDoc>;
  }

  async getPicks(): Promise<DraftPickDoc[]> {
    return this.getAll(models.DraftPick) as Promise<DraftPickDoc[]>;
  }

  async getScoreOverrides(): Promise<ScoreOverrideDoc[]> {
    return this.getAll(models.GolferScoreOverrides) as Promise<ScoreOverrideDoc[]>;
  }

  async getAppState(): Promise<AppSettings> {
    return await models.AppState.findOne().exec() as AppSettingsDoc;
  }

  async updateAppState(props: AppSettings) {
    return models.AppState.update({}, props, { upsert: true }).exec();
  }

  async makePickListPick(userId: string, pickNumber: number) {
    let [pickList, golfers, picks] = await Promise.all([
      this.getPickList(userId),
      this.getGolfers(),
      this.getPicks()
    ]);
    pickList = pickList || [];
    
    const pickedGolfers = _.chain(picks)
      .map(p => p.golfer)
      .keyBy()
      .value();

    let golferToPick = _.chain(pickList)
      .filter(gid => !pickedGolfers[gid.toString()])
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

    const resp = await this.makePick(pick);
    return { isPickListPick, ...resp };
  }

  async makePick(pick: DraftPick, ignoreOrder?: boolean) {
    const pickOrderQuery = {
      tourneyId: this.tourneyId,
      pickNumber: pick.pickNumber,
      user: pick.user
    };
    const golferDraftedQuery = {
      tourneyId: this.tourneyId,
      golfer: pick.golfer
    };
    const golferExistsQuery = {
      tourneyId: this.tourneyId,
      _id: pick.golfer
    };
    
    const [nPicks, userIsUp, golferAlreadyDrafted, golferExists] = await Promise.all([
      // Ensure correct pick numnber
      models.DraftPick.count({ tourneyId: this.tourneyId }).exec(),

      // Ensure this user is actually up in the draft
      models.DraftPickOrder.findOne(pickOrderQuery).exec(),

      // Ensure golfer isn't already picked
      models.DraftPick.findOne(golferDraftedQuery).exec(),

      // Ensure this golfer actually exists
      models.Golfer.findOne(golferExistsQuery).exec()
    ]);

    if (nPicks !==  pick.pickNumber && !ignoreOrder) {
      throw new Error('invalid pick: pick order out of sync');
    } else if (!userIsUp && !ignoreOrder) {
      throw new Error('invalid pick: user picked out of order');
    } else if (golferAlreadyDrafted) {
      throw new Error('invalid pick: golfer already drafted');
    } else if (!golferExists) {
      throw new Error('invalid pick: invalid golfer');
    }

    pick = this.extendWithTourneyId(pick);
    pick.timestamp = new Date();
    const pickDoc = await models.DraftPick.create(pick);

    this.fire(Access.EVENTS.pickMade);

    return pick;
  }

  async undoLastPick(): Promise<DraftPickDoc> {
    const nPicks = await models.DraftPick.count({ tourneyId: this.tourneyId }).exec();
    return models.DraftPick.findOneAndRemove({ pickNumber: nPicks - 1 }).exec() as Promise<DraftPickDoc>;
  }

  async isDraftComplete(): Promise<boolean> {
    const [nActualPicks, nExpectedPicks] = await Promise.all([
      models.DraftPick.count({ tourneyId: this.tourneyId }).exec(),
      models.DraftPickOrder.count({ tourneyId: this.tourneyId }).exec()
    ]);
    return nActualPicks >= nExpectedPicks;
  }

  async getDraft(): Promise<Draft> {
    const [pickOrder, picks] = await Promise.all([
      models.DraftPickOrder.find({ tourneyId: this.tourneyId }).exec(),
      this.getPicks()
    ]);
    return {
      pickOrder: _.sortBy(pickOrder as DraftPickOrderDoc[], 'pickNumber'),
      picks: _.sortBy(picks, 'pickNumber'),
      serverTimestamp: new Date()
    };
  }

  async updateTourney(props) {
    props = _.extend({}, props, { lastUpdated: new Date() });
    return models.Tourney.update(
      { _id: this.tourneyId },
      props,
      { upsert: true }
    ).exec();
  }

  async ensureUsers(allUsers: User[]) {
    const users = await this.getUsers();
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
  }

  async ensureGolfers(objs: Golfer[]) {
    return this.multiUpdate(models.Golfer, ['name', 'tourneyId'], objs);
  }

  async replaceWgrs(wgrEntries: WGR[]) {
    await models.WGR.remove({}).exec()
    return models.WGR.create(wgrEntries);
  }

  async setPickOrder(objs: DraftPickOrder[]) {
    return this.multiUpdate(models.DraftPickOrder, ['tourneyId', 'user', 'pickNumber'], objs);
  }

  async updateScores(objs: GolferScore[]) {
    return this.multiUpdate(models.GolferScore, ['golfer', 'tourneyId'], objs);
  }

  async updateTourneyStandings(tourneyStandings: TourneyStandings) {
    const result = await models.TourneyStandings.update(
      { _id: this.tourneyId },
      { $set: { tourneyId: this.tourneyId, ...tourneyStandings } },
      { upsert: true });
    this.fire(Access.EVENTS.standingsUpdate);
    return result;
  }

  // Chat

  async getChatMessages(): Promise<ChatMessageDoc[]> {
    return chatModels.Message.find({ tourneyId: this.tourneyId }).exec() as Promise<ChatMessageDoc[]>;
  }

  async createChatMessage(message: ChatMessage) {
    message = this.extendWithTourneyId(message);
    message.date = new Date(); // probably not needed b/c we can use ObjectId
    await chatModels.Message.create(message)
    return io.sockets.emit('change:chat', {
      data: message,
      evType: 'change:chat',
      action: 'chat:newMessage'
    });
  }

  async createChatBotMessage(message: { message: string }) {
    return this.createChatMessage({ ...message, isBot: true } as ChatMessage);
  }

    // DEBUGGING/TESTING

  async clearTourney() {
    return models.Tourney.remove({ _id: this.tourneyId }).exec();
  }

  async clearPickOrder() {
    return this.clearAll(models.DraftPickOrder);
  }

  async clearDraftPicks() {
    return this.clearAll(models.DraftPick);
  }

  async clearGolfers() {
    return this.clearAll(models.Golfer);
  }

  async clearGolferScores() {
    return this.clearAll(models.GolferScore);
  }

  async clearGolferScoreOverrides() {
    return this.clearAll(models.GolferScoreOverrides);
  }

  async clearTourneyStandings() {
    return this.clearAll(models.TourneyStandings);
  }

  async clearPickLists() {
    return this.clearAll(models.DraftPickList);
  }

  async clearChatMessages() {
    return this.clearAll(chatModels.Message);
  }

  async clearWgrs() {
    return this.clearAll(models.WGR);
  }

  async clearAppState() {
    return models.AppState.remove({}).exec();
  }

  async clearUsers() {
    return models.User.remove({}).exec();
  }

  async resetTourney() {
    return Promise.all([
      models.Tourney.update({ _id: this.tourneyId }, {
        name: null,
        par: -1
      }).exec(),
      this.clearPickOrder(),
      this.clearDraftPicks(),
      this.clearGolfers(),
      this.clearGolferScores(),
      this.clearTourneyStandings(),
      this.clearGolferScoreOverrides(),
      this.clearChatMessages(),
      this.clearPickLists(),
      this.clearAppState()
    ]);
  }

}