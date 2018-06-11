import * as access from '../server/access';
import * as _ from 'lodash';
import constants from '../common/constants';
import {GolferScore, PlayerScore} from '../server/ServerTypes';

function buildPlayerScore(player: string, rawScores: GolferScore[], worstScoresPerDay: number[]): PlayerScore {
  const dayScores = _.times(constants.NDAYS, day => {

    const golferScores = _.map(rawScores, (golferScores, idx) => {
      const missedCut = golferScores.scores[day] === constants.MISSED_CUT;
      const dayScore = missedCut ? worstScoresPerDay[day] : golferScores.scores[day];
      return {
        day,
        idx,
        missedCut,
        golfer: golferScores.golfer,
        score: dayScore as number
      }
    });

    const usedScores = _.chain(golferScores)
      .sortBy(ds => ds.score)
      .take(constants.NSCORES_PER_DAY)
      .map(ds => (<any>ds).idx)
      .value();
    const golferScoresFinal = _.map(golferScores, gs => {
      const scoreUsed = usedScores.indexOf(gs.idx) >= 0;
      return {
        golfer: gs.golfer,
        score: gs.score,
        missedCut: gs.missedCut,
        scoreUsed,
      };
    });

    const totalDayScore = _.sumBy(golferScoresFinal, ds => ds.scoreUsed ? ds.score : 0);
    return {
      totalScore: totalDayScore,
      day,
      golferScores: golferScoresFinal
    };
  });

  const totalScore = _.sumBy(dayScores, sbd => sbd.totalScore);

  return {
    dayScores,
    player,
    totalScore,
  } as PlayerScore;
}

export function run(): Promise<void> {
  return Promise.all([
      access.getScores(),
      access.getDraft()
    ]).then(([scores, draft]) => {
      console.log("Running player score update");

      // Summary info
      const worstScoresPerDay = _.times(constants.NDAYS, day => 
        _.maxBy(scores, s => _.isNumber(s.scores[day]) ? s.scores[day] : Number.MIN_VALUE).scores[day] as number);

      const picksByUser = _.groupBy(draft.picks, p => p.user.toString());
      const scoresByPlayer = _.keyBy(scores, s => s.golfer.toString());
      const playerRawScores = _.mapValues(picksByUser, picks => 
        _.map(picks, p => scoresByPlayer[p.golfer.toString()]));

      const playerScores = _.map(playerRawScores, (rawScores, pid) => 
        buildPlayerScore(pid, rawScores, worstScoresPerDay));

      console.log(JSON.stringify(playerScores, null, 2));
      return access.updatePlayerScores(playerScores).then(() => {
        console.log("DONE Running player score update");
      })
    })
    .catch(e => {
      console.error("FAILED: Running player score update");
      console.error(e);
      throw e;
    });
}