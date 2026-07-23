import { normalizeJob } from "../lib/normalize.js";
import { fetchWithTimeout } from "../lib/http.js";

// Docs: https://www.arbeitnow.com/api/job-board-api
export async function fetchArbeitnow() {
  const res = await fetchWithTimeout("https://www.arbeitnow.com/api/job-board-api");
  if (!res.ok) throw new Error(`Arbeitnow API failed: ${res.status}`);
  const data = await res.json();

  return (data.data || []).map((j) =>
    normalizeJob({
      title: j.title,
      company: j.company_name,
      locationRaw: j.location || (j.remote ? "Remote" : ""),
      url: j.url,
      description: j.description,
      source: "arbeitnow",
      postedAt: j.created_at ? j.created_at * 1000 : undefined,
    })
  );
}
