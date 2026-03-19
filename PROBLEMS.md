# BrawlRank — Problems & How to Address Them

> Audit date: March 18, 2026
> Site: https://brawlrank.com/
> Codebase: Single-file SPA (`index.html`, 1,198 lines)

---

## Critical Issues

### 1. Monolithic Single-File Architecture
**Problem:** The entire application — HTML, CSS (~300 lines), JavaScript (~400 lines), and data (~400 lines) — lives in one `index.html` file. This makes maintenance painful, collaboration impossible, and caching ineffective.

**How to fix:**
- Separate into `styles.css`, `app.js`, and `data.json`
- External CSS/JS files get browser-cached independently — updating brawler data won't force users to re-download styles
- Consider a minimal build tool (Vite) to bundle and minify for production

---

### 2. Hardcoded Static Data (100 Brawlers, 10 Sources)
**Problem:** All brawler scores, tiers, and source info are hardcoded in a JavaScript object inside the HTML. Every data update requires manually editing the file and redeploying. This doesn't scale and is error-prone.

**How to fix:**
- Extract data to a `data.json` file and fetch it at runtime
- Better: build a simple scraping/aggregation script that pulls from source APIs or sheets, outputs `data.json`, and triggers a deploy via GitHub Actions on a schedule (daily/weekly)
- Display a "last updated" timestamp sourced from the data file, not hardcoded

---

### 3. Missing Open Graph & Twitter Card Meta Tags
**Problem:** No `og:image`, `og:title`, `og:description`, or `twitter:card` tags. When someone shares the link on Discord, Twitter, or iMessage, it shows a blank preview — devastating for a site that relies on community sharing for growth.

**How to fix:**
```html
<meta property="og:title" content="BrawlRank — The Meta, Averaged">
<meta property="og:description" content="Aggregated Brawl Stars tier list from 10 pro sources.">
<meta property="og:image" content="https://brawlrank.com/og-image.png">
<meta property="og:url" content="https://brawlrank.com/">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="BrawlRank — The Meta, Averaged">
<meta name="twitter:description" content="Aggregated Brawl Stars tier list from 10 pro sources.">
<meta name="twitter:image" content="https://brawlrank.com/og-image.png">
```
- Create a branded OG image (1200x630px) showing the tier list or logo

---

### 4. No Canonical URL or Sitemap
**Problem:** Missing `<link rel="canonical">` and `sitemap.xml`. Search engines may index duplicate URLs (with/without trailing slash, query params, etc.) and dilute ranking authority.

**How to fix:**
- Add `<link rel="canonical" href="https://brawlrank.com/">` to `<head>`
- Create a `sitemap.xml` with the single page URL
- Submit sitemap to Google Search Console

---

## Major Issues

### 5. Accessibility Gaps
**Problem:** Multiple accessibility failures that exclude screen reader and keyboard-only users:
- Modal close buttons (`✕`) have no `aria-label`
- Search input has no `<label>` element or `aria-label`
- No `aria-live` region for dynamic search result count updates
- No focus trapping inside modals (Tab can escape to background)
- No skip-to-content link
- Tier colors are the primary differentiator — poor for colorblind users
- No visible focus indicators on interactive elements (brawler icons)
- Missing `<h1>` tag — heading hierarchy starts at `<h2>`

**How to fix:**
- Add `aria-label="Close"` to all close buttons
- Add `aria-label="Search brawlers"` to the search input
- Wrap the search count in `<span aria-live="polite">`
- Implement focus trap in modals (trap Tab/Shift+Tab within modal while open)
- Add `<a href="#tier-list" class="skip-link">Skip to tier list</a>` at top of body
- Add text labels alongside tier color badges (already partially done with letter labels)
- Add `:focus-visible` outlines on all clickable elements
- Promote the site title to `<h1>`

---

### 6. Tooltip/Hover Dependency on Mobile
**Problem:** Brawler names and scores only appear on hover via CSS tooltips. Mobile/touch users have no way to see a brawler's name or score without opening the full modal — creating unnecessary friction. Most mobile users won't know they can tap for details.

**How to fix:**
- Show brawler names below icons on mobile (they're small enough at 46px to need identification anyway)
- Or: use `@media (hover: none)` to show a tap-and-hold tooltip or always-visible name
- Add a subtle visual hint (e.g., small info icon) indicating icons are tappable

---

### 7. No Resource Hints or Preconnects
**Problem:** The site loads fonts from `cdnfonts.com` and images from `cdn.brawlify.com` but doesn't tell the browser to start connecting early. This adds latency to the critical rendering path.

**How to fix:**
```html
<link rel="preconnect" href="https://cdn.brawlify.com" crossorigin>
<link rel="preconnect" href="https://fonts.cdnfonts.com" crossorigin>
<link rel="dns-prefetch" href="https://cdn.brawlify.com">
<link rel="dns-prefetch" href="https://fonts.cdnfonts.com">
```

---

### 8. No Error Handling for Failed Images
**Problem:** 100 brawler images load from an external CDN (`cdn.brawlify.com`). If the CDN goes down, images are renamed, or a brawler ID is wrong, icons silently break with no fallback. The user sees broken images with no context.

**How to fix:**
- Add `onerror` handler to each image: show a fallback placeholder (brawler initial letter in a colored circle)
- Example: `img.onerror = () => { img.src = 'fallback.svg'; }`
- Consider self-hosting critical brawler icons as a backup

---

### 9. Unminified & Uncached Assets
**Problem:** The entire 27KB+ HTML file is served unminified. Inline CSS/JS means the browser can't cache styles and scripts separately — any change invalidates everything.

**How to fix:**
- Split CSS and JS into external files (see #1)
- Minify HTML, CSS, and JS for production
- Use content-hashed filenames (`app.a1b2c3.js`) for cache-busting
- Set long `Cache-Control` headers on static assets
- Even a simple `npx html-minifier index.html` would help in the short term

---

## Moderate Issues

### 10. No Sharing or Social Features
**Problem:** For a competitive gaming tier list — a format that's inherently shareable and debatable — there's no way to share the page, a specific brawler's ranking, or an individual tier. This is a huge missed engagement opportunity.

**How to fix:**
- Add a "Share" button that copies the URL to clipboard (with toast notification)
- Add URL hash routing for individual brawlers (`#brawler/shelly`) so direct links work
- Add "Share to Twitter/Discord" buttons with pre-filled text
- Consider generating shareable tier list images (canvas → PNG export)

---

### 11. No Structured Data (JSON-LD)
**Problem:** No schema.org markup. Google can't understand the content type, which limits rich snippet potential in search results (e.g., showing the tier list directly in search).

**How to fix:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "BrawlRank",
  "description": "Aggregated Brawl Stars tier list from 10 pro sources",
  "url": "https://brawlrank.com/",
  "applicationCategory": "GameApplication",
  "operatingSystem": "Web"
}
</script>
```

---

### 12. Microsoft Clarity Privacy Concern
**Problem:** Microsoft Clarity (`clarity.ms`) is loaded for session recording and heatmaps. This captures user behavior in detail. There's no cookie consent banner or privacy policy — potentially a GDPR/CCPA issue if any EU/CA users visit.

**How to fix:**
- Add a minimal cookie consent banner
- Add a `/privacy` page or section explaining what data is collected
- Configure Clarity to mask sensitive content
- Consider whether Clarity is even necessary — if you're not actively reviewing sessions, remove it to improve privacy and performance

---

### 13. CSS Duplication in Tier-Specific Styles
**Problem:** Each tier (S, A, B, C, D, F) has near-identical CSS rules repeated 6 times for glow effects, border colors, and gradients. This adds unnecessary CSS bloat and makes updates tedious.

**How to fix:**
- Use a single `.brawler-icon-wrap::before` rule with CSS custom properties:
```css
.brawler-icon-wrap {
  --tier-color: var(--tier-f); /* default */
}
.brawler-icon-wrap::before {
  box-shadow: 0 0 8px var(--tier-color);
  border-color: var(--tier-color);
}
```
- Set `--tier-color` per tier via a single class or inline style

---

### 14. Magic Numbers Throughout JavaScript
**Problem:** Tier thresholds (`5.5`, `4.5`, `3.5`, `2.5`, `1.5`), animation durations (`600`, `200`), and weight values are scattered as raw numbers with no named constants or comments explaining them.

**How to fix:**
- Define named constants at the top of the script:
```javascript
const TIER_THRESHOLDS = { S: 5.5, A: 4.5, B: 3.5, C: 2.5, D: 1.5 };
const ANIMATION_DURATION_MS = 600;
```
- Add brief comments explaining the reasoning behind threshold values

---

### 15. Redundant DOM Queries
**Problem:** `document.getElementById()` and `document.querySelector()` are called repeatedly for the same elements (tier list container, modal elements, search input) instead of caching references.

**How to fix:**
```javascript
// Cache once at init
const $tierList = document.getElementById('tier-list');
const $modal = document.getElementById('modal');
const $searchInput = document.getElementById('search');
```

---

## Minor Issues

### 16. No Offline Support
**Problem:** No service worker or PWA manifest. Users on spotty mobile connections (common for mobile gamers) can't access cached tier data.

**How to fix:**
- Add a basic `manifest.json` and service worker for offline caching
- Cache the HTML, CSS, JS, and brawler images for offline access
- Low effort, high value for mobile users

---

### 17. No 404 Page
**Problem:** Visiting any non-existent path (e.g., `/asdf`) likely shows a hosting provider's default 404 page instead of a branded experience.

**How to fix:**
- Create a simple `404.html` with the site branding and a link back to the homepage
- Configure hosting to use it

---

### 18. Footer Link Attribution
**Problem:** Footer credits "Tech-savvies" as the builder and links to `tech-savvies.com`. The `<meta name="generator">` and `<meta name="author">` also point to Tech-savvies. This signals the site was AI-generated, which may undermine credibility with the competitive gaming audience.

**How to fix:**
- Remove or reduce the Tech-savvies attribution — keep it in the HTML comments if desired but not prominently in the footer
- Replace with your own branding/credits
- Remove the `generator` and `author` meta tags pointing to Tech-savvies

---

### 19. AdSense Script Loaded But No Visible Ads
**Problem:** The Google AdSense script is loaded in `<head>`, adding an external request and JavaScript execution cost, but no ad units are visible on the page. This is wasted bandwidth and latency.

**How to fix:**
- Either add ad placements (e.g., between tier sections or in the sources area) or remove the AdSense script entirely until ads are ready
- If keeping it: add `async` and `defer` attributes and load it only after the main content renders

---

### 20. No Community or Engagement Hooks
**Problem:** The site is a "visit once, check tier list, leave" experience. There's no reason for users to return, subscribe, or engage further. No Discord link, no changelog, no notification of updates.

**How to fix:**
- Add a Discord invite link (if applicable)
- Add a "Last updated" badge with update frequency info ("Updated weekly")
- Consider a simple changelog or "What changed" section showing tier movements since last update
- Add email signup or RSS feed for meta updates

---

## Priority Matrix

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| P0 | #3 OG/Twitter meta tags | 15 min | High — enables social sharing |
| P0 | #2 Externalize data | 1 hr | High — unblocks automation |
| P1 | #1 Split into separate files | 1 hr | High — improves DX and caching |
| P1 | #5 Core accessibility fixes | 2 hr | High — legal/ethical obligation |
| P1 | #4 Canonical URL + sitemap | 15 min | Medium — SEO foundation |
| P1 | #10 Share functionality | 1 hr | High — growth multiplier |
| P2 | #7 Preconnect hints | 5 min | Medium — free performance win |
| P2 | #8 Image error handling | 15 min | Medium — resilience |
| P2 | #6 Mobile tooltip fix | 30 min | Medium — mobile UX |
| P2 | #12 Privacy/consent | 1 hr | Medium — compliance |
| P2 | #18 Remove Tech-savvies branding | 5 min | Medium — credibility |
| P2 | #19 Remove unused AdSense | 5 min | Low — free perf gain |
| P3 | #9 Minification | 30 min | Low — performance polish |
| P3 | #11 Structured data | 15 min | Low — SEO enhancement |
| P3 | #13-15 Code quality | 1 hr | Low — maintainability |
| P3 | #16-17 PWA + 404 | 1 hr | Low — polish |
| P3 | #20 Engagement hooks | 2 hr | Medium — retention |
