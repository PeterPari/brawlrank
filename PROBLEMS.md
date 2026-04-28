# BrawlRank — Problems & How to Address Them

> Audit date: March 20, 2026
> Site: https://brawlrank.com/
> Codebase: `index.html` (167 lines), `app.js` (562 lines), `styles.css` (1,146 lines)

---

## Previously Fixed (removed from this list)

- ~~Monolithic single-file architecture~~ — split into `index.html`, `app.js`, `styles.css`
- ~~Missing OG & Twitter Card meta tags~~ — full tags added in `<head>`
- ~~No canonical URL or sitemap~~ — canonical link + `sitemap.xml` present
- ~~No resource hints or preconnects~~ — `preconnect` and `dns-prefetch` added
- ~~No sharing or social features~~ — Copy link + Tweet buttons in modal, hash routing (`#BrawlerName`)
- ~~Mobile tooltip/name issue~~ — `.brawler-name-label` shown on mobile via CSS
- ~~Magic numbers~~ — `TIER_THRESHOLDS` constant extracted
- ~~Redundant DOM queries~~ — key elements cached at init
- ~~CSS tier duplication~~ — simplified to per-tier CSS variable rules

---

## Critical Issues

### 1. Hardcoded Static Data (100 Brawlers, 10 Sources)

**Problem:** All brawler scores, tiers, and source info are hardcoded in a ~400-line JavaScript object at the top of `app.js`. Every data update requires manually editing the file and redeploying. The raw data still contains "Noff Ranked" as a separate source (10 total), which `normalizeTierDataMetadata()` then filters/merges at runtime — a fragile pattern where the declared `total_sources: 10` doesn't match the actual displayed count of 9.

**How to fix:**

1. **Extract data to `data.json`** — move the `TIER_DATA` object to a standalone JSON file. In `app.js`, fetch it at runtime:
   ```js
   const res = await fetch('data.json');
   const TIER_DATA = await res.json();
   ```
   Wrap the current init logic (`normalizeTierDataMetadata()`, `calculateAllScores()`, etc.) in an `async` IIFE or `DOMContentLoaded` callback that awaits the fetch.

2. **Pre-merge Noff data in the JSON** — instead of shipping two separate Noff sources and merging at runtime, do the merge in whatever process generates `data.json`. This eliminates `normalizeTierDataMetadata()` entirely and makes the JSON the single source of truth. Set `total_sources: 9` in the file itself.

3. **Add a "last updated" field in the JSON** — `"last_updated": "March 16, 2026"` is already there, but it should be auto-set by the data pipeline. Display it dynamically from the fetched data (already done in code).

4. **Future: automate data collection** — build a scraping/aggregation script that pulls from source APIs or sheets, outputs `data.json`, and triggers a deploy via GitHub Actions on a schedule (daily/weekly). This is a larger project but `data.json` extraction is the prerequisite.

---

### 2. Accessibility Gaps

**Problem:** Multiple accessibility failures that exclude screen reader and keyboard-only users. Specific issues found in the current code:

- **No `<h1>` tag** — heading hierarchy starts at `<h2>` (index.html line 127). The "BrawlRank" brand text is an image with no heading-level text equivalent.
- **No `<main>` landmark** — the tier list, sources, and methodology sections are siblings under `<body>` with no `<main>` wrapper, making it harder for assistive tech to identify primary content.
- **Modal close buttons (`✕`) have no `aria-label`** — three close buttons (lines 93, 103, 160 in index.html) use the `✕` character with no accessible name.
- **Search input has no `<label>` or `aria-label`** — the input (line 113) relies on `placeholder` text only, which is not announced as a label by all screen readers.
- **No `aria-live` region for search count** — the `#searchCount` div (line 115) updates dynamically but won't be announced to screen reader users.
- **No focus trapping inside modals** — Tab can escape all three modals (brawler, sources popup, source detail) to background content.
- **No skip-to-content link** — keyboard users must tab through the header, sources button, and search before reaching the tier list.
- **No visible `:focus-visible` indicators on brawler icons** — the `.brawler-icon-wrap` elements are clickable (via `onclick`) but have no keyboard focus styling and aren't reachable via Tab (no `tabindex`).

**How to fix:**

1. **Add `<h1>`** — in `index.html`, add a visually hidden `<h1>` inside `.hero-brand`:
   ```html
   <h1 class="sr-only">BrawlRank — The Meta, Averaged</h1>
   ```
   Add `.sr-only` to CSS: `position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;`

2. **Wrap content in `<main>`** — wrap the search section, tier list, sources section, and methodology section in `<main id="content">`.

3. **Add `aria-label="Close"` to all close buttons** — on lines 93, 103, and 160 of index.html, add the attribute to the three `<button>` elements.

4. **Add `aria-label="Search brawlers"` to search input** — on line 113 of index.html.

5. **Add `aria-live="polite"` to search count** — change line 115 to:
   ```html
   <div class="search-count" id="searchCount" aria-live="polite"></div>
   ```

6. **Implement focus trapping in modals** — add a shared `trapFocus(overlayEl)` function in `app.js` that:
   - On modal open, records the previously focused element
   - Queries all focusable elements inside the modal
   - Adds a `keydown` listener that wraps Tab/Shift+Tab within those elements
   - On modal close, restores focus to the previously focused element
   Call this in `openModal()`, `openSourcesPopup()`, and `openSourceDetail()`.

7. **Add skip link** — add as first child of `<body>`:
   ```html
   <a href="#tierContainer" class="skip-link">Skip to tier list</a>
   ```
   Style: position offscreen, move on-screen on `:focus`.

8. **Make brawler icons keyboard-accessible** — in `renderTierList()`, add `tabindex="0"` and `role="button"` to each `.brawler-icon-wrap`, and add a `keydown` listener for Enter/Space. Add `:focus-visible` outline in CSS:
   ```css
   .brawler-icon-wrap:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
   ```

---

## Major Issues

### 3. No Error Handling for Failed Images

**Problem:** 100 brawler images load from local `portraits/` with a fallback to `cdn.brawlify.com`. If a portrait file is missing or the CDN URL is stale, the image silently breaks — the user sees a blank rectangle or broken icon with no context.

**How to fix:**

1. **Add `onerror` handler in `renderTierList()`** — after creating the `img` element (app.js ~line 240), add:
   ```js
   img.onerror = function() {
     if (this.src !== b.icon) {
       this.src = b.icon; // try CDN fallback
     } else {
       this.style.display = 'none';
       // Show first letter as fallback
       const fallback = document.createElement('div');
       fallback.className = 'brawler-icon-fallback';
       fallback.textContent = name.charAt(0);
       wrap.insertBefore(fallback, this);
     }
   };
   ```

2. **Add fallback CSS**:
   ```css
   .brawler-icon-fallback {
     width: 100%; height: 100%;
     display: flex; align-items: center; justify-content: center;
     background: var(--bg-elevated); border-radius: var(--radius-sm);
     font-weight: 700; font-size: 20px; color: var(--text-muted);
   }
   ```

3. **Also add `onerror` to the modal icon** — in `openModal()` (app.js ~line 341), the `<img class="modal-icon">` should have the same fallback logic.

---

### 4. Microsoft Clarity + AdSense Without Consent

**Problem:** Two third-party scripts are loaded unconditionally:
- **Microsoft Clarity** (`clarity.ms`, index.html lines 46-51) captures session recordings and heatmaps.
- **Google AdSense** (index.html lines 43-44) loads ad infrastructure despite no visible ad units on the page.

There's no cookie consent banner or privacy policy. If any EU/CA users visit, this is a GDPR/CCPA compliance risk. The AdSense script also adds ~50KB+ of JavaScript and extra DNS/network requests for zero benefit since no ads are displayed.

**How to fix:**

1. **Remove AdSense immediately** — delete lines 43-44 from index.html. There are no ad units on the page, so this is pure waste. Re-add it when you're ready to place actual ad units. Keep `ads.txt` for when you do.

2. **For Clarity, choose one path:**
   - **Option A (recommended): Remove it** — if you're not actively reviewing session replays, delete lines 46-51. It's a privacy cost with no benefit.
   - **Option B: 

3. **Add a privacy section** — add a "Privacy" link in the footer that scrolls to or opens a brief section explaining what data is collected (or that no data is collected, if you remove both scripts).

---

### 5. Unminified & No Build Pipeline

**Problem:** All three files (HTML, CSS, JS) are served unminified. There's no build tool, no content-hashed filenames, and no compression beyond what the hosting provider might do by default. The CSS alone is 1,146 lines. Without content-hashed filenames, cache invalidation relies on hosting-level headers.

**How to fix:**

1. **Add Vite as a minimal build tool** — Vite requires near-zero config for a vanilla HTML/JS/CSS project:
   ```bash
   npm init -y
   npm install --save-dev vite
   ```
   Add to `package.json`:
   ```json
   "scripts": { "dev": "vite", "build": "vite build" }
   ```
   Vite will automatically minify HTML/CSS/JS, add content hashes to asset filenames, and output to `dist/`.

2. **Configure hosting for cache headers** — after build, static assets with hashes (`app.a1b2c3.js`) should get `Cache-Control: public, max-age=31536000, immutable`. The HTML file should get `Cache-Control: no-cache` or a short max-age so users always get the latest entry point.

3. **Shorter term: use a one-liner** — if Vite feels heavy, a quick win is:
   ```bash
   npx html-minifier-terser index.html -o index.min.html --collapse-whitespace --minify-css --minify-js
   ```

---

## Moderate Issues

### 6. No Structured Data (JSON-LD)

**Problem:** No schema.org markup. Google can't understand the content type, which limits rich snippet potential in search results.

**How to fix:**

Add a `<script type="application/ld+json">` block to `<head>` in index.html, after the Twitter card tags (line 42):

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "BrawlRank",
  "description": "Aggregated Brawl Stars tier list from 9 data, pro, and community sources",
  "url": "https://brawlrank.com/",
  "applicationCategory": "GameApplication",
  "operatingSystem": "Web",
  "creator": {
    "@type": "Organization",
    "name": "BrawlRank"
  }
}
</script>
```

Test with Google's Rich Results Test tool after deploying.

---

### 7. Footer and Meta Attribution Still Points to Tech-savvies

**Problem:** The footer (index.html line 150) says "Created by Tech-savvies" with a link to `tech-savvies.com`. The `<head>` contains `<meta name="generator" content="Tech-savvies">`, `<meta name="author" content="Tech-savvies">`, and `<meta property="og:see_also" content="https://tech-savvies.com/">` (lines 16-19). For a competitive gaming audience, this signals the site was AI/template-generated and can undermine credibility.

**How to fix:**

1. **Remove lines 15-19** from index.html (the Tech-savvies SEO meta block).
2. **Update the footer link** on line 150 — either remove it, change it to your own name/brand, or change to something like:
   ```html
   <a href="https://brawlrank.com/">BrawlRank</a>
   ```
3. **Keep the HTML comment** (lines 4-12) if you want — HTML comments don't affect users or SEO.

---

### 8. Multiple Competing Escape Key Listeners

**Problem:** Three separate `keydown` event listeners are registered on `document` for the Escape key (app.js lines 410, 548, 549). All three fire on every keypress regardless of which modal is open. When the source detail popup is open over the brawler modal, pressing Escape fires all three handlers — closing both the source detail and the brawler modal simultaneously, instead of closing only the topmost layer.

**How to fix:**

Replace the three listeners with a single unified Escape handler at the bottom of app.js:

```js
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  // Close the topmost overlay only
  if (sourceDetailOverlay.classList.contains('active')) {
    closeSourceDetail();
  } else if (srcPopupOverlay.classList.contains('active')) {
    closeSourcesPopup();
  } else if (overlay.classList.contains('active')) {
    closeModal();
  }
});
```

Remove the existing three listeners (lines 409-411, 547-550).

---

### 9. Data Declares 10 Sources, UI Shows 9

**Problem:** The raw `TIER_DATA` object in app.js declares `"total_sources": 10` and includes both "Noff.gg" and "Noff Ranked" as separate sources. The `normalizeTierDataMetadata()` function then patches this at runtime — filtering out "Noff Ranked", renaming the Noff.gg type, and overwriting `total_sources` to 9. This means the data and the presentation disagree at load time, and any code that reads the data before `normalizeTierDataMetadata()` runs gets wrong values.

**How to fix:**

Fix the data at the source, not at runtime:

1. **In the `TIER_DATA` object** (app.js line 1): set `"total_sources": 9`, remove the "Noff Ranked" entry from the `sources` array, and change Noff.gg's type to `"Data (Top 200 + Ranked)"`.
2. **Keep the per-brawler `"Noff Ranked"` keys** in the `sources` objects — these are still needed by `calculateAllScores()` to compute the merged Noff average.
3. **Delete `normalizeTierDataMetadata()`** entirely (lines 3-13) and its call on line 192.
4. This makes the data self-consistent and removes a runtime mutation that's easy to forget about.

---

## Minor Issues

### 10. No Offline Support or PWA Manifest

**Problem:** No service worker or PWA manifest. Users on spotty mobile connections (common for mobile gamers checking tier lists between matches) can't access cached tier data.

**How to fix:**

1. **Create `manifest.json`**:
   ```json
   {
     "name": "BrawlRank",
     "short_name": "BrawlRank",
     "start_url": "/",
     "display": "standalone",
     "background_color": "#0a0a0f",
     "theme_color": "#00e5ff",
     "icons": [
       { "src": "favicon.png", "sizes": "64x64", "type": "image/png" },
       { "src": "BRlogo.svg", "sizes": "any", "type": "image/svg+xml" }
     ]
   }
   ```

2. **Add `<link rel="manifest" href="manifest.json">` to `<head>`** in index.html.

3. **Create a basic service worker** (`sw.js`) that caches the HTML, CSS, JS, and portrait images for offline access. Use a cache-first strategy for portraits and a network-first strategy for the HTML/JS/CSS files.

4. **Register the service worker** at the bottom of app.js:
   ```js
   if ('serviceWorker' in navigator) {
     navigator.serviceWorker.register('sw.js');
   }
   ```

---

### 11. No 404 Page

**Problem:** Visiting any non-existent path (e.g., `/asdf`) likely shows a hosting provider's default 404 page instead of a branded experience.

**How to fix:**

1. **Create `404.html`** — a simple page with the same dark theme, the BrawlRank logo, a "Page not found" message, and a link back to the homepage. Reuse the same `styles.css` for consistent branding.
2. **Configure hosting to use it** — on GitHub Pages, a `404.html` in the repo root is automatically used. On Netlify, add to `_redirects`: `/* /404.html 404`. On Vercel, add to `vercel.json`.

---

### 12. Modal Too Wide on Large Screens

**Problem:** On desktop (≥1024px), the brawler modal uses `width: calc(100vw - 600px)` with no `max-width` (styles.css lines 364-369). On a 2560px ultrawide monitor, this makes the modal ~1960px wide — far wider than the ~440px of content inside it. The modal content (brawler name, score bar, source list) is all narrow and ends up floating in a vast empty box.

**How to fix:**

In the `@media (min-width: 1024px)` block in styles.css (line 364), replace:
```css
.modal {
  width: calc(100vw - 600px);
  max-width: none;
}
```
with:
```css
.modal {
  width: 580px;
  max-width: 90vw;
}
```

This gives it a comfortable fixed width on desktop while staying responsive. 580px accommodates the source breakdown rows without being excessively wide.

---

### 13. No Community or Engagement Hooks

**Problem:** The site is a "visit once, check tier list, leave" experience. There's no reason for users to return or engage further. No Discord link, no changelog, no update notifications. For a weekly-updated meta aggregator, retention is key.

**How to fix:**

1. **Add a "What changed" section** — below the methodology section, show tier movements since the last update (e.g., "Crow: A → S, Edgar: C → D"). This gives returning users immediate value and is shareable content. Compute diffs between `data.json` versions.

2. **Add a Discord invite link** — if you have a Discord server, add an invite button in the header or footer. If not, consider creating one — it's free, low-maintenance, and gives you a direct channel to your most engaged users.

3. **Add a "Last updated: X days ago" badge** — instead of just the date, show relative time: "Updated 4 days ago". This signals freshness and tells users how current the meta is.

4. **Consider an email/RSS signup** — even a simple "Get notified when we update" email field (using a free tier of Buttondown, Mailchimp, etc.) creates a retention channel.

---

## Priority Matrix

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| P0 | #1 Externalize data to JSON | 1 hr | High — unblocks automation, fixes source count mismatch |
| P0 | #9 Fix 10-vs-9 source mismatch | 15 min | High — data integrity |
| P1 | #2 Core accessibility fixes | 2 hr | High — legal/ethical obligation |
| P1 | #4 Remove AdSense + Clarity consent | 15 min | Medium — compliance + free perf |
| P1 | #8 Unified Escape handler | 10 min | Medium — UX bug fix |
| P2 | #3 Image error handling | 20 min | Medium — resilience |
| P2 | #5 Add build pipeline (Vite) | 30 min | Medium — perf + DX |
| P2 | #7 Remove Tech-savvies branding | 5 min | Medium — credibility |
| P2 | #12 Fix modal width on desktop | 5 min | Low — visual polish |
| P3 | #6 Structured data (JSON-LD) | 15 min | Low — SEO enhancement |
| P3 | #10 PWA + offline | 1 hr | Low — polish |
| P3 | #11 404 page | 15 min | Low — polish |
| P3 | #13 Engagement hooks | 2 hr | Medium — retention |
