'use strict';

var _ = require('lodash');
var AppActions = require('./actions/AppActions');
var DraftActions = require('./actions/DraftActions');
var DraftParser = require('./logic/DraftParser');
var PlayerStore = require('./stores/PlayerStore');
var ScoreActions = require('./actions/ScoreActions');
var SettingsActions = require('./actions/SettingsActions');
var UserActions = require('./actions/UserActions');

/** Hydrates the app with data stamped on initial page load
*/
function hydrate(seedData) {
  var draft = DraftParser.parseDraft(seedData.draft);

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
  var users = _.transform(PlayerStore.getAll(), function (memo, p) {
    var uid = 'user_' + p.id;
    memo[uid] = { id: uid, name: p.name, player: p.id };
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
