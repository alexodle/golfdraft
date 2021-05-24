import { chain, groupBy, isNumber, keyBy, mapValues, maxBy, sumBy, times } from 'lodash';
import constants from '../common/constants';
import { Access } from '../server/access';
import { GolferScore, PlayerScore, TourneyStandings } from '../server/ServerTypes';

function buildPlayerScore(
  player: string,
  rawScores: GolferScore[],
  worstScoresForDay: { day: number, golfer: string, score: number }[]
): PlayerScore {
  const dayScores = times(constants.NDAYS, day => {

    const golferScores = rawScores.map((golferScores, idx) => {
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

    const usedScores = chain(golferScores)
      .sortBy(ds => ds.score)
      .take(constants.NSCORES_PER_DAY)
      .map(ds => (<any>ds).idx)
      .value();
    const golferScoresFinal = golferScores.map(gs => {
      const scoreUsed = usedScores.indexOf(gs.idx) >= 0;
      return {
        golfer: gs.golfer,
        score: gs.score,
        missedCut: gs.missedCut,
        thru: gs.thru,
        scoreUsed,
      };
    });

    const totalDayScore = sumBy(golferScoresFinal, ds => ds.scoreUsed ? ds.score : 0);
    return {
      totalScore: totalDayScore,
      day,
      golferScores: golferScoresFinal
    };
  });

  const totalScore = sumBy(dayScores, sbd => sbd.totalScore);

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
  sortedScores.forEach((ps, i) => {
    if (i === 0 || ps.totalScore !== sortedScores[i - 1].totalScore) {
      currentStanding++;
    }
    ps.isTied = isTied(sortedScores, i);
    ps.standing = currentStanding;
  });
}

function estimateCurrentDay(scores: GolferScore[]) {
  const nonMissedCutScore = scores.find(gs => !gs.scores.some(s => s === constants.MISSED_CUT))
  return nonMissedCutScore.day;
}

export async function run(access: Access): Promise<TourneyStandings> {
  const [scores, draft] = await Promise.all([
    access.getScores(),
    access.getDraft()
  ]);
  console.log("Running player score update");

  // Summary info
  const worstScoresForDay = times(constants.NDAYS, day => {
    const maxGolferScore = maxBy(scores, s => isNumber(s.scores[day]) ?
      s.scores[day] :
      Number.MIN_VALUE);
    const maxScore: number = isNumber(maxGolferScore.scores[day]) ?
      maxGolferScore.scores[day] :
      0;
    return {
      day,
      golfer: maxGolferScore.golfer,
      score: maxScore
    };
  });

  const picksByUser = groupBy(draft.picks, p => p.user.toString());
  const scoresByPlayer = keyBy(scores, s => s.golfer.toString());
  const playerRawScores = mapValues(picksByUser, picks =>
    picks.map(p => scoresByPlayer[p.golfer.toString()]));

  const playerScores = chain(playerRawScores)
    .map((rawScores, pid) => buildPlayerScore(pid, rawScores, worstScoresForDay))
    .sortBy(ps => ps.totalScore)
    .value();

  fillInStandings(playerScores);

  let currentDay = estimateCurrentDay(scores);
  const tourneyStandings: TourneyStandings = { currentDay, worstScoresForDay, playerScores };

  await access.updateTourneyStandings(tourneyStandings);
  console.log("DONE Running player score update");

  return tourneyStandings;
}
