export default {
  NHOLES: 18,

  // Tournaments are 4 days
  NDAYS: 4,

  // Each user can draft 4 golfers
  NGOLFERS: 4,

  // We take the top 2 golfer scores for each day
  NSCORES_PER_DAY: 2,

  MISSED_CUT: 'MC' as 'MC',

  // Either too high, or non-existent
  UNKNOWN_WGR: Number.MAX_VALUE,

  // If a player is set to auto pick and has no pick list golfer available,
  // we auto-pick the next nth best WGR player
  ABSENT_PICK_NTH_BEST_WGR: 7,

  TOURNEY_ID_PARAM: ':tourneyId([0-9a-f]{24})'
};
