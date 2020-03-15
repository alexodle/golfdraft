
import {keyBy, sortBy, nth} from 'lodash';
import {Access, getAccess, getUsers} from '../access';
import * as mongooseUtil from '../mongooseUtil';
import { DraftExport } from '../ServerTypes';
import { writeFileSync, readFileSync } from 'fs';

type NameMap = { [id: string]: { name: string } };

// back-compat
function ensureReplaceKey<T>(o: T, oldKey: string, newKey: string) {
  if (o[oldKey] || o['_doc'][oldKey]) {
    o[newKey] = o[oldKey] || o['_doc'][oldKey];
    delete o[oldKey];
  }
  return o;
}
function ensureReplaceAllKeys<T>(a: T[], oldKey: string, newKey: string): T[] {
  a.forEach(o => ensureReplaceKey(o, oldKey, newKey));
  return a;
}

function assert(cond, msg) {
  if (!cond) {
    throw new Error('Assert: ' + msg);
  }
}

function ensureTruthy(obj, msg) {
  assert(!!obj, msg);
  return obj;
}

async function exportDraft(access: Access, nameMap?: NameMap): Promise<DraftExport> {
  const [_users, _golfers, draft, chatMessages] = await Promise.all([
    getUsers(),
    access.getGolfers(),
    access.getDraft(),
    access.getChatMessages()
  ]);
  
  // Back-compat
  ensureReplaceAllKeys(draft.picks, 'player', 'user');
  ensureReplaceAllKeys(chatMessages, 'player', 'user');

  const users = nameMap || keyBy(_users, u => u._id.toString());
  const golfers = keyBy(_golfers, g => g._id.toString());

  const draftPicks = sortBy(draft.picks, dp => dp.pickNumber).map(dp => ({
    user: ensureTruthy(users[dp.user.toString()], `User not found: ${dp.user}`)['name'],
    golfer: ensureTruthy(golfers[dp.golfer.toString()], `Golfer not found: ${dp.golfer}`)['name'],
    pickNumber: dp.pickNumber
  }));

  const chatMessagesExport = sortBy(chatMessages, msg => msg.date).map(msg => ({
    user: msg.user ? users[msg.user.toString()]['name'] : null,
    isBot: !!msg.isBot,
    message: msg.message,
    date: msg.date.toISOString()
  }));

  return { draftPicks, chatMessages: chatMessagesExport };
}

function maybeLoadUsernameMapFile(usernameMapFile?: string): null | NameMap {
  if (!usernameMapFile) return null;
  const nameMapContents = JSON.parse(readFileSync(usernameMapFile, 'utf-8'));
  const nameMap = {};
  nameMapContents.nameMap.forEach(it => nameMap[it._id] = { name: it.name });
  return nameMap;
}

async function main(tourneyId: string, outputFile: string, usernameMapFile?: string) {
  const nameMap = maybeLoadUsernameMapFile(usernameMapFile);
  try {
    await mongooseUtil.connect();
    const access = await getAccess(tourneyId);
    const draftJson = await exportDraft(access, nameMap);
    writeFileSync(outputFile, JSON.stringify(draftJson, null, 2), 'utf-8');
  } finally {
    mongooseUtil.close();
  }
}

if (require.main === module) {
  if (process.argv.length !== 4 && process.argv.length !== 5) {
    console.error('Usage: node initTourneyFromExport.js <tourney_id> <output_file> [user_name_map_file]');
    process.exit(1);
  }
  
  main(process.argv[2], process.argv[3], nth(process.argv, 4));
}