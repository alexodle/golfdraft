"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const AppActions_1 = require("./actions/AppActions");
const DraftActions_1 = require("./actions/DraftActions");
const DraftParser_1 = require("./logic/DraftParser");
const ScoreActions_1 = require("./actions/ScoreActions");
const SettingsActions_1 = require("./actions/SettingsActions");
const UserActions_1 = require("./actions/UserActions");
/** Hydrates the app with data stamped on initial page load
*/
function hydrate(seedData) {
    const draft = DraftParser_1.default(seedData.draft);
    AppActions_1.default.setUsers(seedData.users);
    AppActions_1.default.setGolfers(seedData.golfers);
    DraftActions_1.default.draftUpdate(draft);
    ScoreActions_1.default.scoreUpdate({
        scores: seedData.scores,
        lastUpdated: seedData.tourney.lastUpdated
    });
    SettingsActions_1.default.setAppState(seedData.appState);
    AppActions_1.default.setTourneyName(seedData.tourneyName);
    if (seedData.user) {
        UserActions_1.default.hydrateCurrentUser(seedData.user._id);
    }
}
exports.default = _.once(() => {
    hydrate(window.golfDraftSeed);
});
