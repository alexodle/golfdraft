import {once} from 'lodash';
import AppActions from './actions/AppActions';
import DraftActions from './actions/DraftActions';
import parseDraft from './logic/DraftParser';
import ScoreActions from './actions/ScoreActions';
import SettingsActions from './actions/SettingsActions';
import UserActions from './actions/UserActions';
import {BootstrapPayload} from './types/ClientTypes';

/** Hydrates the app with data stamped on initial page load
*/
function hydrate(seedData: BootstrapPayload) {
  const draft = parseDraft(seedData.draft);

  AppActions.setUsers(seedData.users);
  AppActions.setGolfers(seedData.golfers);
  DraftActions.draftUpdate(draft);
  ScoreActions.scoreUpdate({
    tourneyStandings: seedData.tourneyStandings,
    lastUpdated: seedData.tourney.lastUpdated
  });
  SettingsActions.setAppState(seedData.appState);
  AppActions.setActiveTourneyId(seedData.activeTourneyId);
  AppActions.setCurrentTourney(seedData.tourney);
  AppActions.setAllTourneys(seedData.allTourneys);
  UserActions.setPickListUsers(seedData.pickListUsers);

  if (seedData.user) {
    UserActions.hydrateCurrentUser(seedData.user._id);
    DraftActions.setPickList(seedData.userPickList);
  }
}

export default once(() => {
  hydrate((<any>window).golfDraftSeed);
});
