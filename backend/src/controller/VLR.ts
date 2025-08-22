import axios from "axios";
import { Request, Response } from "express";
import { selectRandomUserAgent } from "../util/common";
const cheerio = require("cheerio");
const parseScheduledMatches = async (apiResponse: any) => {
  const $ = cheerio.load(apiResponse);
  const scheduledMatches: any[] = [];

  $("div.wf-label.mod-large").each((_: any, labelEl: any) => {
    const dateText = $(labelEl)
      .clone()
      .children("span")
      .remove()
      .end()
      .text()
      .trim();

    const matchesForDate: any[] = [];

    const cardEl = $(labelEl).next("div.wf-card");

    cardEl.find("a.wf-module-item.match-item").each((_: any, matchEl: any) => {
      const match: {
        matchUrl: string | null;
        time?: string;
        team1?: string | null;
        team2?: string | null;
        status?: string | null;
        eta?: string | null;
        stats?: string | null;
        vods?: string | null;
        event?: string;
      } = { matchUrl: null };

      match.matchUrl =
        "https://www.vlr.gg" + $(matchEl).attr("href")?.trim() || null;

      match.time = $(matchEl).find("div.match-item-time").text().trim();

      const teams: string[] = $(matchEl)
        .find("div.match-item-vs-team-name > div.text-of")
        .map((i: number, el: cheerio.Element) => $(el).text().trim())
        .get();
      match.team1 = teams[0] || null;
      match.team2 = teams[1] || null;

      match.status =
        $(matchEl).find("div.match-item-eta div.ml-status").text().trim() ||
        null;
      match.eta =
        $(matchEl).find("div.match-item-eta div.ml-eta").text().trim() || null;

      const vodsStats: { [key: string]: string } = {};
      $(matchEl)
        .find("div.match-item-vod")
        .each((_: number, vodEl: cheerio.Element) => {
          const label: string = $(vodEl)
            .find("div.wf-module-label")
            .text()
            .trim()
            .replace(":", "");
          const value: string = $(vodEl)
            .clone()
            .children("div.wf-module-label")
            .remove()
            .end()
            .text()
            .trim();
          vodsStats[label] = value;
        });
      match.stats = vodsStats["Stats"] || null;
      match.vods = vodsStats["VODs"] || null;

      (match.event = $(matchEl)
        .find("div.match-item-event")
        .clone()
        .children()
        .remove()
        .end()
        .text()
        .trim()),
        // const eventText = $(matchEl)
        //   .find("div.match-item-event")
        //   .text()
        //   .replace(/&ndash;/g, "–")
        //   .replace(/\s+/g, " ")
        //   .trim();

        // const eventParts = [
        //   ...new Set(eventText.split(" ").filter(Boolean)),
        // ].join(" ");

        // match.event = eventText;

        matchesForDate.push(match);
    });

    if (matchesForDate.length > 0) {
      scheduledMatches.push({
        date: dateText,
        matches: matchesForDate,
      });
    }
  });

  return scheduledMatches;
};

export const retrieveScheduledMatches = async (req: Request, res: Response) => {
  const apiUrl = `https://www.vlr.gg/matches`;
  const retrievedUserAgent = selectRandomUserAgent();
  try {
    const response = await axios.get(apiUrl, {
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "max-age=0",
        priority: "u=0, i",
        referer: "https://www.vlr.gg/matches/?page=3",
        "sec-ch-ua": retrievedUserAgent.secChUa,
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": retrievedUserAgent.platform,
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "sec-gpc": "1",
        "upgrade-insecure-requests": "1",
        "user-agent": retrievedUserAgent.userAgent,
      },
    });
    const html = response.data;
    const result = await parseScheduledMatches(html);
    res.json(result);
  } catch (error) {
    console.error("Error fetching scheduled matches:", error);
    res.status(500).json({ error: "Failed to retrieve scheduled matches" });
  }
};

const extractMatchStatistics = async (htmlResponse: any) => {
  const $ = cheerio.load(htmlResponse);

  const matchStats: {
    matchUrl: string | null;
    eventName: string | null;
    matchTime: string | null;
    team1: {
      name: string | null;
      score: number | string | null;
      overallScore: number | null;
      players: any[];
      isWon: boolean;
    };
    team2: {
      name: string | null;
      score: number | string | null;
      overallScore: number | null;
      players: any[];
      isWon: boolean;
    };
  } = {
    matchUrl: "",
    eventName: null,
    matchTime: null,
    team1: {
      name: null,
      score: null,
      overallScore: null,
      isWon: false,
      players: [],
    },
    team2: {
      name: null,
      score: null,
      overallScore: null,
      isWon: false,
      players: [],
    },
  };

  try {
    matchStats.matchUrl = $("link[rel='canonical']").attr("href");
    const item = $("div#wrapper");
    if (item.length > 0) {
      matchStats.eventName = $(item)
        .find("a.match-header-event  div div")
        .eq(0)
        .text()
        .trim();
    }
    const team1Score = parseInt(
      $(item).find("div.match-header-vs-score div span").eq(0).text().trim()
    );
    const team2Score = parseInt(
      $(item).find("div.match-header-vs-score div span").eq(2).text().trim()
    );

    if (team1Score > team2Score) {
      matchStats.team1.isWon = true;
      matchStats.team2.isWon = false;
    } else if (team1Score < team2Score) {
      matchStats.team1.isWon = false;
      matchStats.team2.isWon = true;
    }

    matchStats.team1.overallScore = team1Score;
    matchStats.team2.overallScore = team2Score;

    const timeElement = $(
      "div#wrapper div.col-container div.col.mod-3 div.wf-card.match-header div.match-header-super div:nth-child(2) div.match-header-date div.moment-tz-convert:first-child"
    );
    if (timeElement.length > 0) {
      matchStats.matchTime = timeElement.attr("data-utc-ts") || null;
    }

    const team1NameElement = $(
      "div#wrapper div.col-container div.col.mod-3 div.wf-card.match-header div.match-header-vs a.match-header-link.wf-link-hover.mod-1 div.match-header-link-name.mod-1 div.wf-title-med"
    );
    if (team1NameElement.length > 0) {
      matchStats.team1.name = team1NameElement.text().trim();
    }

    const team1ScoreElement = $(
      "div#wrapper div.col-container div.col.mod-3 div.wf-card.match-header div.match-header-vs a.match-header-link.wf-link-hover.mod-1 div.match-header-link-name.mod-1 div.match-header-link-name-elo"
    );
    if (team1ScoreElement.length > 0) {
      const scoreText = team1ScoreElement.text().trim();

      const scoreMatch = scoreText.match(/\d+/);
      matchStats.team1.score = scoreMatch ? parseInt(scoreMatch[0]) : scoreText;
    }

    const team2NameElement = $(
      "div#wrapper div.col-container div.col.mod-3 div.wf-card.match-header div.match-header-vs a.match-header-link.wf-link-hover.mod-2 div.match-header-link-name.mod-2 div.wf-title-med.mod-single"
    );
    if (team2NameElement.length > 0) {
      matchStats.team2.name = team2NameElement.text().trim();
    }

    const team2ScoreElement = $(
      "div#wrapper div.col-container div.col.mod-3 div.wf-card.match-header div.match-header-vs a.match-header-link.wf-link-hover.mod-2 div.match-header-link-name.mod-2 div.match-header-link-name-elo"
    );
    if (team2ScoreElement.length > 0) {
      const scoreText = team2ScoreElement.text().trim();
      const scoreMatch = scoreText.match(/\d+/);
      matchStats.team2.score = scoreMatch ? parseInt(scoreMatch[0]) : scoreText;
    }

    try {
      const item = $("div#wrapper");

      $(item)
        .find(
          "#wrapper > div.col-container > div.col.mod-3 > div:nth-child(6) > div > div.vm-stats-container > div.vm-stats-game.mod-active > div:nth-child(2) > div:nth-child(1) > table > tbody > tr"
        )
        .each((index: any, element: any) => {
          const tds = $(element).find("td ");
          matchStats.team1.players.push({
            player_name: $(tds[0]).find("div.text-of").eq(0).text().trim(),
            player_link: `www.vlr.gg` + $(tds[0]).find("a").attr("href"),
            team_code: $(tds[0]).find("div.ge-text-light").text().trim(),
            rating: $(tds[2]).find("span span").eq(0).text().trim(),
            average_combat_score: $(tds[3])
              .find("span span")
              .eq(0)
              .text()
              .trim(),
            kills: $(tds[4]).find("span span").eq(0).text().trim(),
            deaths: $(tds[5]).find("span span.mod-both").eq(0).text().trim(),
            assists: $(tds[6]).find("span span").eq(0).text().trim(),
            kills_deaths: $(tds[7]).find("span span").eq(0).text().trim(),
            kill_assist_trade_survive_percentage: $(tds[8])
              .find("span span")
              .eq(0)
              .text()
              .trim(),
            average_damage_per_round: $(tds[9])
              .find("span span")
              .eq(0)
              .text()
              .trim(),
            headshot_percentage: $(tds[10])
              .find("span span")
              .eq(0)
              .text()
              .trim(),
            first_kills: $(tds[11]).find("span span").eq(0).text().trim(),
            first_deaths: $(tds[12]).find("span span").eq(0).text().trim(),
            first_kills_first_deaths: $(tds[13])
              .find("span span")
              .eq(0)
              .text()
              .trim(),
          });
        });
      $(item)
        .find(
          "#wrapper > div.col-container > div.col.mod-3 > div:nth-child(6) > div > div.vm-stats-container > div.vm-stats-game.mod-active > div:nth-child(2) > div:nth-child(2) > table > tbody > tr"
        )
        .each((index: any, element: any) => {
          const tds = $(element).find("td ");
          matchStats.team2.players.push({
            player_name: $(tds[0]).find("div.text-of").eq(0).text().trim(),
            player_link: `www.vlr.gg` + $(tds[0]).find("a").attr("href"),
            team_code: $(tds[0]).find("div.ge-text-light").text().trim(),
            rating: $(tds[2]).find("span span").eq(0).text().trim(),
            average_combat_score: $(tds[3])
              .find("span span")
              .eq(0)
              .text()
              .trim(),
            kills: $(tds[4]).find("span span").eq(0).text().trim(),
            deaths: $(tds[5]).find("span span.mod-both").eq(0).text().trim(),
            assists: $(tds[6]).find("span span").eq(0).text().trim(),
            kills_deaths: $(tds[7]).find("span span").eq(0).text().trim(),
            kill_assist_trade_survive_percentage: $(tds[8])
              .find("span span")
              .eq(0)
              .text()
              .trim(),
            average_damage_per_round: $(tds[9])
              .find("span span")
              .eq(0)
              .text()
              .trim(),
            headshot_percentage: $(tds[10])
              .find("span span")
              .eq(0)
              .text()
              .trim(),
            first_kills: $(tds[11]).find("span span").eq(0).text().trim(),
            first_deaths: $(tds[12]).find("span span").eq(0).text().trim(),
            first_kills_first_deaths: $(tds[13])
              .find("span span")
              .eq(0)
              .text()
              .trim(),
          });
        });
    } catch (error) {
      console.error("Error extracting match statistics:", error);
    }
  } catch (error) {
    console.error("Error extracting match statistics:", error);
    return {
      error: "Failed to extract match statistics",
      details: error,
      ...matchStats,
    };
  }

  return matchStats;
};

export const retrieveMatchStatistics = async (matchUrl: string) => {
  const retrievedUserAgent = selectRandomUserAgent();
  const response = await axios.get(matchUrl, {
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.7",
      "cache-control": "max-age=0",
      priority: "u=0, i",
      referer: "https://www.vlr.gg/matches/results",
      "sec-ch-ua": retrievedUserAgent.secChUa,
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": retrievedUserAgent.platform,
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "sec-gpc": "1",
      "upgrade-insecure-requests": "1",
      "user-agent": retrievedUserAgent.userAgent,
    },
  });
  try {
    const matchStats = await extractMatchStatistics(response.data);
    return matchStats;
  } catch (error) {
    console.error("Error retrieving match statistics:", error);
    return { error: "Failed to retrieve match statistics" };
  }
};

const parseExtendedScheduledMatches = async (apiResponse: any) => {
  const $ = cheerio.load(apiResponse);
  const scheduledMatches: any[] = [];

  $("div.wf-label.mod-large").each((_: any, labelEl: any) => {
    const dateText = $(labelEl)
      .clone()
      .children("span")
      .remove()
      .end()
      .text()
      .trim();

    const matchesForDate: any[] = [];

    const cardEl = $(labelEl).next("div.wf-card");

    cardEl.find("a.wf-module-item.match-item").each((_: any, matchEl: any) => {
      const match: {
        matchUrl: string | null;
        time?: string;
        team1?: string | null;
        team2?: string | null;
        status?: string | null;
        eta?: string | null;
        stats?: string | null;
        vods?: string | null;
        event?: string;
      } = { matchUrl: null };

      match.matchUrl =
        "https://www.vlr.gg" + $(matchEl).attr("href")?.trim() || null;

      match.time = $(matchEl).find("div.match-item-time").text().trim();

      const teams: string[] = $(matchEl)
        .find("div.match-item-vs-team-name > div.text-of")
        .map((i: number, el: cheerio.Element) => $(el).text().trim())
        .get();
      match.team1 = teams[0] || null;
      match.team2 = teams[1] || null;

      match.status =
        $(matchEl).find("div.match-item-eta div.ml-status").text().trim() ||
        null;
      match.eta =
        $(matchEl).find("div.match-item-eta div.ml-eta").text().trim() || null;

      const vodsStats: { [key: string]: string } = {};
      $(matchEl)
        .find("div.match-item-vod")
        .each((_: number, vodEl: cheerio.Element) => {
          const label: string = $(vodEl)
            .find("div.wf-module-label")
            .text()
            .trim()
            .replace(":", "");
          const value: string = $(vodEl)
            .clone()
            .children("div.wf-module-label")
            .remove()
            .end()
            .text()
            .trim();
          vodsStats[label] = value;
        });
      match.stats = vodsStats["Stats"] || null;
      match.vods = vodsStats["VODs"] || null;

      // const eventText = $(matchEl)
      //   .find("div.match-item-event")
      //   .text()
      //   .replace(/&ndash;/g, "–")
      //   .replace(/\s+/g, " ")
      //   .trim();

      // const eventParts = [
      //   ...new Set(eventText.split(" ").filter(Boolean)),
      // ].join(" ");

      // match.event = eventParts;

      (match.event = $(matchEl)
        .find("div.match-item-event")
        .clone()
        .children()
        .remove()
        .end()
        .text()
        .trim()),
        matchesForDate.push(match);
    });

    if (matchesForDate.length > 0) {
      scheduledMatches.push({
        date: dateText,
        matches: matchesForDate,
      });
    }
  });

  return scheduledMatches;
};

const parsePaginationInfo = (apiResponse: any) => {
  const $ = cheerio.load(apiResponse);
  const paginationContainer = $("div.action-container-pages");

  if (!paginationContainer.length) {
    return { currentPage: 1, nextPageUrl: null, hasMorePages: false };
  }

  // Get current active page
  const activePage =
    parseInt(
      paginationContainer.find("span.btn.mod-page.mod-active").text().trim()
    ) || 1;

  // Get all page links
  const pageLinks: { page: number; url: string }[] = [];
  paginationContainer.find("a.btn.mod-page").each((_: any, linkEl: any) => {
    const pageNumber = parseInt($(linkEl).text().trim());
    const href = $(linkEl).attr("href");
    if (pageNumber && href) {
      pageLinks.push({ page: pageNumber, url: "https://www.vlr.gg" + href });
    }
  });

  // Find next page (any page number greater than current active page)
  const nextPages = pageLinks.filter((link) => link.page > activePage);
  const nextPage = nextPages.length > 0 ? nextPages[0] : null;

  return {
    currentPage: activePage,
    nextPageUrl: nextPage ? nextPage.url : null,
    hasMorePages: nextPage !== null,
    allPageLinks: pageLinks,
  };
};

const fetchPageData = async (url: string) => {
  const retrievedUserAgent = selectRandomUserAgent();
  const response = await axios.get(url, {
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "max-age=0",
      priority: "u=0, i",
      referer: "https://www.vlr.gg/matches/?page=3",
      "sec-ch-ua": retrievedUserAgent.secChUa,
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": retrievedUserAgent.platform,
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "sec-gpc": "1",
      "upgrade-insecure-requests": "1",
      "user-agent": retrievedUserAgent.userAgent,
    },
  });
  return response.data;
};

export const retrieveExtendedScheduledMatches = async (
  req: Request,
  res: Response
) => {
  const baseApiUrl = `https://www.vlr.gg/matches`;
  let allScheduledMatches: any[] = [];
  let currentUrl: string | null = baseApiUrl;
  let pageCount = 0;
  const maxPages = 50; // Safety limit to prevent infinite loops

  try {
    console.log(`Starting to fetch scheduled matches from: ${currentUrl}`);

    while (currentUrl && pageCount < maxPages) {
      pageCount++;
      console.log(`Fetching page ${pageCount}: ${currentUrl}`);

      // Fetch current page data
      const html = await fetchPageData(currentUrl);

      // Parse matches from current page
      const pageMatches = await parseExtendedScheduledMatches(html);

      // Merge matches with existing data
      if (pageMatches.length > 0) {
        // Merge matches by date
        pageMatches.forEach((pageData) => {
          const existingDateIndex = allScheduledMatches.findIndex(
            (existing) => existing.date === pageData.date
          );

          if (existingDateIndex !== -1) {
            // Date already exists, merge matches
            allScheduledMatches[existingDateIndex].matches.push(
              ...pageData.matches
            );
          } else {
            // New date, add entire object
            allScheduledMatches.push(pageData);
          }
        });
      }

      // Parse pagination info to get next page URL
      const paginationInfo = parsePaginationInfo(html);
      console.log(`Page ${pageCount} info:`, {
        currentPage: paginationInfo.currentPage,
        hasMorePages: paginationInfo.hasMorePages,
        nextPageUrl: paginationInfo.nextPageUrl,
      });

      // Set next URL for next iteration
      currentUrl = paginationInfo.nextPageUrl;

      // Add a small delay to be respectful to the server
      if (currentUrl) {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
      }
    }

    console.log(
      `Completed fetching ${pageCount} pages. Total match groups: ${allScheduledMatches.length}`
    );

    // Calculate total matches across all dates
    const totalMatches = allScheduledMatches.reduce(
      (sum, dateGroup) => sum + dateGroup.matches.length,
      0
    );
    console.log(`Total individual matches retrieved: ${totalMatches}`);

    res.json({
      totalPages: pageCount,
      totalMatchGroups: allScheduledMatches.length,
      totalMatches: totalMatches,
      data: allScheduledMatches,
    });
  } catch (error) {
    console.error("Error fetching scheduled matches:", error);
    res.status(500).json({
      error: "Failed to retrieve scheduled matches",
      pagesProcessed: pageCount,
      partialData: allScheduledMatches.length > 0 ? allScheduledMatches : null,
    });
  }
};

export const scrapeMatchResults = async () => {
  const retrievedUserAgent = selectRandomUserAgent();
  const { data } = await axios.get("https://www.vlr.gg/matches/results", {
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.7",
      priority: "u=0, i",
      referer: "https://www.vlr.gg/matches",
      "sec-ch-ua": retrievedUserAgent.secChUa,
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": retrievedUserAgent.platform,
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "sec-gpc": "1",
      "upgrade-insecure-requests": "1",
      "user-agent": retrievedUserAgent.userAgent,
    },
  });

  const $ = cheerio.load(data);
  const item = $("div#wrapper");
  const scheduledMatches: any[] = [];

  $("div.wf-label.mod-large").each((_: any, labelEl: any) => {
    const dateText = $(labelEl)
      .clone()
      .children("span")
      .remove()
      .end()
      .text()
      .trim();
    const matchesForDate: any[] = [];
    const cardEl = $(labelEl).next("div.wf-card");
    cardEl.find("a.wf-module-item.match-item").each((_: any, matchEl: any) => {
      const match: {
        team1: string;
        team2: string;
        stats: {
          team1: string;
          team2: string;
        };
        matchUrl: string | null;
        event: string;
        event_icon_url: string | undefined;
        match_time: string;
        etd: string;
      } = {
        team1: "",
        team2: "",
        stats: {
          team1: "",
          team2: "",
        },
        matchUrl: null,
        event: "",
        event_icon_url: undefined,
        match_time: "",
        etd: "",
      };
      match.matchUrl = `https://www.vlr.gg` + $(matchEl).attr("href");

      match.team1 = $(matchEl)
        .find("div.match-item-vs-team-name")
        .eq(0)
        .text()
        .trim();
      match.team2 = $(matchEl)
        .find("div.match-item-vs-team-name")
        .eq(1)
        .text()
        .trim();
      (match.stats = {
        team1: $(matchEl)
          .find("div.match-item-vs-team-score")
          .eq(0)
          .text()
          .trim(),
        team2: $(matchEl)
          .find("div.match-item-vs-team-score")
          .eq(1)
          .text()
          .trim(),
      }),
        (match.matchUrl = `https://www.vlr.gg` + $(matchEl).attr("href"));

      (match.event = $(matchEl)
        .find("div.match-item-event")
        .clone()
        .children()
        .remove()
        .end()
        .text()
        .trim()),
        (match.match_time = $(matchEl)
          .find("div.match-item-time")
          .text()
          .trim()),
        (match.etd = $(matchEl).find("div.ml-eta").text().trim()),
        matchesForDate.push(match);
    });

    if (matchesForDate.length > 0) {
      scheduledMatches.push({
        date: dateText,
        matches: matchesForDate,
      });
    }
  });

  return scheduledMatches;
};

const moment = require("moment-timezone");

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
};
export const vlrLiveScore = async (
  numPages = 1,
  fromPage: number | null = null,
  toPage: number | null = null
) => {
  const url = "https://www.vlr.gg";

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36",
  };

  const resp = await axios.get(url, { headers });
  const htmlText = resp.data;
  const $ = cheerio.load(htmlText);
  const status = resp.status;

  const matches = $(".js-home-matches-upcoming a.wf-module-item");
  const result: LiveMatchResult[] = [];

  interface TeamRoundText {
    ct: string;
    t: string;
  }

  interface LiveMatchResult {
    team1: string;
    team2: string;
    flag1: string;
    flag2: string;
    team1_logo: string;
    team2_logo: string;
    score1: string;
    score2: string;
    team1_round_ct: string;
    team1_round_t: string;
    team2_round_ct: string;
    team2_round_t: string;
    map_number: string;
    current_map: string;
    time_until_match: string;
    match_event: string;
    match_series: string;
    unix_timestamp: string;
    match_page: string;
  }

  for (let i = 0; i < matches.length; i++) {
    const matchElem = matches[i];
    const match = $(matchElem);

    const isLive: boolean = match.find(".h-match-eta.mod-live").length > 0;
    if (!isLive) continue;

    const teams: string[] = [];
    const flags: string[] = [];
    const scores: string[] = [];
    const roundTexts: TeamRoundText[] = [];

    match.find(".h-match-team").each((j: number, teamElem: cheerio.Element) => {
      const team = $(teamElem);
      teams.push(team.find(".h-match-team-name").text().trim());

      const flagClass: string = team.find(".flag").attr("class") || "";
      flags.push(flagClass.replace(" mod-", "").replace("16", "_"));

      scores.push(team.find(".h-match-team-score").text().trim());

      const roundCT: string =
        team.find(".h-match-team-rounds .mod-ct").first().text().trim() ||
        "N/A";
      const roundT: string =
        team.find(".h-match-team-rounds .mod-t").first().text().trim() || "N/A";
      roundTexts.push({ ct: roundCT, t: roundT });
    });

    const eta: string = "LIVE";
    const matchEvent: string = match
      .find(".h-match-preview-event")
      .text()
      .trim();
    const matchSeries: string = match
      .find(".h-match-preview-series")
      .text()
      .trim();

    const utcStr: string | undefined = match
      .find(".moment-tz-convert")
      .attr("data-utc-ts");

    // Handle timestamp (numeric unix vs formatted string)
    let unixTimestamp = "Unknown";
    if (utcStr) {
      if (/^\d+$/.test(utcStr)) {
        // unix timestamp (seconds)
        unixTimestamp = moment
          .unix(Number(utcStr))
          .utc()
          .format("YYYY-MM-DD HH:mm:ss");
      } else {
        // formatted string
        unixTimestamp = moment
          .utc(utcStr, "YYYY-MM-DD HH:mm:ss")
          .format("YYYY-MM-DD HH:mm:ss");
      }
    }

    const urlPath: string = "https://www.vlr.gg/" + match.attr("href");

    const matchPageResp = await axios.get(urlPath, { headers });
    const matchHtml: string = matchPageResp.data;
    const $$ = cheerio.load(matchHtml);

    const teamLogos: string[] = [];
    $$(".match-header-vs img").each((k: number, imgElem: cheerio.Element) => {
      const src: string = $$(imgElem).attr("src") || "";
      teamLogos.push(src.startsWith("http") ? src : "https:" + src);
    });

    let currentMap: string = "Unknown";
    let mapNumber: string = "Unknown";
    const currentMapElem = $$(
      ".vm-stats-gamesnav-item.js-map-switch.mod-active.mod-live"
    ).first();
    if (currentMapElem.length) {
      let mapText: string = currentMapElem.text().trim().replace(/\n|\t/g, "");
      const mapNumberMatch = mapText.match(/^\d+/);
      mapNumber = mapNumberMatch ? mapNumberMatch[0] : "Unknown";
      currentMap = mapText.replace(/^\d+/, "") || "Unknown";
    }

    const liveMatch: LiveMatchResult = {
      team1: teams[0],
      team2: teams[1],
      flag1: flags[0],
      flag2: flags[1],
      team1_logo: teamLogos[0] || "",
      team2_logo: teamLogos[1] || "",
      score1: scores[0],
      score2: scores[1],
      team1_round_ct: roundTexts[0]?.ct || "N/A",
      team1_round_t: roundTexts[0]?.t || "N/A",
      team2_round_ct: roundTexts[1]?.ct || "N/A",
      team2_round_t: roundTexts[1]?.t || "N/A",
      map_number: mapNumber,
      current_map: currentMap,
      time_until_match: eta,
      match_event: matchEvent,
      match_series: matchSeries,
      unix_timestamp: unixTimestamp,
      match_page: urlPath,
    };

    result.push(liveMatch);
  }

  if (status !== 200) {
    throw new Error(`API response: ${status}`);
  }

  return { data: { status, segments: result } };
};
