// Keyword-based categorization. Tune these lists as you see mis-tags in practice.

const WORK_MODE_RULES = [
  { tag: "Remote", patterns: [/\bremote\b/i, /\bwork from home\b/i, /\bwfh\b/i, /\bfully remote\b/i, /\banywhere\b/i] },
  { tag: "Hybrid", patterns: [/\bhybrid\b/i] },
  { tag: "Onsite", patterns: [/\bonsite\b/i, /\bon-site\b/i, /\bin office\b/i, /\bin-office\b/i] },
];

// Country / region detection. Order matters - more specific first.
const COUNTRY_RULES = [
  { tag: "Nigeria", patterns: [/\bnigeria\b/i, /\blagos\b/i, /\babuja\b/i, /\bport\s?harcourt\b/i, /\bibadan\b/i, /\bkano\b/i] },
  { tag: "UK", patterns: [/\buk\b/i, /\bunited kingdom\b/i, /\blondon\b/i, /\bmanchester\b/i, /\bengland\b/i, /\bscotland\b/i, /\bwales\b/i] },
  { tag: "USA", patterns: [/\busa\b/i, /\bunited states\b/i, /\bu\.s\.\b/i, /\bnew york\b/i, /\bsan francisco\b/i, /\bremote[\s,-]+us\b/i] },
  { tag: "Canada", patterns: [/\bcanada\b/i, /\btoronto\b/i, /\bvancouver\b/i] },
  { tag: "Europe", patterns: [/\beurope\b/i, /\beu\b/i, /\bgermany\b/i, /\bfrance\b/i, /\bnetherlands\b/i, /\bspain\b/i, /\bportugal\b/i, /\bpoland\b/i] },
  { tag: "Africa", patterns: [/\bafrica\b/i, /\bkenya\b/i, /\bghana\b/i, /\bsouth africa\b/i, /\begypt\b/i] },
];

const LEVEL_RULES = [
  { tag: "Internship", patterns: [/\bintern(ship)?\b/i, /\btrainee\b/i] },
  { tag: "Junior", patterns: [/\bjunior\b/i, /\bentry[\s-]?level\b/i, /\bgraduate\b/i, /\bassociate\b/i] },
  { tag: "Mid-level", patterns: [/\bmid[\s-]?level\b/i, /\bintermediate\b/i] },
  { tag: "Senior", patterns: [/\bsenior\b/i, /\bsr\.?\b/i, /\blead\b/i, /\bstaff\b/i, /\bprincipal\b/i, /\bhead of\b/i] },
];

const DISCIPLINE_RULES = [
  { tag: "QA / Testing", patterns: [/\bqa\b/i, /\bquality assurance\b/i, /\btest(er|ing)?\b/i, /\bsdet\b/i, /\bautomation engineer\b/i] },
  { tag: "Frontend", patterns: [/\bfrontend\b/i, /\bfront-end\b/i, /\breact\b/i, /\bvue\b/i, /\bangular\b/i] },
  { tag: "Backend", patterns: [/\bbackend\b/i, /\bback-end\b/i, /\bnode\.?js\b/i, /\bapi engineer\b/i] },
  { tag: "Full-stack", patterns: [/\bfull[\s-]?stack\b/i] },
  { tag: "DevOps", patterns: [/\bdevops\b/i, /\bsite reliability\b/i, /\bsre\b/i, /\bplatform engineer\b/i] },
  { tag: "Mobile", patterns: [/\bios\b/i, /\bandroid\b/i, /\bflutter\b/i, /\breact native\b/i, /\bmobile engineer\b/i] },
  { tag: "Data / Analytics", patterns: [/\bdata (scientist|analyst|engineer)\b/i, /\bmachine learning\b/i, /\bml engineer\b/i] },
  { tag: "Product / Design", patterns: [/\bproduct manager\b/i, /\bproduct designer\b/i, /\bux\b/i, /\bui designer\b/i] },
];

function matchRules(haystack, rules) {
  const hits = [];
  for (const rule of rules) {
    if (rule.patterns.some((re) => re.test(haystack))) hits.push(rule.tag);
  }
  return hits;
}

/**
 * Adds a `categories` array to a normalized job:
 * e.g. ["Remote", "Nigeria", "Senior", "QA / Testing"]
 */
export function categorizeJob(job) {
  const haystack = `${job.title} ${job.locationRaw} ${job.description}`.slice(0, 2000);

  const workMode = matchRules(haystack, WORK_MODE_RULES);
  const country = matchRules(haystack, COUNTRY_RULES);
  const level = matchRules(haystack, LEVEL_RULES);
  const discipline = matchRules(haystack, DISCIPLINE_RULES);

  // Defaults when nothing matched, so nothing falls through uncategorized.
  if (workMode.length === 0) workMode.push("Onsite");
  if (level.length === 0) level.push("Mid-level");

  const categories = [...new Set([...workMode, ...country, ...level, ...discipline])];

  return { ...job, categories };
}
