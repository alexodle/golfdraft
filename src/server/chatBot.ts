import {getActiveTourneyAccess, getUser} from '../server/access';
import * as utils from '../common/utils';
import constants from '../common/constants';
import {
  Draft,
  DraftPick,
  Golfer,
  UserDoc,
} from './ServerTypes';

async function loadPick(draft: Draft, draftPick: DraftPick): Promise<{ pickUser: UserDoc, pickGolfer: Golfer, nextUser: UserDoc}> {
  const nextPick = draft.pickOrder[draft.picks.length];
  const access = await getActiveTourneyAccess();
  const [pickUser, pickGolfer, nextUser] = await Promise.all([
    getUser(draftPick.user.toString()),
    access.getGolfer(draftPick.golfer.toString()),
    nextPick ? getUser(nextPick.user.toString()) : null,
  ]);
  return { pickUser, pickGolfer, nextUser };
}

async function sendMessage(message: string, pickInfo) {
  const access = await getActiveTourneyAccess();
  await access.createChatBotMessage({ message });
  if (pickInfo.nextUser) {
    return access.createChatBotMessage({
      message: pickInfo.nextUser.name + ', you\'re up!'
    });
  } else {
    return access.createChatBotMessage({
      message: 'Draft is complete!'
    });
  }
}

export async function broadcastUndoPickMessage(draftPick, draft) {
  const pickInfo = await loadPick(draft, draftPick);
  const {pickUser, pickGolfer} = pickInfo;
  const message = 'PICK REVERTED: ' + pickUser.name + ' picks ' + pickGolfer.name;
  return sendMessage(message, pickInfo);
}

export async function broadcastAutoPickMessage(draftPick, draft, isPickListPick: boolean) {
  const pickInfo = await loadPick(draft, draftPick);
  const {pickUser, pickGolfer} = pickInfo;
  const message = pickUser.name + ' picks ' + pickGolfer.name + (isPickListPick ?
      ' (auto-draft from pick list)' :
      ` (auto-draft ${utils.getOrdinal(constants.ABSENT_PICK_NTH_BEST_WGR)} best WGR)`
  );
  return sendMessage(message, pickInfo);
}

export async function broadcastProxyPickListPickMessage(currentUser, draftPick, draft, isPickListPick: boolean) {
  const pickInfo = await loadPick(draft, draftPick);
  const {pickUser, pickGolfer} = pickInfo;

  const message =  `${pickUser.name} picks ${pickGolfer.name}` + (isPickListPick ?
    ` (from pick list, proxy from ${currentUser.name})` :
    ` (${utils.getOrdinal(constants.ABSENT_PICK_NTH_BEST_WGR)} best WGR, proxy from ${currentUser.name})`
  );
  return sendMessage(message, pickInfo);
}

export async function broadcastPickMessage(currentUser, draftPick, draft) {
  const pickInfo = await loadPick(draft, draftPick);
  const {pickUser, pickGolfer} = pickInfo;
  const isProxyPick = !utils.oidsAreEqual(pickUser._id, currentUser._id);

  let message = pickUser.name + ' picks ' + pickGolfer.name;
  if (isProxyPick) {
    message += ' (proxy from ' + currentUser.name + ')';
  }

  return sendMessage(message, pickInfo);
}
