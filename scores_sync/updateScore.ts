import { chain, every, has, includes, isFinite, isNull, keyBy, range } from 'lodash';
import * as moment from 'moment';
import constants from '../common/constants';
import { Access } from '../server/access';
import { Golfer, GolferScore, ScoreOverride, TourneyConfigSpec } from '../server/ServerTypes';
import { Reader, ReaderResult } from './Types';
import * as updateTourneyStandings from './updateTourneyStandings';
import { safeWriteGzippedTmpFile } from './util';

const DAYS = constants.NDAYS;
const MISSED_CUT = constants.MISSED_CUT;
const OVERRIDE_KEYS = ['golfer', 'day', 'scores'];

export function validate(result: ReaderResult): boolean {
  if (has(result, 'par') && !includes([70, 71, 72], result.par)) {
    console.log("ERROR - Par invalid:" + result.par);
    return false;
  }

  return every(result.golfers, g => {
    const validScores = every(g.scores, s => isFinite(s) || s === MISSED_CUT);
    let inv = false;

    if (g.golfer === "-") {
      console.log("ERROR - Invalid golfer name");
      inv = true;
    } else if (g.scores.length !== DAYS) {
      console.log("ERROR - Invalid golfer scores length");
      inv = true;
    } else if (!validScores) {
      console.log("ERROR - Invalid golfer scores");
      inv = true;
    } else if (!includes(range(DAYS + 1), g.day)) {
      console.log("ERROR - Invalid golfer day");
      inv = true;
    }

    if (inv) {
      console.log(JSON.stringify(g));
    }
    return !inv;
  });
}

export function mergeOverrides(scores: GolferScore[], scoreOverrides: ScoreOverride[]): GolferScore[] {
  const overridesByGolfer: { [key: string]: {} } = chain(scoreOverrides)
    .map(o => {
      return chain(o)

        // Remove all empty values from scoreOverrides
        .omitBy(isNull)

        // Whitelist the values we can take
        .pick(OVERRIDE_KEYS)
        .value();
    })
    .keyBy(o => o.golfer.toString())
    .value();

  const newScores = scores.map(s => {
    const override = overridesByGolfer[s.golfer.toString()];
    if (override) {
      s = { ...s, ...override } as GolferScore;
    }
    s.golfer = s.golfer.toString();
    return s;
  });

  return newScores;
}

export async function run(access: Access, reader: Reader, config: TourneyConfigSpec, populateGolfers = false) {
  const url = config.scoresSync.url;
  const ts = moment().format('YMMDD_HHmmss');

  const rawTourney = await reader.run(config, url);

  // Quick assertion of data
  if (!rawTourney || !validate(rawTourney)) {
    console.error("Invalid data for updateScore", rawTourney);
    throw new Error("Invalid data for updateScore");
  }

  // Update all names
  const nameMap = config.scoresSync.nameMap;
  rawTourney.golfers.forEach(g => g.golfer = nameMap[g.golfer] || g.golfer);

  // Ensure golfers
  if (populateGolfers) {
    const golfers = rawTourney.golfers.map(g => ({ name: g.golfer } as Golfer));
    await access.ensureGolfers(golfers);
  }

  const results = await Promise.all([
    access.getGolfers(),
    access.getScoreOverrides()
  ]);
  const gs = results[0] as Golfer[];
  const scoreOverrides = results[1] as ScoreOverride[];

  // Build scores with golfer id
  const golfersByName = keyBy(gs, gs => gs.name);
  const scores = rawTourney.golfers.map(g => {
    const golferName = g.golfer;
    if (!golfersByName[golferName]) {
      throw new Error("ERROR: Could not find golfer: " + golferName);
    }

    const golfer = golfersByName[golferName]._id;
    return {
      golfer: golfer,
      day: g.day,
      thru: g.thru,
      scores: g.scores
    } as GolferScore;
  });

  // Merge in overrides
  const finalScores = mergeOverrides(scores, scoreOverrides);
  if (!finalScores.length) {
    throw new Error("wtf. no scores.");
  }

  // Save
  await access.updateScores(finalScores);
  safeWriteGzippedTmpFile(`${ts}-scores`, JSON.stringify(finalScores));

  // Calculate standings
  const tourneyStanding = await updateTourneyStandings.run(access);
  safeWriteGzippedTmpFile(`${ts}-standings`, JSON.stringify(tourneyStanding));

  // Mark as updated
  await access.touchLastUpdated();

  console.log("HOORAY! - scores updated");
}
