import { load } from 'cheerio';
import * as puppeteer from 'puppeteer';
import constants from '../common/constants';
import { Reader, ReaderResult, Score, Thru, TourneyConfigSpec, UpdateGolfer } from './Types';

function requireParseInt(intStr: string, errMsg: string): number {
  const n = parseInt(intStr, 10);
  if (isNaN(n)) {
    throw new Error(`Failed to parse int: '${intStr}' - ${errMsg}`);
  }
  return n;
}

class PgaTourScraperReader implements Reader {
  async run(config: TourneyConfigSpec, url: string): Promise<ReaderResult> {
    const html = await getLeaderboardHTML(url)
    return parse(html, config.par)
  }
}

async function getLeaderboardHTML(leaderboardHTMLUrl: string): Promise<string> {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto(leaderboardHTMLUrl)
  const contents = await page.content()
  await browser.close()
  return contents
}

export function parse(html: string | Buffer, par: number): ReaderResult {
  const $ = load(html)
  const golfers: UpdateGolfer[] = $('table.leaderboard tbody tr.line-row').map((_i, tr) => {
    const name = $(tr).find('td.player-name .player-name-col').text().trim()
    const rawThru = $(tr).find('td.thru').text().replace('*', '').trim()
    const rawRounds: string[] = $(tr).find('td.round-x').map((_i, td) => $(td).text().trim()).get()

    const positionStr = $(tr).find('td.position').text().trim()
    const isWD = positionStr === 'WD'
    const isCut = positionStr === 'CUT'

    let scores: Score[] = rawRounds.map(safeParseInt).map(n => n !== null ? n - par : null)
    let thru = parseThru(rawThru)
    const day = calcCurrentDay(scores, rawThru === 'F')

    if (rawThru !== 'F') {
      if (!isWD) {
        const currentRoundScore = parseRoundScore($(tr).find('td.round').text().trim())
        scores[day] = currentRoundScore
      } else {
        scores[day] = constants.MISSED_CUT
      }
    }

    if (isWD) {
      scores = scores.map(s => s === null ? constants.MISSED_CUT : s)
      thru = null
    }

    if (isCut) {
      scores[3] = constants.MISSED_CUT;
      scores[2] = constants.MISSED_CUT
    }

    const g: UpdateGolfer = { golfer: name, scores: scores.map(s => s || 0), day: day + 1, thru }
    return g
  }).get()
  return { par, golfers }
}

export function calcCurrentDay(rounds: Score[], isFinished: boolean): number {
  let d = isFinished ? -1 : 0
  for (let i = 0; i < rounds.length && rounds[i] !== null; i++) {
    d++
  }
  return d
}

function safeParseInt(str: string): number | null {
  return isNullStr(str) ? null : requireParseInt(str, 'failed to safe-parse int');
}

function isNullStr(str: string): boolean {
  return str === null || str.startsWith('--') || str === 'null' || str.trim().length === 0;
}

function parseThru(thruStr: string): Thru {
  thruStr = thruStr.replace('*', '').trim()
  if (isNullStr(thruStr)) {
    return null;
  }
  return thruStr === 'F' ? constants.NHOLES : requireParseInt(thruStr, 'failed to parse thruStr')
}

function parseRoundScore(str: string): number {
  if (isNullStr(str)) return 0;
  if (str === 'E') return 0;
  if (str.startsWith('+')) return requireParseInt(str.substr(1), 'failed to parse positive round score');
  if (str.startsWith('-')) return requireParseInt(str, 'failed to parse negative round score');
  throw new Error(`Unexpected round score: ${str}`);
}

export default new PgaTourScraperReader();
