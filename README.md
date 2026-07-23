# TestmeQA Job Engine

An hourly bot that finds jobs, cleans them up, sorts them into categories, and posts them to your WordPress site automatically.

## What it does, every hour

1. **Fetches** jobs from 5 sources:
   - Remotive, RemoteOK, Arbeitnow — remote job APIs
   - We Work Remotely — RSS (programming + QA categories)
   - HotNigerianJobs, MyJobMag — RSS (Nigeria-focused)
2. **Removes duplicates** — both within the same run (two sites listing the same job) and against everything it's already posted before.
3. **Categorizes** each job by work mode (Remote / Hybrid / Onsite), country (Nigeria, UK, USA, etc.), seniority (Junior, Mid-level, Senior, Internship), and discipline (QA / Testing, Frontend, Backend, DevOps, etc.).
4. **Publishes** each new job as a job listing on your site — using the WP Job Manager plugin's own dedicated post type, completely separate from your blog. It will never show up mixed into your homepage or blog feed; it lives on its own `/jobs/` page.
5. **Remembers** what it's already posted, so it never duplicates a listing.

## One-time setup

### 0. Install WP Job Manager

This is the free plugin that gives jobs their own dedicated area on your site (a `/jobs/` page, its own listing template, its own categories) instead of mixing with blog posts.

1. In WordPress admin: **Plugins → Add New Plugin**.
2. Search for **WP Job Manager** (by Automattic).
3. Click **Install Now**, then **Activate**.
4. Go to **Job Listings → Settings** and turn on **Enable Categories** — this is required for the bot's Remote/Nigeria/Senior/etc. tags to work. Everything else can stay default.
5. WP Job Manager will automatically create a **Jobs** page (usually at `yoursite.com/jobs/`) — that's where all incoming listings will show up, separate from your blog.

### 1. Get a WordPress Application Password

This is WordPress's official way to let a script log in and create posts on your behalf, without using your real login password.

1. Log into your WordPress admin (`yoursite.com/wp-admin`).
2. Go to **Users → Profile** (or **Users → All Users → [your user]**).
3. Scroll to **Application Passwords**.
4. Type a name for it, e.g. `job-engine`, click **Add New Application Password**.
5. Copy the password shown (looks like `abcd 1234 efgh 5678`) — you won't see it again.

You now have three values: your site URL, your WordPress username, and this application password.

> If you don't see an "Application Passwords" section, your host may have it disabled, or you're on an older WordPress version (< 5.6). Either update WordPress, or install the free **Application Passwords** plugin, or use a plugin like **WP REST API - OAuth1** instead (ask me and I'll adjust the code).

### 2. Put this code on GitHub

- Create a new (private is fine) GitHub repo, e.g. `testmeqa-job-engine`.
- Push everything in this folder to it.

### 3. Add your WordPress credentials as GitHub Secrets

In your repo: **Settings → Secrets and variables → Actions → New repository secret**. Add:

| Secret name | Value |
|---|---|
| `WP_URL` | `https://yoursite.com` (no trailing slash) |
| `WP_USER` | your WordPress username |
| `WP_APP_PASSWORD` | the application password from step 1 |

### 4. That's it

The workflow in `.github/workflows/job-engine.yml` runs automatically every hour. You can also trigger it manually any time from the **Actions** tab in GitHub → **Job Engine** → **Run workflow**.

## Testing locally before you push

```bash
npm install
cp .env.example .env   # then fill in your real WP_URL / WP_USER / WP_APP_PASSWORD
DRY_RUN=1 npm start    # fetches + categorizes but does NOT post to WordPress
npm start               # the real thing — will actually publish posts
```

## Tuning it

- **Add/remove job sources**: edit `src/sources/` (each file exports one `fetchX()` function returning normalized jobs) and register it in `SOURCES` in `src/index.js`.
- **Add/remove categories or keywords**: edit `src/lib/categorize.js` — it's plain keyword lists, easy to extend (e.g. add more Nigerian cities, more seniority synonyms, more tech disciplines).
- **Change the schedule**: edit the `cron` line in `.github/workflows/job-engine.yml` (currently `0 * * * *` = top of every hour, UTC).
- **How long duplicates are remembered**: `pruneStore()` in `src/index.js` currently keeps 90 days of history in `data/jobs-seen.json` — adjust the number if you want it shorter/longer.

## How de-duplication survives across hourly runs

Every job gets a stable ID (a hash of title + company + URL). After a job is published, its ID is saved to `data/jobs-seen.json`. GitHub Actions commits that file back to the repo after every run, so the "memory" persists between hourly runs — it's not lost when the workflow container shuts down.

## Where jobs actually show up

WP Job Manager gives your site a dedicated `/jobs/` page (or wherever you've placed the `[jobs]` shortcode/block) that lists only job listings — never your blog posts, and your blog page never shows job listings either. Each listing also gets its own individual page using WP Job Manager's job template, not your blog post template. The categories the bot assigns (Remote, Nigeria, Senior, etc.) become filterable job categories on that page, assuming "Enable Categories" is turned on as described in step 0.

## Notes on the sources

- The APIs (Remotive, RemoteOK, Arbeitnow) are free and don't need a key.
- The RSS feeds (We Work Remotely, HotNigerianJobs, MyJobMag) are the sites' own public syndication feeds. If a site changes its feed URL or blocks automated requests, that one source will just log an error and skip — it won't break the other sources or crash the run.
- Want more Nigerian-specific sources? Jobberman and some others don't publish a public API/RSS, so pulling from them would mean scraping their HTML, which is a different (and more fragile / ToS-sensitive) approach. Happy to add that if you want it, just say so.
