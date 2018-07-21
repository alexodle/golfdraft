import * as access from '../server/access';
import * as _ from 'lodash';
import constants from '../common/constants';
import {GolferScore, PlayerScore, TourneyStandings} from '../server/ServerTypes';

function buildPlayerScore(
  player: string,
  rawScores: GolferScore[],
  worstScoresForDay: { day: number, golfer: string, score: number }[]
): PlayerScore {
  const dayScores = _.times(constants.NDAYS, day => {

    const golferScores = _.map(rawScores, (golferScores, idx) => {
      const missedCut = golferScores.scores[day] === constants.MISSED_CUT;
      const dayScore = missedCut ? worstScoresForDay[day].score : golferScores.scores[day] as number;
      return {
        day,
        idx,
        missedCut,
        thru: day + 1 === golferScores.day ? golferScores.thru : null,
        golfer: golferScores.golfer,
        score: dayScore
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
        thru: gs.thru,
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

    // Filled in later
    standing: -1,
    isTied: false,
  } as PlayerScore;
}

function isTied(sortedScores: PlayerScore[], i: number) {
  const totalScore = sortedScores[i].totalScore;
  return (
    (i > 0 && sortedScores[i - 1].totalScore === totalScore) ||
    (i < sortedScores.length - 1 && sortedScores[sortedScores.length - 1].totalScore === totalScore));
}

function fillInStandings(sortedScores: PlayerScore[]) {
  let currentStanding = -1;
  _.each(sortedScores, (ps, i) => {
    if (i === 0 || ps.totalScore !== sortedScores[i - 1].totalScore) {
      currentStanding = i;
    }
    ps.isTied = isTied(sortedScores, i);
    ps.standing = currentStanding;
  });
}

export function run(): Promise<void> {
  return Promise.all([
      access.getScores(),
      access.getDraft()
    ])
    .then(([scores, draft]) => {
      console.log("Running player score update");

      // Summary info
      const worstScoresForDay = _.times(constants.NDAYS, day => {
        const maxGolferScore = _.maxBy(scores, s => _.isNumber(s.scores[day]) ? 
          s.scores[day] :
          Number.MIN_VALUE);
        const maxScore: number = _.isNumber(maxGolferScore.scores[day]) ?
          maxGolferScore.scores[day] :
          0;
        return {
          day,
          golfer: maxGolferScore.golfer,
          score: maxScore
        };
      });

      const picksByUser = _.groupBy(draft.picks, p => p.user.toString());
      const scoresByPlayer = _.keyBy(scores, s => s.golfer.toString());
      const playerRawScores = _.mapValues(picksByUser, picks => 
        _.map(picks, p => scoresByPlayer[p.golfer.toString()]));

      const playerScores = _.chain(playerRawScores)
        .map((rawScores, pid) => buildPlayerScore(pid, rawScores, worstScoresForDay))
        .sortBy(ps => ps.totalScore)
        .value();

      // Fill in standings
      fillInStandings(playerScores);

      // Estimate current day
      let currentDay = 0;
      for (let i = 1; i < worstScoresForDay.length && worstScoresForDay[i].score !== 0; i++) {
        currentDay++;
      }

      const tourneyStandings: TourneyStandings = { currentDay, worstScoresForDay, playerScores };

      return access.updateTourneyStandings(tourneyStandings);
    })
    .then(() => console.log("DONE Running player score update"))
    .catch(e => {
      console.error("FAILED: Running player score update");
      console.error(e);
      throw e;
    });
}