import * as ClientTypes from './ClientTypes';

export interface DraftProps {
  pickOrder: ClientTypes.DraftPickOrder[];
  isMyDraftPick: boolean;
  currentPick?: ClientTypes.DraftPickOrder;
  draftPicks: ClientTypes.DraftPick[];
  pickingForUsers: string[];
  syncedPickList: string[];
  pendingPickList: string[];
}
