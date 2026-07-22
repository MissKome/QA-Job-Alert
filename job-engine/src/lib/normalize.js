import crypto from "node:crypto";

/**
 * Common Job shape used everywhere downstream:
 * {
 *   id: string,            // stable hash used for de-dupe
 *   title: string,
 *   company: string,
 *   locationRaw: string,   // whatever the source gave us
 *   url: string,
 *   description: string,   // plain text, trimmed
 *   source: string,        // e.g. "remotive"
 *   postedAt: string       // ISO date, best guess if source lacks one
 * }
 */

export function stripHtml(html = "") {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function makeJobId({ title, company, url }) {
  const base = `${title || ""}|${company || ""}|${url || ""}`
    .toLowerCase()
    .trim();
  return crypto.createHash("sha1").update(base).digest("hex");
}

export function normalizeJob({
  title,
  company,
  locationRaw,
  url,
  description,
  source,
  postedAt,
}) {
  const clean = {
    title: (title || "Untitled role").trim(),
    company: (company || "Unknown company").trim(),
    locationRaw: (locationRaw || "").trim(),
    url: (url || "").trim(),
    description: stripHtml(description || "").slice(0, 4000),
    source: source || "unknown",
    postedAt: postedAt ? new Date(postedAt).toISOString() : new Date().toISOString(),
  };
  clean.id = makeJobId(clean);
  return clean;
}
