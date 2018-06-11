import * as _ from 'lodash';
import * as access from '../server/access';
import config from '../server/config';
import constants from '../common/constants';
import {Reader, ReaderResult, UpdateGolfer} from './Types';
import {
  Golfer,
  GolferScore,
  ScoreOverride,
} from '../server/ServerTypes';

const DAYS = constants.NDAYS;
const MISSED_CUT = constants.MISSED_CUT;
const OVERRIDE_KEYS = ['golfer', 'day', 'scores'];

export function validate(result: ReaderResult): boolean {
  if (_.has(result, 'par') && !_.includes([70, 71, 72, 73], result.par)) {
    console.log("ERROR - Par invalid:" + result.par);
    return false;
  }

  return _.every(result.golfers, (g) => {
    const validScores = _.every(g.scores, (s) => {
      return _.isFinite(s) || s === MISSED_CUT;
    });
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
    } else if (!_.includes(_.range(DAYS + 1), g.day)) {
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
  const overridesByGolfer = _.chain(scoreOverrides)
    .map((o) => {
      return _.chain(o)

        // Remove all empty values from scoreOverrides
        .omitBy(_.isNull)

        // Whitelist the values we can take
        .pick(OVERRIDE_KEYS)
        .value();
    })
    .keyBy((o) => o.golfer.toString())
    .value();

  const newScores = _.map(scores, (s) => {
    const override = overridesByGolfer[s.golfer.toString()];
    if (override) {
      s = _.extend({}, s, override);
    }
    s.golfer = s.golfer.toString();
    return s;
  });

  return newScores;
}

export function run(reader: Reader, url: string, nameMap: { [name: string]: string }, populateGolfers = false): Promise<void> {
  return reader.run(url).then(rawTourney => {
    // Quick assertion of data
    if (!rawTourney || !validate(rawTourney)) {
      console.error("Invalid data for updateScore", rawTourney);
      throw new Error("Invalid data for updateScore");
    }

    // Ensure tourney/par
    const update = { pgatourUrl: url, par: rawTourney.par };
    const mainPromise = access.updateTourney(update)

      .then(() => {
        // Ensure golfers
        if (populateGolfers) {
          const golfers = _.map(rawTourney.golfers, (g) => {
            return { name: g.golfer } as Golfer;
          });
          return access.ensureGolfers(golfers);
        }
      })

      .then(() => {
        return Promise.all([
          access.getGolfers(),
          access.getScoreOverrides()
        ]);
      })

      .then(results => {
        const gs = results[0] as Golfer[];
        const scoreOverrides = results[1] as ScoreOverride[];

        // Build scores with golfer id
        const golfersByName = _.keyBy(gs, "name");
        const scores = _.map(rawTourney.golfers, (g) => {
          const golferName = nameMap[g.golfer] || g.golfer;
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
        console.log("scores BEFORE overrides: " + JSON.stringify(scores));
        const finalScores = mergeOverrides(scores, scoreOverrides);
        console.log("");
        console.log("scores AFTER overrides: " + JSON.stringify(scores));
        console.log("");
        if (!finalScores.length) {
          throw new Error("wtf. no scores.");
        }

        // Save
        return access.updateScores(finalScores);
      })

      .then(() => {
        console.log("HOORAY! - scores updated");
      })

      .catch(e => {
        console.error(e);
        throw e;
      });

    return mainPromise;
  });
}
