import Parser from "rss-parser";
import { normalizeJob } from "../lib/normalize.js";

const parser = new Parser({
  headers: { "User-Agent": "Mozilla/5.0 (compatible; TestmeQA-JobEngine/1.0)" },
  timeout: 20_000,
});

// Public RSS feeds published by these sites for syndication.
const FEEDS = [
  { url: "https://www.hotnigerianjobs.com/hotnigerianjobs/feed", source: "hotnigerianjobs" },
  { url: "https://www.myjobmag.com/rss/all_jobs.xml", source: "myjobmag" },
];

export async function fetchNigeriaBoards() {
  const jobs = [];

  for (const { url, source } of FEEDS) {
    try {
      const feed = await parser.parseURL(url);
      for (const item of feed.items || []) {
        jobs.push(
          normalizeJob({
            title: item.title,
            company: extractCompany(item.title, item.contentSnippet),
            locationRaw: "Nigeria",
            url: item.link,
            description: item.contentSnippet || item.content,
            source,
            postedAt: item.isoDate || item.pubDate,
          })
        );
      }
    } catch (err) {
      console.error(`Nigeria RSS feed failed (${url}):`, err.message);
    }
  }

  return jobs;
}

// These feeds don't cleanly separate company from title, so best-effort extraction.
function extractCompany(title = "", snippet = "") {
  const atMatch = title.match(/at\s+([A-Z][\w&.,'\- ]+)$/);
  if (atMatch) return atMatch[1].trim();
  return "See listing";
}
