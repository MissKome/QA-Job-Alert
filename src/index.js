import { fetchRemotive } from "./sources/remotive.js";
import { fetchRemoteOK } from "./sources/remoteok.js";
import { fetchArbeitnow } from "./sources/arbeitnow.js";
import { fetchWeWorkRemotely } from "./sources/weworkremotely.js";
import { fetchNigeriaBoards } from "./sources/nigeria-rss.js";

import { dedupeJobs } from "./lib/dedupe.js";
import { categorizeJob } from "./lib/categorize.js";
import { loadStore, saveStore, pruneStore } from "./lib/store.js";
import { publishJobToWordPress, whoAmI } from "./lib/wordpress.js";

const SOURCES = [
  { name: "remotive", fn: fetchRemotive },
  { name: "remoteok", fn: fetchRemoteOK },
  { name: "arbeitnow", fn: fetchArbeitnow },
  { name: "weworkremotely", fn: fetchWeWorkRemotely },
  { name: "nigeria-boards", fn: fetchNigeriaBoards },
];

// Set to true (or run with DRY_RUN=1) to test the pipeline without posting to WordPress.
const DRY_RUN = process.env.DRY_RUN === "1";

async function fetchAllSources() {
  const results = await Promise.allSettled(SOURCES.map((s) => s.fn()));
  const allJobs = [];

  results.forEach((result, i) => {
    const sourceName = SOURCES[i].name;
    if (result.status === "fulfilled") {
      console.log(`[${sourceName}] fetched ${result.value.length} jobs`);
      allJobs.push(...result.value);
    } else {
      console.error(`[${sourceName}] failed:`, result.reason?.message || result.reason);
    }
  });

  return allJobs;
}

async function run() {
  console.log(`Job engine run started at ${new Date().toISOString()}${DRY_RUN ? " (DRY RUN)" : ""}`);

  if (!DRY_RUN) {
    try {
      const me = await whoAmI();
      console.log(`WordPress auth check: logged in as "${me.name}" (id ${me.id}, roles: ${(me.roles || []).join(", ")})`);
    } catch (err) {
      console.error(
        `WordPress auth check FAILED: ${err.message}\n` +
        `This usually means the Authorization header isn't reaching WordPress (common on shared hosting), ` +
        `or the username/application password in your GitHub secrets is wrong.`
      );
    }
  }

  const store = pruneStore(await loadStore());
  const allJobs = await fetchAllSources();
  console.log(`Total fetched across all sources: ${allJobs.length}`);

  const freshJobs = dedupeJobs(allJobs, store);
  console.log(`New jobs after de-dupe: ${freshJobs.length}`);

  let published = 0;
  let failed = 0;

  for (const job of freshJobs) {
    const categorized = categorizeJob(job);
    try {
      let wpPostId = null;
      if (!DRY_RUN) {
        wpPostId = await publishJobToWordPress(categorized);
      }
      store[job.id] = {
        postedAt: new Date().toISOString(),
        wpPostId,
        title: job.title,
        company: job.company,
      };
      published += 1;
      console.log(`✓ ${job.title} @ ${job.company} [${categorized.categories.join(", ")}]`);
    } catch (err) {
      failed += 1;
      console.error(`✗ Failed to publish "${job.title}" @ ${job.company}:`, err.message);
    }
  }

  await saveStore(store);

  console.log(`Done. Published: ${published}, Failed: ${failed}, Skipped (duplicates): ${allJobs.length - freshJobs.length}`);
}

run().catch((err) => {
  console.error("Job engine crashed:", err);
  process.exit(1);
});
