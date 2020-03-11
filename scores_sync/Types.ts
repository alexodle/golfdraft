import { TourneyConfigSpec } from '../server/ServerTypes'

export interface UpdateGolfer {
  scores: (number | string)[];
  golfer: string;
  day: number;
  thru: number;
}

export interface ReaderResult {
  par: number;
  golfers: UpdateGolfer[];
}

export interface Reader {
  run: (config: TourneyConfigSpec, url: string) => Promise<ReaderResult>;
}

export { TourneyConfigSpec }
