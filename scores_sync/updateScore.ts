import * as updateTourneyStandings from './updateTourneyStandings';
import * as request from 'request';
import {chain, keyBy, isNull, has, includes, every, isFinite, range} from 'lodash';
import {Access} from '../server/access';
import constants from '../common/constants';
import {Reader, ReaderResult} from './Types';
import {
  Golfer,
  GolferScore,
  ScoreOverride,
  TourneyConfigSpec
} from '../server/ServerTypes';

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
  const overridesByGolfer: {[key: string]: {}} = chain(scoreOverrides)
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

function fetchData(url: string): Promise<any> {
  return new Promise((fulfill, reject) => {
    request({ url }, (error, _response, body) => {
      if (error) {
        reject(error);
        return;
      }
      fulfill(body);
    });
  });
}

export async function run(access: Access, reader: Reader, config: TourneyConfigSpec, populateGolfers = false) {
  const url = config.scoresSync.url;

  const jsonStr = await fetchData(url);
  const rawTourney = await reader.run(config, jsonStr);

  // Quick assertion of data
  if (!rawTourney || !validate(rawTourney)) {
    console.error("Invalid data for updateScore", rawTourney);
    throw new Error("Invalid data for updateScore");
  }

  // Update all names
  const nameMap = config.scoresSync.nameMap;
  rawTourney.golfers.forEach(g => g.golfer = nameMap[g.golfer] || g.golfer);

  // Ensure tourney/par
  const update = { pgatourUrl: url, par: rawTourney.par };
  await access.updateTourney(update);
  
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

  // Calculate standings
  await updateTourneyStandings.run(access);

  console.log("HOORAY! - scores updated");
}
