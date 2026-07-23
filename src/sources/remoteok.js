import { normalizeJob } from "../lib/normalize.js";
import { fetchWithTimeout } from "../lib/http.js";

// Docs: https://remoteok.com/api - first element is metadata, skip it.
export async function fetchRemoteOK() {
  const res = await fetchWithTimeout("https://remoteok.com/api");
  if (!res.ok) throw new Error(`RemoteOK API failed: ${res.status}`);
  const data = await res.json();

  return data
    .filter((j) => j && j.id && j.position)
    .map((j) =>
      normalizeJob({
        title: j.position,
        company: j.company,
        locationRaw: j.location || "Remote",
        url: j.url || `https://remoteok.com/remote-jobs/${j.id}`,
        description: j.description,
        source: "remoteok",
        postedAt: j.date,
      })
    );
}
