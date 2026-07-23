// Pushes jobs to WordPress via the WP Job Manager plugin's REST API.
// WP Job Manager registers its own post type ("job_listing") completely separate
// from regular blog posts, so these will never mix into your blog feed/homepage.
// Endpoint docs: https://wpjobmanager.com/document/advanced-usage/wp-job-manager-rest-api/

const WP_URL = process.env.WP_URL; // e.g. https://testmeqa.com (no trailing slash)
const WP_USER = process.env.WP_USER;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

function assertConfigured() {
  if (!WP_URL || !WP_USER || !WP_APP_PASSWORD) {
    throw new Error(
      "Missing WordPress config. Set WP_URL, WP_USER, WP_APP_PASSWORD as environment variables / GitHub secrets."
    );
  }
}

function authHeader() {
  const token = Buffer.from(`${WP_USER}:${WP_APP_PASSWORD}`).toString("base64");
  return `Basic ${token}`;
}

async function wpFetch(endpoint, options = {}) {
  assertConfigured();
  const res = await fetch(`${WP_URL}/wp-json/wp/v2/${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`WordPress API ${endpoint} failed: ${res.status} ${text.slice(0, 300)}`);
  }
  return res.json();
}

// Cache category name -> term ID for the lifetime of one run, to avoid duplicate lookups.
const categoryCache = new Map();

// WP Job Manager's job category taxonomy has rest_base "job-categories" (separate from
// WordPress's built-in "categories" used by blog posts).
async function getOrCreateJobCategoryId(name) {
  if (categoryCache.has(name)) return categoryCache.get(name);

  const existing = await wpFetch(`job-categories?search=${encodeURIComponent(name)}&per_page=10`);
  const exact = existing.find((c) => c.name.toLowerCase() === name.toLowerCase());
  if (exact) {
    categoryCache.set(name, exact.id);
    return exact.id;
  }

  const created = await wpFetch("job-categories", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  categoryCache.set(name, created.id);
  return created.id;
}

function renderJobHtml(job) {
  const meta = [
    `<strong>Company:</strong> ${escapeHtml(job.company)}`,
    `<strong>Location:</strong> ${escapeHtml(job.locationRaw || "Not specified")}`,
    `<strong>Source:</strong> ${escapeHtml(job.source)}`,
  ].join("<br>");

  return `
    <p>${meta}</p>
    <p>${escapeHtml(job.description).slice(0, 1500)}${job.description.length > 1500 ? "…" : ""}</p>
    <p><a href="${job.url}" target="_blank" rel="noopener noreferrer">Apply / view original listing</a></p>
  `.trim();
}

function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Publishes a single normalized+categorized job as a WP Job Manager "job_listing" post
 * (via the wp/v2/job-listings REST route), NOT as a regular blog post.
 * Returns the created listing's ID.
 */
export async function publishJobToWordPress(job) {
  const categoryIds = [];
  // Requires "Enable Categories" turned on under WP Job Manager > Settings. If it's off,
  // the job-categories endpoint won't exist - we catch that per-category and just skip
  // tagging rather than failing the whole listing.
  for (const name of job.categories) {
    try {
      categoryIds.push(await getOrCreateJobCategoryId(name));
    } catch (err) {
      console.error(`Could not resolve job category "${name}":`, err.message);
    }
  }

  const body = {
    title: job.title, // company name goes in the _company_name meta field, not the title
    content: renderJobHtml(job),
    status: "publish",
    date: job.postedAt,
    "job-categories": categoryIds,
    meta: {
      _company_name: job.company,
      _job_location: job.locationRaw,
      _application: job.url, // WP Job Manager uses this as the "how to apply" link/email
    },
  };

  const listing = await wpFetch("job-listings", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return listing.id;
}
