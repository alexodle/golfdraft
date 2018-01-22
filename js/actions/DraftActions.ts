import AppDispatcher from '../dispatcher/AppDispatcher';
import DraftConstants from '../constants/DraftConstants';

export default class DraftActions {

  static makePick(golferId: string) {
    AppDispatcher.handleViewAction({
      actionType: DraftConstants.DRAFT_PICK,
      golfer: golferId
    });
  }

  static makePickListPick() {
    AppDispatcher.handleViewAction({
      actionType: DraftConstants.DRAFT_PICK_HIGHEST_PRI
    });
  }

  static draftUpdate(draft) {
    AppDispatcher.handleServerAction({
      actionType: DraftConstants.DRAFT_UPDATE,
      draft: draft
    });
  }

  static draftForUser(userId: string) {
    AppDispatcher.handleViewAction({
      actionType: DraftConstants.DRAFT_FOR_USER,
      user: userId
    });
  }

  static stopDraftingForUser(userId: string) {
    AppDispatcher.handleViewAction({
      actionType: DraftConstants.STOP_DRAFT_FOR_USER,
      user: userId
    });
  }

  static updatePendingPickList(pendingPickList: string[]) {
    AppDispatcher.handleViewAction({
      actionType: DraftConstants.UPDATE_PENDING_PICK_LIST,
      pendingPickList: pendingPickList
    });
  }

  static resetPendingPickList() {
    AppDispatcher.handleViewAction({
      actionType: DraftConstants.RESET_PENDING_PICK_LIST
    });
  }

  static savePickList() {
    AppDispatcher.handleViewAction({
      actionType: DraftConstants.SAVE_PICK_LIST
    });
  }

  static setPickList(pickList: string[]) {
    AppDispatcher.handleViewAction({
      actionType: DraftConstants.SET_PICK_LIST,
      pickList: pickList
    });
  }

};
