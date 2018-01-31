import * as _ from 'lodash';
import * as access from './access';
import * as utils from '../common/utils';
import {
  Draft,
  DraftPick,
  Golfer,
  UserDoc,
} from './ServerTypes';

function loadPick(draft: Draft, draftPick: DraftPick): Promise<{ pickUser: UserDoc, pickGolfer: Golfer, nextUser: UserDoc}> {
  const nextPick = draft.pickOrder[draft.picks.length];
  return Promise.all([
      access.getUser(draftPick.user.toString()),
      access.getGolfer(draftPick.golfer.toString()),
      nextPick ? access.getUser(nextPick.user.toString()) : null,
    ])
    .then(function (results){
      const [pickUser, pickGolfer, nextUser] = results;
      return { pickUser, pickGolfer, nextUser };
    });
}

function sendMessage(message: string, pickInfo) {
  return access.createChatBotMessage({ message })
    .then(() => {
      if (pickInfo.nextUser) {
        return access.createChatBotMessage({
          message: pickInfo.nextUser.name + ', you\'re up!'
        });
      } else {
        return access.createChatBotMessage({
          message: 'Draft is complete!'
        });
      }
    });
}

export function broadcastUndoPickMessage(draftPick, draft) {
  return loadPick(draft, draftPick)
    .then((pickInfo) => {
      const {pickUser, pickGolfer} = pickInfo;
      const message = 'PICK REVERTED: ' + pickUser.name + ' picks ' + pickGolfer.name;
      return sendMessage(message, pickInfo);
    });
}

export function broadcastAutoPickMessage(draftPick, draft, isPickListPick: boolean) {
  return loadPick(draft, draftPick)
    .then(function (pickInfo) {
      const {pickUser, pickGolfer} = pickInfo;
      const message = pickUser.name + ' picks ' + pickGolfer.name + (isPickListPick ?
          ' (auto-draft from pick list)' :
          ' (auto-draft wgr)'
      );
      return sendMessage(message, pickInfo);
    });
}

export function broadcastProxyPickListPickMessage(currentUser, draftPick, draft) {
  return loadPick(draft, draftPick)
    .then(function (pickInfo) {
      const {pickUser, pickGolfer} = pickInfo;
      const message = pickUser.name + ' picks ' + pickGolfer.name + ' (pick list proxy from ' + currentUser.name + ')';
      return sendMessage(message, pickInfo);
    });
}

export function broadcastPickMessage(currentUser, draftPick, draft) {
  return loadPick(draft, draftPick)
    .then(function (pickInfo) {
      const {pickUser, pickGolfer} = pickInfo;
      const isProxyPick = utils.oidsAreEqual(pickUser._id, currentUser._id);

      let message = pickUser.name + ' picks ' + pickGolfer.name;
      if (isProxyPick) {
        message += ' (proxy from ' + currentUser.name + ')';
      }

      return sendMessage(message, pickInfo);
    });
}
