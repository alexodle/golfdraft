var AppActions = require('./actions/AppActions');
var DraftActions = require('./actions/DraftActions');
var ScoreActions = require('./actions/ScoreActions');
var UserActions = require('./actions/UserActions');
var PlayerStore = require('./stores/PlayerStore');

/** Hydrates the app with data stamped on initial page load
*/
function hydrate(seedData) {
  AppActions.setPlayers(seedData.players);
  AppActions.setGolfers(seedData.golfers);
  DraftActions.draftUpdate(seedData.draft);
  ScoreActions.scoreUpdate({
    scores: seedData.scores,
    lastUpdated: seedData.tourney.lastUpdated
  });

  // HACKHACK - For now users are just wrappers around players. I may or may
  // not need to differentiate the two in the future, so just keep the
  // abstraction for now.
  var users = _.transform(PlayerStore.getAll(), function (memo, p) {
    var uid = 'user_' + p.id;
    memo[uid] = { id: uid, name: p.name, player: p.id };
  });
  AppActions.setUsers(users);

  if (seedData.user) {
    UserActions.setCurrentUser(seedData.user.id);
  }
}

module.exports = _.chain(hydrate)
  .partial(window.golfDraftSeed)
  .once()
  .value();
