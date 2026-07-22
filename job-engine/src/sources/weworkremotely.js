import Parser from "rss-parser";
import { normalizeJob } from "../lib/normalize.js";

const parser = new Parser({
  headers: { "User-Agent": "Mozilla/5.0 (compatible; TestmeQA-JobEngine/1.0)" },
  timeout: 20_000,
});

const FEEDS = [
  "https://weworkremotely.com/categories/remote-programming-jobs.rss",
  "https://weworkremotely.com/categories/remote-qa-jobs.rss",
];

export async function fetchWeWorkRemotely() {
  const jobs = [];

  for (const feedUrl of FEEDS) {
    try {
      const feed = await parser.parseURL(feedUrl);
      for (const item of feed.items || []) {
        // WWR titles are usually "Company: Job Title"
        const [maybeCompany, ...rest] = (item.title || "").split(":");
        const title = rest.length ? rest.join(":").trim() : item.title;
        const company = rest.length ? maybeCompany.trim() : "Unknown company";

        jobs.push(
          normalizeJob({
            title,
            company,
            locationRaw: "Remote",
            url: item.link,
            description: item.contentSnippet || item.content,
            source: "weworkremotely",
            postedAt: item.isoDate || item.pubDate,
          })
        );
      }
    } catch (err) {
      console.error(`WeWorkRemotely feed failed (${feedUrl}):`, err.message);
    }
  }

  return jobs;
}
