import fs from "node:fs/promises";
import path from "node:path";

const DATA_DIR = path.resolve(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "jobs-seen.json");

// Shape on disk: { "<jobId>": { postedAt: ISOString, wpPostId: number|null, title, company } }

export async function loadStore() {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return {};
    throw err;
  }
}

export async function saveStore(store) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2) + "\n", "utf-8");
}

// Prunes entries older than N days so the store file doesn't grow forever.
export function pruneStore(store, maxAgeDays = 90) {
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  const pruned = {};
  for (const [id, entry] of Object.entries(store)) {
    const seenAt = entry.postedAt ? new Date(entry.postedAt).getTime() : 0;
    if (seenAt >= cutoff) pruned[id] = entry;
  }
  return pruned;
}
