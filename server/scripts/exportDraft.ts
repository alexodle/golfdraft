
import {keyBy, sortBy} from 'lodash';
import {Access, getAccess, getUsers} from '../access';
import * as mongooseUtil from '../mongooseUtil';
import { DraftExport } from '../ServerTypes';
import { writeFileSync } from 'fs';

async function exportDraft(access: Access): Promise<DraftExport> {
  const [_users, _golfers, draft, chatMessages] = await Promise.all([
    getUsers(),
    access.getGolfers(),
    access.getDraft(),
    access.getChatMessages()
  ]);
  const users = keyBy(_users, u => u._id.toString());
  const golfers = keyBy(_golfers, g => g._id.toString());

  const draftPicks = sortBy(draft.picks, dp => dp.pickNumber).map(dp => ({
    user: users[dp.user.toString()]['name'],
    golfer: golfers[dp.golfer.toString()]['name'],
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

async function main(tourneyId, outputFile) {
  try {
    await mongooseUtil.connect();
    const access = await getAccess(tourneyId);
    const draftJson = await exportDraft(access);
    writeFileSync(outputFile, JSON.stringify(draftJson, null, 2), 'utf-8');
  } finally {
    mongooseUtil.close();
  }
}

if (require.main === module) {
  if (process.argv.length !== 4) {
    console.error('Usage: node initTourneyFromExport.js <tourney_id> <output_file>');
    process.exit(1);
  }
  
  main(process.argv[2], process.argv[3]);
}