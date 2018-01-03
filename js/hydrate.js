'use strict';

const _ = require('lodash');
const AppActions = require('./actions/AppActions');
const DraftActions = require('./actions/DraftActions');
const DraftParser = require('./logic/DraftParser');
const PlayerStore = require('./stores/PlayerStore');
const ScoreActions = require('./actions/ScoreActions');
const SettingsActions = require('./actions/SettingsActions');
const UserActions = require('./actions/UserActions');

/** Hydrates the app with data stamped on initial page load
*/
function hydrate(seedData) {
  const draft = DraftParser.parseDraft(seedData.draft);

  AppActions.setPlayers(seedData.players);
  AppActions.setGolfers(seedData.golfers);
  DraftActions.draftUpdate(draft);
  ScoreActions.scoreUpdate({
    scores: seedData.scores,
    lastUpdated: seedData.tourney.lastUpdated
  });
  SettingsActions.setIsPaused(seedData.appState.isDraftPaused);
  AppActions.setTourneyName(seedData.tourneyName);

  // HACKHACK - For now users are just wrappers around players. I may or may
  // not need to differentiate the two in the future, so just keep the
  // abstraction for now.
  const users = _.transform(PlayerStore.getAll(), function (memo, p) {
    memo[p.id] = { id: p.id, name: p.name, player: p.id };
  });
  AppActions.setUsers(users);

  if (seedData.user) {
    UserActions.hydrateCurrentUser(seedData.user.id);
  }
}

module.exports = _.chain(hydrate)
  .partial(window.golfDraftSeed)
  .once()
  .value();
