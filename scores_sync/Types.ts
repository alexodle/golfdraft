import { TourneyConfigSpec } from '../server/ServerTypes'

export type Thru = number | null
export type Score = number | 'MC'

export interface UpdateGolfer {
  scores: Score[];
  golfer: string;
  day: number;
  thru: Thru;
}

export interface ReaderResult {
  par: number;
  golfers: UpdateGolfer[];
}

export interface Reader {
  run: (config: TourneyConfigSpec, url: string) => Promise<ReaderResult>;
}

export { TourneyConfigSpec }
