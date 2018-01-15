'use strict';

const _ = require('lodash');
const AppActions = require('./actions/AppActions');
const DraftActions = require('./actions/DraftActions');
const DraftParser = require('./logic/DraftParser');
const ScoreActions = require('./actions/ScoreActions');
const SettingsActions = require('./actions/SettingsActions');
const UserActions = require('./actions/UserActions');

/** Hydrates the app with data stamped on initial page load
*/
function hydrate(seedData) {
  const draft = DraftParser.parseDraft(seedData.draft);

  AppActions.setUsers(seedData.users);
  AppActions.setGolfers(seedData.golfers);
  DraftActions.draftUpdate(draft);
  ScoreActions.scoreUpdate({
    scores: seedData.scores,
    lastUpdated: seedData.tourney.lastUpdated
  });
  SettingsActions.setAppState(seedData.appState);
  AppActions.setTourneyName(seedData.tourneyName);

  if (seedData.user) {
    UserActions.hydrateCurrentUser(seedData.user.id);
  }
}

module.exports = _.chain(hydrate)
  .partial(window.golfDraftSeed)
  .once()
  .value();
