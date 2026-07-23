/**
 * Given a fresh batch of normalized jobs and the persistent store,
 * return only the jobs that are genuinely new:
 *  - not already in the store (seen in a previous run)
 *  - not duplicated within this same batch (two sources listing the same job)
 */
export function dedupeJobs(jobs, store) {
  const seenInBatch = new Set();
  const fresh = [];

  for (const job of jobs) {
    if (store[job.id]) continue; // already posted in a previous run
    if (seenInBatch.has(job.id)) continue; // duplicate within this run (e.g. two sources, same posting)
    seenInBatch.add(job.id);
    fresh.push(job);
  }

  return fresh;
}
