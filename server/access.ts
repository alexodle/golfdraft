import * as chatModels from './chatModels';
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
  ScoreOverrideDoc,
  User,
  UserDoc,
  WGR,
  WGRDoc,
  TourneyDoc,
  TourneyConfigSpec,
  Tourney,
} from './ServerTypes';
import {
  chain,
  isEmpty,
  pick,
  uniq,
  keyBy,
  sortBy,
  map,
  keys,
  groupBy,
  minBy,
} from 'lodash';

const UNKNOWN_WGR = constants.UNKNOWN_WGR;

const _cache: {[tourneyId: string]: Access} = {};
export function getAccess(tourneyId: string): Access {
  if (!tourneyId || isEmpty(tourneyId)) {
    throw new Error("Empty tourney id");
  }
  
  let obj = _cache[tourneyId];
  if (obj) return obj;

  obj = _cache[tourneyId] = new Access(tourneyId);
  return obj;
}

export async function ensureUsers(allUsers: User[]) {
  const users = await getUsers();
  const existingUsersByName = keyBy(users, 'name');
  const usersToAdd = allUsers.filter(json => !existingUsersByName[json.name]);
  const promises = usersToAdd.map(u => {
    return new Promise((resolve, reject) => {
      (<any>models.User).register(new models.User({ username: u.username, name: u.name }), u.password, (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  });
  return Promise.all(promises);
}

export async function getUsers(): Promise<UserDoc[]> {
  return models.User.find({}).exec() as Promise<UserDoc[]>;
}

export async function getUser(userId: string): Promise<UserDoc> {
  return models.User.findOne({ _id: userId }).exec() as Promise<UserDoc>;
}

export async function getUserByUsername(username: string): Promise<UserDoc> {
  return models.User.findOne({ username }).exec() as Promise<UserDoc>;
}

export function getAllTourneys(): Promise<TourneyDoc[]> {
  return models.Tourney.find().exec() as Promise<TourneyDoc[]>;
}

export function getAppState(): Promise<AppSettings> {
  return models.AppState.findOne().exec() as Promise<AppSettingsDoc>;
}

export function updateAppState(props: AppSettings) {
  return models.AppState.update({}, props, { upsert: true }).exec();
}

export async function exportTourneyResults() {
  const tourneys = await getAllTourneys();
  const tourneysById = keyBy(tourneys, t => t._id.toString() as string);

  const tourneyIdsQuery = { tourneyId: { $in: keys(tourneysById) } };
  const [users, tourneyStandings, pickOrders] = await Promise.all([
    getUsers(),
    models.TourneyStandings.find(tourneyIdsQuery).exec() as Promise<TourneyStandingsDoc[]>,
    models.DraftPickOrder.find(tourneyIdsQuery).exec() as Promise<DraftPickOrderDoc[]>
  ]);
  const usersById = keyBy(users, u => u._id.toString() as string);
  const pickOrdersByTourneyId = groupBy(pickOrders, o => o.tourneyId.toString());

  const tourneyStandingsOut = tourneyStandings.map(st => {
    const tourney = tourneysById[st.tourneyId.toString()];
    const draftOrderByUser = chain(pickOrdersByTourneyId[tourney._id.toString()])
      .groupBy(po => po.user.toString())
      .mapValues(pos => minBy(pos, po => po.pickNumber).pickNumber)
      .value();

    return {
      tourney: pick(tourneysById[st.tourneyId.toString()], ['_id', 'name', 'startDate']),
      userScores: st.playerScores.map(ps => ({
        user: pick(usersById[ps.player], ['_id', 'name']),
        totalScore: ps.totalScore,
        standing: ps.standing,
        isTied: ps.isTied,
        pickNumber: draftOrderByUser[ps.player]
      }))
    };
  });

  return tourneyStandingsOut;
}

function toNameMap(srcDestPairs: { src: string, dest: string }[]): { [key: string]: string } {
  const obj = {};
  srcDestPairs.forEach(p => obj[p.src] = p.dest);
  return obj;
}

function configToTourneyObject(spec: TourneyConfigSpec): Tourney  {
  const tourney = pick(spec, 'name', 'startDate') as Tourney;
  tourney.lastUpdated = new Date();
  tourney.config = {
    par: spec.par || -1,
    scoresSync: {
      syncType: spec.scoresSync.syncType,
      url: spec.scoresSync.url,
      nameMap: map(spec.scoresSync.nameMap, (v, k) => ({ src: k, dest: v })),
    },
    draftOrder: spec.draftOrder,
    wgr: {
      url: spec.wgr.url,
      nameMap: map(spec.wgr.nameMap, (v, k) => ({ src: k, dest: v })),
    }
  };
  return tourney;
}

function tourneyToConfigSpec(tourney: Tourney): TourneyConfigSpec {
  const spec = pick(tourney, 'name', 'startDate') as TourneyConfigSpec;
  spec.par = tourney.config.par;
  spec.draftOrder = tourney.config.draftOrder;
  spec.scoresSync = {
    ...tourney.config.scoresSync,
    nameMap: toNameMap(tourney.config.scoresSync.nameMap)
  };
  spec.wgr = {
    ...tourney.config.wgr,
    nameMap: toNameMap(tourney.config.wgr.nameMap)
  };
  return spec;
}

export async function initNewTourney(spec: TourneyConfigSpec): Promise<string> {
  const q = { name: spec.name };
  const tourneyObj = configToTourneyObject(spec);
  await models.Tourney.update(q, tourneyObj, { upsert: true }).exec();

  const tourney = await models.Tourney.findOne(q).exec();
  return tourney._id.toString();
}

let _activeTourneyAccess: Access = null;
export async function getActiveTourneyAccess(): Promise<Access> {
  if (_activeTourneyAccess) return _activeTourneyAccess;
  
  const appState = await getAppState();
  _activeTourneyAccess = getAccess(appState.activeTourneyId);
  return _activeTourneyAccess;
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

  getTourneyId() {
    return this.tourneyId;
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
    return objs.map(this.extendWithTourneyId);
  }

  private multiUpdate = async (model: Model<Document>, queryMask: string[], objs: {}[]) => {
    objs = this.extendAllWithTourneyId(objs);
    return Promise.all(objs.map( o => {
      const query = pick(o, queryMask);
      return model.update(query, o, { upsert: true }).exec();
    }));
  };

  private getAll = async (model: Model<Document>) => {
    return model.find({ tourneyId: this.tourneyId }).exec();
  };

  async getTourney(): Promise<TourneyDoc> {
    return models.Tourney.findOne({ _id: this.tourneyId }).exec() as Promise<TourneyDoc>;
  }

  async getTourneyConfig(): Promise<TourneyConfigSpec> {
    const tourney = await this.getTourney();
    return tourneyToConfigSpec(tourney);
  }

  async getPickList(userId: string): Promise<string[]> {
    const query = { tourneyId: this.tourneyId, userId };
    const pickList = await models.DraftPickList.findOne(query).exec() as DraftPickListDoc;
    return pickList ? pickList.golferPickList.map(oid => oid.toString()) : null;
  }

  async getPickListUsers(): Promise<ObjectId[]> {
    const query = { tourneyId: this.tourneyId }
    const picksLists = await models.DraftPickList.find(query, { userId: true }).exec() as DraftPickListDoc[];
    const users = picksLists.map(dpl => dpl.userId);
    return users;
  }

  async updatePickList(userId: string, pickList: string[]) {
    pickList = uniq(pickList);
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
    const golfersByLcName = keyBy(golfers, g => g.name.toLowerCase());

    const notFoundGolferNames = new Set<string>();
    const pickList = pickListNames.map(n => {
      const g = golfersByLcName[n.toLowerCase()];
      if (!g) {
        notFoundGolferNames.add(n);
        return null;
      }
      return g._id.toString();
    });

    if (isEmpty(notFoundGolferNames)) {
      // SUCCESS! Found all golfers by name, so go ahead and save them.
      return this.updatePickList(userId, pickList);
    }

    // Did not find at at least one golfer by name. Calculate closest matches and provide those
    // suggestions to the client.
    //
    // Note: In order to keep this whole process stateless for client and server, return good matches too
    const golferNames = golfers.map(g => g.name);
    const suggestions = pickListNames.map(n => {
      if (notFoundGolferNames.has(n)) {
        const levResult = levenshteinDistance.runAll(n, golferNames);

        let allResults = levResult.results;
        let bestResult = levResult.results[0];
        const isGoodSuggestion = bestResult.coeff >= MIN_COEFF;

        if (!isGoodSuggestion) {
          allResults = sortBy(allResults, r => r.target);
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

  async getGolfers(): Promise<Golfer[]> {
    const [_wgrs, _golfers] = await Promise.all([
      models.WGR.find().exec(),
      models.Golfer.find({ tourneyId: this.tourneyId }).exec(),
    ]);
    const wgrs = keyBy(_wgrs as WGRDoc[], 'name');
    return (_golfers as GolferDoc[]).map(g => mergeWGR(g, wgrs[g.name]));
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

  async makePickListPick(userId: string, pickNumber: number) {
    let [pickList, golfers, picks] = await Promise.all([
      this.getPickList(userId),
      this.getGolfers(),
      this.getPicks()
    ]);
    pickList = pickList || [];
    
    const pickedGolfers = chain(picks)
      .map(p => p.golfer)
      .keyBy()
      .value();

    let golferToPick = chain(pickList)
      .filter(gid => !pickedGolfers[gid.toString()])
      .nth()
      .value();

    // If no golfer from the pickList list is available, use wgr
    const isPickListPick = !!golferToPick;
    if (!golferToPick) {
      const remainingGolfers = chain(golfers)
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
      throw new Error(`invalid pick: pick order out of sync (user: ${pick.user}, pickNumber: ${pick.pickNumber})`);
    } else if (!userIsUp && !ignoreOrder) {
      throw new Error(`invalid pick: user picked out of order (user: ${pick.user}, pickNumber: ${pick.pickNumber})`);
    } else if (golferAlreadyDrafted) {
      throw new Error(`invalid pick: golfer already drafted (user: ${pick.user}, pickNumber: ${pick.pickNumber}, golfer: ${pick.golfer})`);
    } else if (!golferExists) {
      throw new Error(`invalid pick: invalid golfer (user: ${pick.user}, pickNumber: ${pick.pickNumber}, golfer: ${pick.golfer})`);
    }

    pick = this.extendWithTourneyId(pick);
    pick.timestamp = new Date();
    const pickDoc = await models.DraftPick.create(pick);

    this.fire(Access.EVENTS.pickMade);

    return pick;
  }

  async undoLastPick(): Promise<DraftPickDoc> {
    const nPicks = await models.DraftPick.count({ tourneyId: this.tourneyId }).exec();
    const query = { tourneyId: this.tourneyId, pickNumber: nPicks - 1 };
    const golfer = await models.DraftPick.findOneAndRemove(query, { useFindAndModify: true }).exec() as any as Promise<DraftPickDoc>;
    return golfer
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
      pickOrder: sortBy(pickOrder as DraftPickOrderDoc[], p => p.pickNumber),
      picks: sortBy(picks, p => p.pickNumber),
      serverTimestamp: new Date()
    };
  }

  touchLastUpdated() {
    return this.updateTourney({});
  }

  updateTourney(props) {
    props = { ...props, lastUpdated: new Date() };
    return models.Tourney.update(
      { _id: this.tourneyId },
      props,
      { upsert: true }
    ).exec();
  }

  async ensureGolfers(objs: Golfer[]) {
    return this.multiUpdate(models.Golfer, ['name', 'tourneyId'], objs);
  }

  async replaceWgrs(wgrEntries: WGR[]) {
    await models.WGR.deleteMany({}).exec();
    return models.WGR.create(wgrEntries);
  }

  async setPickOrder(objs: DraftPickOrder[]) {
    await models.DraftPickOrder.deleteMany({ tourneyId: this.tourneyId }).exec();
    return this.multiUpdate(models.DraftPickOrder, ['tourneyId', 'user', 'pickNumber'], objs);
  }

  async updateScores(objs: GolferScore[]) {
    await models.GolferScore.deleteMany({ tourneyId: this.tourneyId }).exec();
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

}