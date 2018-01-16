// @flow
'use strict';

/**
 * Parse server draft
 */
function parseDraft(draft) {
  const currentTime = new Date();

  draft.serverTimestamp = new Date(draft.serverTimestamp);
  _.each(draft.picks, function (p) {
    p.timestamp = new Date(p.timestamp);

    // Add a timestamp that is adjusted for the client. Clients can use this to
    // determine how long it has been since the last pick.
    p.clientTimestamp = new Date(p.timestamp - (draft.serverTimestamp - currentTime));
  });

  return draft;
}

module.exports = {
  parseDraft: parseDraft
};
