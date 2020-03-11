import * as _ from 'lodash';
import constants from '../common/constants';
import { Reader, ReaderResult, UpdateGolfer, TourneyConfigSpec } from './Types';
import { fetchData } from './util';

const MISSED_CUT = constants.MISSED_CUT;
const NDAYS = constants.NDAYS;

const PGATOUR_WD_TEXT = 'wd';
const PGATOUR_MC_TEXT = 'cut';
const CUT_ROUND = 3; // cut starts at round 3

interface Round {
  strokes: number;
  round_number: number;
}

interface PgaTourGolfer {
  status: string;
  today: number;
  total_strokes: number;
  current_round: number;
  thru: number;
  rounds: Round[];
  player_bio: {
    first_name: string;
    last_name: string;
  }
}

function getRoundScore(par: number, currentRound: number, g: PgaTourGolfer, round: Round): number | string {
  const roundNumber = round.round_number;
  const missedCut = g.status === PGATOUR_MC_TEXT;

  if (missedCut && roundNumber >= CUT_ROUND) {
    return MISSED_CUT;
  } else if (roundNumber > currentRound && round.strokes === null) {
    return par;
  } else if (roundNumber === currentRound) {
    return g.today ? g.today + par : par; // par if they haven't started yet
  }

  return round.strokes;
}

function adjustWdScores(g: PgaTourGolfer, scores: (number | string)[]): (number | string)[] {
  // For WD golfers, "total_strokes" is the only property we can trust
  const total = g.total_strokes;

  const newScores = [];
  let strokes = 0;
  for (let i = 0; i < scores.length; i++) {
    strokes += <number>scores[i];
    newScores.push(strokes <= total ? scores[i] : MISSED_CUT);
  }

  return newScores;
}

function adjustForPar(par: number, scores: (number | string)[]): (number | string)[] {
  return _.map(scores, (s) => {
    return s !== MISSED_CUT ? (<number>s) - par : MISSED_CUT;
  });
}

function parseGolfer(par: number, tourneyRound: number, g: PgaTourGolfer): UpdateGolfer {
  const bio = g.player_bio;
  const golferCurrentRound = g.current_round;

  const parsedGolfer = {
    golfer: bio.first_name + ' ' + bio.last_name,
    day: golferCurrentRound || tourneyRound,
    thru: g.thru,
    scores: _.chain(g.rounds)
      .take(NDAYS)
      .map((round) => getRoundScore(par, golferCurrentRound, g, round))
      .value()
  };

  const withdrew = g.status === PGATOUR_WD_TEXT;
  if (withdrew) {
    parsedGolfer.scores = adjustWdScores(g, parsedGolfer.scores);
  }

  parsedGolfer.scores = adjustForPar(par, parsedGolfer.scores);

  return parsedGolfer;
}

class PgaTourReader implements Reader {
  async run(_config: TourneyConfigSpec, url: string): Promise<ReaderResult> {
    const data = await fetchData(url);
    const body = JSON.parse(data);
    const par = _.parseInt(body.leaderboard.courses[0].par_total);
    const currentRound = body.leaderboard.current_round;
    const golfers = _.map(body.leaderboard.players, (g: PgaTourGolfer) => parseGolfer(par, currentRound, g));
    return { par, golfers };
  }

  // Export for testing
  parseGolfer(par: number, tourneyRound: number, g: PgaTourGolfer): UpdateGolfer {
    return parseGolfer(par, tourneyRound, g);
  }
}

export default new PgaTourReader();
