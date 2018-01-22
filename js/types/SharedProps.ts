import * as Types from './Types';

export interface DraftProps {
  isMyDraftPick: boolean;
  currentPick?: Types.DraftPickOrder;
  draftPicks: Types.DraftPick[];
  pickingForUsers: string[];
  syncedPickList: string[];
  pendingPickList: string[];
}
