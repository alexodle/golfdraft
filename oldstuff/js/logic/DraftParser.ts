import * as _ from 'lodash';

export interface ServerDraft {
  serverTimestamp: string;
  picks: {
    timestamp: string;
  }
}

/**
 * Parse server draft
 */
export default function parseDraft(draft) {
  const currentTime = new Date();

  const serverTimestamp = draft.serverTimestamp = new Date(draft.serverTimestamp);
  _.each(draft.picks, function (p) {
    const pickDate = p.timestamp = new Date(p.timestamp);

    // Add a timestamp that is adjusted for the client. Clients can use this to
    // determine how long it has been since the last pick.
    p.clientTimestamp = new Date(pickDate.getTime() - (serverTimestamp.getTime() - currentTime.getTime()));
  });

  return draft;
}
