# SVdP Naples Jobs Hub

A job-listing hub for St. Vincent de Paul Naples' Job Pathway Program. Users are job seekers, many older, many on phones, some with limited tech experience. The site aggregates listings from trusted boards and links out to the original posting. We never host applications.

## Stack
- Astro (latest), TypeScript, Tailwind CSS
- Server-side data fetching only. API keys stay server-side in `.env` (never shipped to the browser).
- Interactive bits (filters, saved jobs) as small islands. Keep client JS minimal.

## Reference design
`design/mockup.html` is the approved design. Match its layout, colors, type, spacing and copy. It is written in a design-tool format (`<x-dc>`, `<sc-for>`, `{{holes}}`); treat it as a visual spec, not code to copy. Rebuild it as normal Astro components.

- Fonts: Source Serif 4 (headings), Public Sans (body)
- Navy `#14284B` (sidebar, primary buttons, headings), Gold `#C9A227` (active nav item), gold tint `#F3E9C6` (source badges), page background `#F6F4EE`, card border `#E2DED2`
- Colors are placeholders until we get official SVdP hex codes. Define them once as Tailwind theme tokens.

## Layout
- Left sidebar (sticky): Remote Work, Local Jobs, Workers 50+, Second-Chance Hiring, Saved Jobs, plus a "Need help applying?" box. On narrow screens it becomes a horizontal tab row.
- Each category is its own page with: title + one-line intro, filter bar (search, category, job type, open-to), result count + sort, list of job cards, attribution footer.
- Local Jobs replaces "open-to" with a single-select **Area** filter: Collier County (default), Naples area, Immokalee, Include Lee County. Single-select on purpose (simpler for our users); no multi-select.
- Job card: source badge, posted date, title, company, location, job type, pay (only if listed), save button (icon, 44px), "View job" button (fixed 140px width, links to original posting, `aria-label="View job on <Source>"`). Buttons vertically centered so they line up across cards.

## Category → data source
- **Remote Work**: We Work Remotely (RSS), Remotive (API), Jobicy (API, `geo=usa`). Himalayas later.
- **Local Jobs**: Adzuna API (existing board). Credentials in `.env` as `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`. Query by county (Collier, Lee), not radius. Adzuna's predicted salaries (`salary_is_predicted`) are estimates, so don't show them.
- **Workers 50+** (AARP) and **Second-Chance Hiring** (Honest Jobs): no public feeds. Build these as resource-card pages: who the board is for, what to expect (e.g. "free account required"), a few tips, and a button to the site.
- **Saved Jobs**: stored in the browser (localStorage). No accounts.

## Data rules
- One adapter per source in `src/lib/sources/`, each returning the common `Job` type:
  `{ id, source, title, company, location, remote, jobType, salary?, url, postedAt, category? }`
- Normalize, filter, and deduplicate (by URL, then title+company) on the server.
- Cache results and refresh every 30–60 min. Do not fetch on every page load. Remotive asks for at most ~4 calls/day.
- If one source fails, show the others and log the error. Never break the page.
- Filters: pass through to a source's own query params where supported (Adzuna, Remotive, Jobicy); otherwise filter locally by keyword on title/tags/description.

## Attribution (required by each board's terms)
- Every listing links to its original URL and shows the source name.
- Remotive: link to the Remotive URL, credit Remotive, jobs are delayed 24h, never gate listings behind signups/email collection, never resubmit to other job sites.
- WWR, Jobicy, RemoteOK, Himalayas: link back and credit the source.

## Accessibility (non-negotiable)
- Touch targets ≥ 44px, text contrast ≥ 4.5:1, real `<button>`/`<a>`/`<label>` elements, visible focus outlines, keyboard navigable, works at phone width.

## Scope
- **Phase 1 (now):** sidebar + category pages, Remote Work with live feeds, Local Jobs with Adzuna, resource pages for 50+ and Second-Chance, branding.
- **Phase 2 (later):** more sources (Himalayas, etc.), Spanish translation.
- Don't add features outside this list without asking.
