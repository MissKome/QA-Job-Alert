import { normalizeJob } from "../lib/normalize.js";
import { fetchWithTimeout } from "../lib/http.js";

// Docs: https://remotive.com/api-documentation
export async function fetchRemotive() {
  const res = await fetchWithTimeout("https://remotive.com/api/remote-jobs?limit=100");
  if (!res.ok) throw new Error(`Remotive API failed: ${res.status}`);
  const data = await res.json();

  return (data.jobs || []).map((j) =>
    normalizeJob({
      title: j.title,
      company: j.company_name,
      locationRaw: j.candidate_required_location || "Remote",
      url: j.url,
      description: j.description,
      source: "remotive",
      postedAt: j.publication_date,
    })
  );
}
