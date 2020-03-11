import { Reader, ReaderResult, TourneyConfigSpec } from './Types';
import pgaTourLbDataReader from './pgaTourLbDataReader'
import * as puppeteer from 'puppeteer';

class PgaTourLbDataScraperReader implements Reader {
  async run(config: TourneyConfigSpec, url: string): Promise<ReaderResult> {
    const jsonURL = await getLeaderboardJSONURL(url)
    return await pgaTourLbDataReader.run(config, jsonURL)
  }
}

async function getLeaderboardJSONURL(leaderboardHTMLUrl: string): Promise<string> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setRequestInterception(true);

  let leaderboardURL: string = null
  page.on('request', interceptedRequest => {
    const iurl = interceptedRequest.url()
    if (iurl.includes('leaderboard.json')) {
      leaderboardURL = iurl

      interceptedRequest.abort()
      page.close()
      return
    }

    interceptedRequest.continue()
  });
  try {
    await page.goto(leaderboardHTMLUrl);
  } catch (e) { }
  try {
    await browser.close();
  } catch (e) { }

  if (leaderboardURL === null) {
    throw new Error('Could not find leaderboard json URL')
  }
  return leaderboardURL
}

export default new PgaTourLbDataScraperReader();
