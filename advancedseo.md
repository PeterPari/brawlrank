# BrawlRank — Advanced SEO Strategy

> Audit date: March 20, 2026
> Site: https://brawlrank.com/
> Goal: Get BrawlRank discovered and ranked by Google, Bing, and other search engines for Brawl Stars meta/tier list queries.

---

## Table of Contents

1. [Current SEO State — What You Already Have](#1-current-seo-state)
2. [Core Problem — JavaScript Rendering & Hash Routing](#2-core-problem)
3. [Structured Data / JSON-LD](#3-structured-data)
4. [Individual Brawler Pages (The Single Biggest SEO Win)](#4-individual-brawler-pages)
5. [Sitemap Expansion](#5-sitemap-expansion)
6. [Content Strategy — Crawlable Text](#6-content-strategy)
7. [Technical SEO — Head Tags & Signals](#7-technical-seo)
8. [Core Web Vitals & Page Speed](#8-core-web-vitals)
9. [Internal Linking Architecture](#9-internal-linking)
10. [External Link Building & Off-Page SEO](#10-off-page-seo)
11. [Image SEO](#11-image-seo)
12. [Mobile SEO](#12-mobile-seo)
13. [Search Console & Analytics Setup](#13-search-console)
14. [Content Marketing & Blog](#14-content-marketing)
15. [Social Signals & Shareability](#15-social-signals)
16. [Competitor Analysis Framework](#16-competitor-analysis)
17. [Implementation Priority Matrix](#17-priority-matrix)
18. [Monthly SEO Maintenance Checklist](#18-maintenance-checklist)

---

## 1. Current SEO State

### What's Already Working

| Element | Status | Notes |
|---------|--------|-------|
| `<title>` tag | Present | "BrawlRank — The Meta, Averaged" — good, includes brand + descriptor |
| `<meta name="description">` | Present | 126 chars, mentions "9 sources" — solid |
| Canonical URL | Present | `https://brawlrank.com/` |
| Open Graph tags | Complete | og:title, og:description, og:image (1200x630), og:site_name |
| Twitter Card tags | Complete | summary_large_image with image |
| `robots.txt` | Present | Allows all crawlers, references sitemap |
| `sitemap.xml` | Present | But only contains 1 URL (the homepage) |
| Favicon | Present | SVG + PNG in two sizes |
| `lang="en"` | Present | On `<html>` tag |
| Preconnect hints | Present | For fonts and CDN |
| `theme-color` | Present | `#00e5ff` |
| Viewport meta | Present | Standard responsive tag |

### What's Missing (addressed in detail below)

- No structured data (JSON-LD / schema.org)
- No individual crawlable pages for brawlers (100 missed keyword opportunities)
- Hash-based URLs (`#BrawlerName`) are invisible to search engines
- All content rendered via JavaScript — crawlers may see an empty page
- Sitemap has only 1 URL
- No `<h1>` heading (heading hierarchy starts at `<h2>`)
- No `<main>` landmark for content signaling
- No FAQ content or long-tail keyword coverage
- No blog or recurring content
- No backlink strategy
- No Google Search Console verification
- Tech-savvies meta tags (`generator`, `author`, `og:see_also`) pollute your SEO identity

---

## 2. Core Problem — JavaScript Rendering & Hash Routing

### Why This Is Critical

BrawlRank is a **client-side rendered (CSR) single-page app**. When Googlebot visits `https://brawlrank.com/`, here's what happens:

1. It downloads the HTML — which contains an **empty `<div id="tierContainer"></div>`** and no brawler content
2. It *may* execute JavaScript to render the tier list, but **Google's JS rendering is:**
   - **Delayed** — pages enter a render queue and may wait hours/days to be rendered
   - **Unreliable** — complex JS, fetch calls, and dynamic content sometimes fail to render
   - **Second-class** — Google explicitly recommends server-side or static rendering for SEO
3. **Hash fragments (`#BrawlerName`) are completely ignored by crawlers** — Google strips everything after `#` before crawling. This means all 100 brawler deep-links are invisible to search engines.

### The Result

Google likely indexes BrawlRank as a page with:
- A title ("BrawlRank — The Meta, Averaged")
- A meta description
- The static text in the methodology section
- **Zero brawler data, zero tier information, zero individual brawler pages**

### Solution: Pre-render or Server-Side Render

You have three options, ranked by effectiveness:

#### Option A: Static Site Generation (SSG) — RECOMMENDED

Generate static HTML files at build time from `data.json`. This gives you:
- `/index.html` — the main tier list with all brawler data rendered in the HTML
- `/brawlers/shelly/index.html` — individual pages for each brawler
- `/brawlers/colt/index.html` — etc.

**Implementation approach:**
1. Add a Node.js build script (`build-pages.js`) that reads `data.json`
2. For each brawler, generate a standalone HTML page with:
   - Unique `<title>`: "Shelly Tier & Meta Ranking — BrawlRank"
   - Unique `<meta description>`: "Shelly is rated B Tier (3.89/6.00) by 9 sources. See how every pro and data source ranks Shelly in the Brawl Stars meta."
   - The brawler's score, tier, source breakdown, and consensus rendered in static HTML
   - Structured data (JSON-LD) for that brawler
3. For the homepage, render the tier list with actual brawler names and scores in the HTML (not just empty divs)
4. Client-side JS enhances with interactivity (search, modals, etc.)

**Why SSG over SSR:** BrawlRank data changes weekly, not per-request. Static generation at deploy time is simpler, faster, and free to host on GitHub Pages/Netlify/Vercel.

#### Option B: Pre-rendering Service

Use a service like Prerender.io or Rendertron that serves a pre-rendered HTML snapshot to crawlers while real users get the SPA experience. Easier to implement but adds a dependency and can be fragile.

#### Option C: Server-Side Rendering (SSR)

Deploy on a Node.js server (or edge functions) that renders the page server-side on each request. Overkill for a weekly-updated site with static data.

### Minimum Viable Fix (No Brawler Pages)

If individual brawler pages are too much work right now, **at minimum** render the brawler names and tier assignments directly in the HTML so crawlers see real content:

```html
<!-- In index.html, inside tierContainer, generated at build time -->
<div class="tier-row tier-s">
  <div class="tier-label">S</div>
  <div class="tier-brawlers">
    <div class="brawler-icon-wrap" data-name="melodie">
      <img class="brawler-icon" src="portraits/16000083.png" alt="Melodie - S Tier Brawl Stars" loading="lazy">
      <div class="brawler-name-label">Melodie</div>
    </div>
    <!-- ... more brawlers ... -->
  </div>
</div>
```

Then have `app.js` hydrate/replace this content on load. This way, crawlers see the full tier list even without executing JavaScript.

---

## 3. Structured Data / JSON-LD

Structured data tells search engines *what your content means*, not just what it says. This can unlock rich snippets, knowledge panels, and better categorization.

### 3A. WebApplication Schema (Homepage)

Add to `<head>` in `index.html`:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "BrawlRank",
  "url": "https://brawlrank.com/",
  "description": "Aggregated Brawl Stars tier list from 9 data, pro, and community sources. Updated weekly.",
  "applicationCategory": "GameApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "creator": {
    "@type": "Organization",
    "name": "BrawlRank",
    "url": "https://brawlrank.com/"
  },
  "about": {
    "@type": "VideoGame",
    "name": "Brawl Stars",
    "gamePlatform": ["iOS", "Android"],
    "publisher": {
      "@type": "Organization",
      "name": "Supercell"
    }
  }
}
</script>
```

### 3B. ItemList Schema (Tier List as Ranked List)

This tells Google "this is an ordered list of items" — potentially unlocking carousel/list rich snippets:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Brawl Stars Meta Tier List",
  "description": "Aggregated brawler rankings from 9 sources",
  "numberOfItems": 100,
  "itemListOrder": "https://schema.org/ItemListOrderDescending",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Melodie",
      "url": "https://brawlrank.com/brawlers/melodie/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Moe",
      "url": "https://brawlrank.com/brawlers/moe/"
    }
  ]
}
</script>
```

**Implementation:** Generate this dynamically in the build script from `data.json`, sorted by score descending. Include all 100 brawlers.

### 3C. FAQPage Schema

If you add an FAQ section (see Section 6), wrap it in FAQPage schema to get dropdown-style rich snippets in search results:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is BrawlRank?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "BrawlRank aggregates Brawl Stars tier lists from 9 independent sources — including data platforms like Noff.gg, pro players like SpenLC, and community votes — into one objective, weighted meta ranking."
      }
    },
    {
      "@type": "Question",
      "name": "How often is BrawlRank updated?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "BrawlRank is updated weekly, usually within 2-3 days of a new balance patch or meta shift."
      }
    },
    {
      "@type": "Question",
      "name": "How are brawler tiers calculated?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Each source rates brawlers from S to F. We assign scores (S=6, A=5, B=4, C=3, D=2, F=1), apply source-specific weights that prioritize data over opinion, and calculate a weighted average. Thresholds determine the final tier."
      }
    }
  ]
}
</script>
```

### 3D. Individual Brawler Structured Data

On each brawler page (if you build them per Section 4), add:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Shelly Meta Ranking — Brawl Stars Tier List",
  "description": "Shelly is currently rated B Tier with a score of 3.89/6.00 across 9 sources.",
  "author": {
    "@type": "Organization",
    "name": "BrawlRank"
  },
  "dateModified": "2026-03-16",
  "about": {
    "@type": "Thing",
    "name": "Shelly",
    "description": "A Brawl Stars brawler"
  },
  "isPartOf": {
    "@type": "WebSite",
    "name": "BrawlRank",
    "url": "https://brawlrank.com/"
  }
}
</script>
```

### Validation

After implementing, validate all structured data with:
- **Google Rich Results Test:** https://search.google.com/test/rich-results
- **Schema.org Validator:** https://validator.schema.org/

---

## 4. Individual Brawler Pages (The Single Biggest SEO Win)

### Why This Matters

Right now, BrawlRank can only rank for broad queries like "brawl stars tier list." But the **highest-volume, lowest-competition queries** in this niche are brawler-specific:

- "is shelly good in brawl stars"
- "brawl stars colt tier"
- "melodie meta brawl stars"
- "best brawlers brawl stars 2026"
- "edgar brawl stars ranking"

Each of these queries represents a user looking for exactly what BrawlRank provides — a data-backed answer on how good a specific brawler is. Without individual pages, you cannot rank for any of them.

### URL Structure

```
https://brawlrank.com/                          → Main tier list
https://brawlrank.com/brawlers/                  → All brawlers index
https://brawlrank.com/brawlers/shelly/           → Shelly's page
https://brawlrank.com/brawlers/el-primo/         → El Primo's page (slugified)
https://brawlrank.com/brawlers/8-bit/            → 8-Bit's page
```

Use clean, lowercase, hyphenated slugs. No hash fragments, no query parameters.

### What Each Brawler Page Should Contain

Each page should have **at minimum** these elements, all rendered in static HTML:

#### Head Section
```html
<title>Shelly Tier & Meta Ranking — BrawlRank (March 2026)</title>
<meta name="description" content="Shelly is B Tier in Brawl Stars (3.89/6.00). Ranked by 9 sources including Noff.gg, SpenLC, and KairosTime. Strong consensus — all sources agree. Updated March 16, 2026.">
<link rel="canonical" href="https://brawlrank.com/brawlers/shelly/">
<meta property="og:title" content="Shelly is B Tier — BrawlRank">
<meta property="og:description" content="Shelly scored 3.89/6.00 across 9 pro, data, and community sources.">
<meta property="og:url" content="https://brawlrank.com/brawlers/shelly/">
<meta property="og:image" content="https://brawlrank.com/portraits/16000000.png">
```

#### Body Content (Crawlable HTML)
```html
<main>
  <h1>Shelly — B Tier</h1>
  <p>Shelly is currently rated <strong>B Tier</strong> in Brawl Stars with a weighted
     score of <strong>3.89 / 6.00</strong>, aggregated from <strong>9 independent
     sources</strong>. Sources show <strong>strong consensus</strong> (σ = 0.60) on
     Shelly's placement.</p>

  <h2>Source Breakdown</h2>
  <table>
    <thead><tr><th>Source</th><th>Rating</th><th>Weight</th></tr></thead>
    <tbody>
      <tr><td>Noff.gg</td><td>B</td><td>1.5x</td></tr>
      <tr><td>MmonsteR</td><td>B</td><td>1.3x</td></tr>
      <!-- ... all 9 sources ... -->
    </tbody>
  </table>

  <h2>What This Means</h2>
  <p>A B Tier rating means Shelly is a solid pick but not dominant in the current meta.
     She's viable in most modes but outperformed by higher-tier brawlers in competitive play.</p>

  <h2>About BrawlRank's Methodology</h2>
  <p>BrawlRank aggregates tier lists from 9 independent sources including data platforms,
     pro players, content creators, and community votes. Each source is weighted based on
     objectivity — data sources like Noff.gg (1.5x) are weighted higher than community
     votes (0.3x).</p>
</main>
```

#### Key Keyword Targets Per Page

For each brawler page, you're targeting:
- `[brawler name] brawl stars tier` (e.g., "shelly brawl stars tier")
- `[brawler name] meta brawl stars` (e.g., "shelly meta brawl stars")
- `is [brawler name] good brawl stars` (e.g., "is shelly good brawl stars")
- `[brawler name] ranking brawl stars` (e.g., "shelly ranking brawl stars")
- `[brawler name] tier list brawl stars 2026`

### Build Script Implementation

Create `build-pages.js`:

```js
const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
const template = fs.readFileSync('brawler-template.html', 'utf8');

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Generate brawler pages
for (const brawler of data.brawlers) {
  const slug = slugify(brawler.name);
  const dir = path.join('brawlers', slug);
  fs.mkdirSync(dir, { recursive: true });

  let html = template
    .replace(/{{NAME}}/g, brawler.name)
    .replace(/{{TIER}}/g, brawler.tier)
    .replace(/{{SCORE}}/g, brawler.score.toFixed(2))
    .replace(/{{SLUG}}/g, slug)
    .replace(/{{DATE}}/g, data.last_updated)
    // ... more replacements
  ;

  fs.writeFileSync(path.join(dir, 'index.html'), html);
}

console.log(`Generated ${data.brawlers.length} brawler pages`);
```

Run this as part of your deploy pipeline. Every time `data.json` is updated, regenerate all pages.

---

## 5. Sitemap Expansion

### Current State

Your sitemap has 1 URL. It should have 102+ URLs (homepage + brawler index + 100 brawler pages).

### Updated sitemap.xml

Generate this dynamically in your build script:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://brawlrank.com/</loc>
    <lastmod>2026-03-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://brawlrank.com/brawlers/</loc>
    <lastmod>2026-03-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <!-- One entry per brawler -->
  <url>
    <loc>https://brawlrank.com/brawlers/shelly/</loc>
    <lastmod>2026-03-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://brawlrank.com/brawlers/colt/</loc>
    <lastmod>2026-03-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <!-- ... 100 brawler URLs total ... -->
</urlset>
```

### `lastmod` Should Be Real

Don't hardcode dates. In your build script, set `lastmod` to the actual date from `data.json`'s `last_updated` field, converted to ISO 8601 format (`YYYY-MM-DD`). Google uses `lastmod` to decide whether to re-crawl a page — fake or stale dates cause Google to ignore the field entirely.

---

## 6. Content Strategy — Crawlable Text

### Problem

Right now the homepage has very little crawlable text. The methodology section (~130 words) is the only substantive content. The tier list itself is rendered via JavaScript and may not be visible to crawlers. Search engines need **text** to understand what a page is about.

### 6A. Add an FAQ Section

Add an FAQ section below the methodology. This serves double duty:
1. Provides keyword-rich, crawlable text
2. Qualifies for FAQ rich snippets via FAQPage schema (Section 3C)

**Suggested questions (each targets real search queries):**

| Question | Target Keywords |
|----------|----------------|
| What is the best brawler in Brawl Stars right now? | "best brawler brawl stars", "best brawler brawl stars 2026" |
| How does BrawlRank calculate tier rankings? | "brawl stars tier list how", "brawl stars meta methodology" |
| How often is BrawlRank updated? | "brawl stars tier list updated", "latest brawl stars tier list" |
| What sources does BrawlRank use? | "brawl stars tier list sources", "pro brawl stars tier list" |
| What do the tiers (S/A/B/C/D/F) mean? | "brawl stars tier list explained", "what does S tier mean" |
| Is BrawlRank the same as [pro name]'s tier list? | "[pro name] tier list brawl stars" |
| Why do some brawlers have "weak consensus"? | "brawl stars tier list disagreement" |

**Example answer format (renders as HTML):**

```html
<section class="faq-section">
  <div class="container">
    <h2 class="section-heading">Frequently Asked Questions</h2>

    <details class="faq-item">
      <summary>What is the best brawler in Brawl Stars right now?</summary>
      <p>As of March 2026, the best brawlers in Brawl Stars according to
         BrawlRank's aggregated data are the ones in S Tier. These brawlers
         scored 5.50 or higher out of 6.00 across 9 independent sources
         including pro players, data platforms, and community votes. Check
         the tier list above for the current S Tier brawlers — the rankings
         update weekly after each balance patch.</p>
    </details>

    <details class="faq-item">
      <summary>How does BrawlRank calculate tier rankings?</summary>
      <p>BrawlRank collects tier lists from 9 independent sources. Each source
         rates brawlers from S (best) to F (worst). We convert these to numerical
         scores (S=6, A=5, B=4, C=3, D=2, F=1) and calculate a weighted average.
         Data-driven sources like Noff.gg (1.5x weight) are prioritized over
         subjective opinion sources like community votes (0.3x weight). The
         final tier is determined by score thresholds.</p>
    </details>

    <!-- ... more questions ... -->
  </div>
</section>
```

### 6B. "Current Meta Summary" Section

Add a 2-3 paragraph summary above or below the tier list that changes with each update. This gives crawlers fresh, keyword-dense text every week:

```html
<section class="meta-summary">
  <div class="container">
    <h2>Brawl Stars Meta — March 2026</h2>
    <p>The March 2026 Brawl Stars meta is shaped by the recent balance changes
       in the [patch name] update. Assassins dominate S Tier this month, with
       Melodie and Moe leading the pack. Tanks have fallen off significantly,
       with El Primo dropping from B to D Tier across most sources.</p>
    <p>This tier list aggregates rankings from 9 independent sources including
       data platforms (Noff.gg, MmonsteR), pro players (SpenLC, KairosTime),
       content creators (Ash, BobbyBS, HMBLE), and community votes (BrawlTime).
       Updated March 16, 2026.</p>
  </div>
</section>
```

**Generate this in your build script** by analyzing `data.json` — identify S-tier brawlers, major tier changes, and source agreement patterns.

### 6C. Title Tag Optimization for the Homepage

Your current title is good but could be more keyword-targeted:

| Current | Suggested |
|---------|-----------|
| `BrawlRank — The Meta, Averaged` | `Brawl Stars Tier List (March 2026) — BrawlRank Meta Rankings` |

**Why:** The current title is brand-first. For a site that isn't yet established, leading with the primary search query ("Brawl Stars Tier List") captures more organic traffic. Include the date to signal freshness — Google favors recent tier lists.

Update this in your build script so it auto-updates each month.

### 6D. Meta Description Optimization

| Current | Suggested |
|---------|-----------|
| "BrawlRank aggregates Brawl Stars tier lists from 9 data, pro, and community sources into one objective ranking." | "Brawl Stars tier list for March 2026 — 100 brawlers ranked by aggregating 9 pro, data, and community sources. See which brawlers are S Tier right now. Updated weekly." |

**Why:** Include the date, the number of brawlers (100 is impressive), a call to action ("See which brawlers are S Tier"), and the update frequency. This description targets "brawl stars tier list march 2026" and similar date-specific queries.

---

## 7. Technical SEO — Head Tags & Signals

### 7A. Fix the Heading Hierarchy

**Current problem:** No `<h1>` exists on the page. The first heading is `<h2>Sources</h2>`. This tells crawlers there's no primary topic for the page.

**Fix:**
```html
<!-- Add inside .hero-brand, visible or visually hidden -->
<h1>Brawl Stars Tier List — Aggregated Meta Rankings</h1>
```

If you want to keep the visual design unchanged, you can style this as visually hidden (accessible to screen readers and crawlers but not visible):
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}
```

Or, better: **make it visible.** Replace the `.tagline` div with an `<h1>` styled the same way. This is the strongest SEO signal on the page.

### 7B. Remove Tech-savvies Meta Pollution

These tags in your `<head>` actively hurt your SEO by attributing your site to a different entity:

```html
<!-- REMOVE ALL OF THESE -->
<meta name="generator" content="Tech-savvies">
<meta name="author" content="Tech-savvies">
<meta property="og:see_also" content="https://tech-savvies.com/">
<link rel="author" href="https://tech-savvies.com/">
```

Replace with:
```html
<meta name="author" content="BrawlRank">
```

### 7C. Add `<main>` Landmark

Wrap the primary content sections in `<main>`:

```html
<main id="content">
  <!-- search section -->
  <!-- tier list section -->
  <!-- sources section -->
  <!-- methodology section -->
  <!-- FAQ section -->
</main>
```

This helps search engines identify the primary content vs. navigation/footer.

### 7D. Add `robots` Meta for Future Pages

On the homepage:
```html
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
```

`max-image-preview:large` allows Google to show large image previews in search results. `max-snippet:-1` allows unlimited text snippet length.

### 7E. Add Alternate Language Tags (If Applicable)

If BrawlRank ever supports multiple languages:
```html
<link rel="alternate" hreflang="en" href="https://brawlrank.com/">
<link rel="alternate" hreflang="x-default" href="https://brawlrank.com/">
```

For now, having `lang="en"` on the `<html>` tag is sufficient.

### 7F. Add `article:modified_time` for Freshness Signals

```html
<meta property="article:modified_time" content="2026-03-16T00:00:00Z">
```

Google uses this to determine content freshness. Update it in your build script from `data.json`'s `last_updated` field.

---

## 8. Core Web Vitals & Page Speed

Google uses Core Web Vitals as a ranking factor. Here's what to optimize:

### 8A. Largest Contentful Paint (LCP)

**Target:** < 2.5 seconds

**Current concern:** The tier list is rendered via JavaScript after fetching `data.json`. This means LCP is delayed by:
1. HTML download
2. CSS + JS download & parse
3. `data.json` fetch
4. JavaScript execution to render tier rows

**Fixes:**
- **Pre-render the tier list in HTML** (Section 2) — this is the single biggest LCP improvement
- **Inline critical CSS** — extract the above-the-fold CSS (header + first tier row) and inline it in a `<style>` tag in `<head>`. This eliminates the render-blocking CSS fetch for initial paint
- **Preload the data file:**
  ```html
  <link rel="preload" href="data.json" as="fetch" crossorigin>
  ```
- **Defer non-critical JS:**
  ```html
  <script src="app.js" defer></script>
  ```
  (You're already loading it at the end of `<body>`, which is equivalent)

### 8B. Cumulative Layout Shift (CLS)

**Target:** < 0.1

**Current concern:** The tier list container is empty on load, then fills with content when JS executes. This causes a large layout shift.

**Fixes:**
- **Pre-render content** (eliminates the shift entirely)
- **Set minimum heights** on dynamic containers:
  ```css
  #tierContainer { min-height: 600px; }
  ```
- **Reserve space for images** — your brawler icons are 58x58px. Add `width` and `height` attributes:
  ```html
  <img width="58" height="58" ...>
  ```

### 8C. First Input Delay (FID) / Interaction to Next Paint (INP)

**Target:** < 200ms

**Current concern:** Modal opening triggers innerHTML replacement, which can cause jank on lower-end mobile devices.

**Fixes:**
- **Pre-create modal content** — instead of rebuilding innerHTML on every modal open, create the elements once and update their text/attributes
- **Use `requestAnimationFrame`** for visual updates (you're already doing this for the score bar — good)

### 8D. Font Loading Optimization

You load two web fonts (Clash Display, Satoshi) from `fonts.cdnfonts.com`. These block rendering until loaded.

**Fixes:**
- Add `font-display: swap` to ensure text is visible while fonts load:
  ```css
  @font-face {
    font-family: 'Clash Display';
    font-display: swap;
    /* ... */
  }
  ```
  Since you're loading from a CDN stylesheet, you can't control this directly. Consider **self-hosting the fonts** — download the WOFF2 files and serve them from your own domain. This eliminates the DNS lookup + connection to `fonts.cdnfonts.com` and gives you full control over caching and `font-display`.

- **Preload the primary font:**
  ```html
  <link rel="preload" href="/fonts/satoshi-variable.woff2" as="font" type="font/woff2" crossorigin>
  ```

### 8E. Image Optimization

- **Convert PNGs to WebP/AVIF** — modern formats are 25-50% smaller. Serve with `<picture>` for fallback:
  ```html
  <picture>
    <source srcset="portraits/16000000.avif" type="image/avif">
    <source srcset="portraits/16000000.webp" type="image/webp">
    <img src="portraits/16000000.png" alt="Shelly" width="58" height="58" loading="lazy">
  </picture>
  ```
- **Add explicit `width` and `height`** to all `<img>` tags (prevents CLS)
- **Use `loading="lazy"`** on below-the-fold images (you're already doing this — good)
- **Use `fetchpriority="high"`** on above-the-fold images (the logo, S-tier brawler portraits):
  ```html
  <img fetchpriority="high" src="BRlogo.svg" alt="BrawlRank">
  ```

---

## 9. Internal Linking Architecture

Internal links are how search engines discover and understand the relationship between pages. Right now, BrawlRank has zero internal links (it's a single page).

### 9A. Homepage → Brawler Pages

In the tier list, each brawler icon should be a real `<a>` link (not just a JS click handler):

```html
<a href="/brawlers/shelly/" class="brawler-icon-wrap" data-name="shelly">
  <img class="brawler-icon" src="portraits/16000000.png" alt="Shelly">
</a>
```

Use JavaScript to intercept the click for the modal experience, but the underlying `<a>` tag ensures crawlers follow the link.

### 9B. Brawler Pages → Homepage

Each brawler page should link back:
```html
<a href="/">← Back to full tier list</a>
```

### 9C. Brawler Pages → Adjacent Brawlers

On each brawler page, link to the brawler ranked directly above and below:
```html
<div class="adjacent-brawlers">
  <a href="/brawlers/colt/">← Colt (ranked #14)</a>
  <a href="/brawlers/nita/">Nita (ranked #16) →</a>
</div>
```

### 9D. Brawler Pages → Same-Tier Brawlers

"Other B Tier brawlers: Shelly, Colt, Nita, ..." with links to each. This creates a dense internal link graph.

### 9E. Cross-link from Source Breakdown

In the source breakdown table on each brawler page, link to the external source URLs (these are already in `data.json`). Outbound links to authoritative sources (YouTube, Noff.gg) can also help SEO.

---

## 10. External Link Building & Off-Page SEO

### 10A. Reddit

Brawl Stars has a large Reddit community. Opportunities:
- **r/BrawlStars** (~1.5M members) — share BrawlRank tier list updates as posts. Be genuine, not spammy. "Here's this week's aggregated tier list from 9 sources" with a link
- **r/BrawlStarsCompetitive** — the competitive community values data-backed analysis. Post methodology breakdowns
- **Comment on tier list discussions** — when people debate brawler rankings, linking to BrawlRank's aggregated view is genuinely useful

### 10B. Discord

- **Official Brawl Stars Discord** and competitive community Discords
- **Create your own Discord** — link it from the site. Community = returning users = more signals to Google

### 10C. YouTube

- **Comment on tier list videos** by the sources you aggregate (SpenLC, KairosTime, etc.) — "I built BrawlRank which aggregates your tier list with 8 others: [link]"
- **Create short comparison videos** — "How 9 tier lists compare this week" using BrawlRank data

### 10D. Brawl Stars Wikis & Fan Sites

- **Brawlify** (you already source data from them) — ask for a backlink
- **Fandom/Wiki** — if there are tier list pages, suggest adding BrawlRank as a source
- **StarList** and other community sites

### 10E. Gaming Press

- Reach out to gaming publications that cover Brawl Stars (Pocket Gamer, TouchArcade, etc.) with a pitch: "We built a data aggregator that combines 9 tier lists into one objective ranking"

### 10F. GitHub

Your repo is public at `github.com/PeterPari/brawlrank`. A well-maintained open-source project can attract developer backlinks. Add a polished README with the live site URL.

---

## 11. Image SEO

### 11A. Alt Text

Your brawler images currently use `alt="[BrawlerName]"`. Improve these to be keyword-rich:

```html
<!-- Current -->
<img alt="Shelly">

<!-- Improved -->
<img alt="Shelly - B Tier Brawl Stars brawler">
```

On individual brawler pages, be more descriptive:
```html
<img alt="Shelly portrait - rated B Tier (3.89/6.00) in the Brawl Stars meta">
```

### 11B. OG Image per Brawler

Generate unique Open Graph images for each brawler page. When someone shares a brawler link on Discord/Twitter/Reddit, they'll see a rich preview with:
- Brawler portrait
- Name
- Tier badge
- Score
- BrawlRank branding

Use a tool like `@vercel/og` or `satori` to generate these at build time, or create a simple canvas-based generator in Node.js.

### 11C. Image Filenames

Your portrait filenames are numeric IDs (`16000000.png`). For SEO, descriptive filenames help:
```
portraits/shelly.png
portraits/colt.png
```

If renaming is too disruptive, the `alt` text improvement is more important.

---

## 12. Mobile SEO

### 12A. Current Mobile State

Your site is responsive (you have `@media (max-width: 640px)` breakpoints). This is the baseline requirement — Google uses mobile-first indexing.

### 12B. Mobile-Specific Improvements

- **Tap targets** — ensure all clickable elements are at least 48x48px on mobile. Your brawler icons are 46x46px — bump to 48px:
  ```css
  @media (max-width: 640px) {
    .brawler-icon-wrap { width: 48px; }
    .brawler-icon { width: 48px; height: 48px; }
  }
  ```

- **Viewport text sizing** — ensure body text is at least 16px to avoid Google's "text too small" flag

- **No horizontal scrolling** — test that no elements overflow the viewport

### 12C. Mobile Page Speed

Mobile users on slow connections are the most impacted by large JS/CSS payloads. Priorities:
1. Pre-render HTML (no waiting for JS)
2. Compress images (WebP)
3. Minify all assets
4. Lazy-load below-fold images (already done)

---

## 13. Search Console & Analytics Setup

### 13A. Google Search Console

If not already set up:

1. Go to https://search.google.com/search-console/
2. Add property: `https://brawlrank.com/`
3. Verify ownership via:
   - **DNS TXT record** (recommended), or
   - **HTML file upload** (`google[code].html` in root), or
   - **HTML meta tag** in `<head>`
4. After verification:
   - Submit your sitemap (`https://brawlrank.com/sitemap.xml`)
   - Request indexing for the homepage
   - Monitor Coverage report for crawl errors
   - Check Mobile Usability report
   - Monitor Core Web Vitals report

### 13B. Bing Webmaster Tools

1. Go to https://www.bing.com/webmasters/
2. Add site and verify
3. Submit sitemap
4. Bing has lower traffic but also lower competition — easier to rank

### 13C. Google Analytics 4 (Optional)

If you want traffic data (you currently use Microsoft Clarity behind a consent gate):
- Add GA4 with the same consent pattern
- Track events: tier list views, brawler modal opens, search queries
- Use the data to identify which brawlers people search for most → prioritize content for those pages

### 13D. Monitoring Keywords

After setup, monitor these query categories in Search Console:
- **Brand:** "brawlrank", "brawl rank"
- **Primary:** "brawl stars tier list", "brawl stars meta"
- **Brawler-specific:** "[brawler] tier brawl stars" (100 variations)
- **Long-tail:** "best brawler brawl stars 2026", "brawl stars ranked tier list"

---

## 14. Content Marketing & Blog

### Why a Blog?

A blog lets you target long-tail keywords that a tier list page can't. Each blog post is a new URL that can rank independently.

### Blog Post Ideas

| Post Title | Target Keywords | Frequency |
|-----------|----------------|-----------|
| "Brawl Stars Meta Report — March 2026" | "brawl stars meta march 2026" | Monthly |
| "Biggest Tier Changes This Week" | "brawl stars tier changes", "brawl stars nerfs buffs" | Weekly |
| "Top 5 Most Underrated Brawlers (Data Says So)" | "underrated brawlers brawl stars" | Monthly |
| "Pro Players vs Data: Where They Disagree" | "brawl stars pro tier list vs data" | Monthly |
| "How to Read a Tier List (And Why Most Are Wrong)" | "how to read tier list brawl stars" | Evergreen |
| "BrawlRank Methodology: How We Rank 100 Brawlers" | "brawl stars tier list methodology" | Evergreen |
| "[New Brawler Name] First Tier Placement" | "[new brawler] tier brawl stars" | Per release |

### Implementation

- URL structure: `https://brawlrank.com/blog/march-2026-meta-report/`
- Each post is a static HTML page generated from markdown
- Add blog posts to the sitemap
- Cross-link between blog posts and brawler pages

### Blog SEO Essentials Per Post

- Unique `<title>` (under 60 chars, keyword-first)
- Unique `<meta description>` (under 160 chars)
- One `<h1>` matching the title
- Internal links to relevant brawler pages
- Author and date markup
- Article structured data

---

## 15. Social Signals & Shareability

### 15A. Shareable Brawler Cards

You already have Copy Link + Tweet buttons in the brawler modal. Extend this:
- **Add Reddit share button** — the Brawl Stars subreddit is the primary discovery channel
- **Add Discord share** — "Copy for Discord" that formats as an embed-friendly message
- **WhatsApp share** — huge in mobile gaming communities

### 15B. Unique OG Images Per Brawler

When someone pastes `https://brawlrank.com/brawlers/shelly/` into Discord, Twitter, or Reddit, the preview should show a rich, branded card with Shelly's portrait and tier — not a generic BrawlRank image. This dramatically increases click-through from social shares.

### 15C. Social Meta for Individual Pages

Each brawler page needs its own OG/Twitter meta (see Section 4).

---

## 16. Competitor Analysis Framework

### Who You're Competing Against

For "brawl stars tier list" queries:
1. **Noff.gg** — data-driven, established, backlinks from Reddit
2. **BrawlTime.ninja** — community votes, well-indexed
3. **SpenLC / KairosTime YouTube videos** — Google surfaces video results
4. **Pro Guides** — editorial, high domain authority
5. **Fandom Wiki** — high domain authority

### How to Differentiate

- **BrawlRank's unique angle:** "aggregated from 9 sources" — no competitor does this
- **Lean into data credibility:** "the only tier list that combines all major sources"
- **Update faster:** be the first to publish updated rankings after balance patches

### Competitor SEO Audit Checklist

For each competitor, check:
- [ ] How many pages do they have indexed? (site:[domain] in Google)
- [ ] What structured data do they use? (Rich Results Test)
- [ ] What keywords do they rank for? (use Ahrefs/Semrush free tier, or Google Search Console's "Links" report for your own site)
- [ ] How many backlinks do they have? (Ahrefs/Moz free tools)
- [ ] How fast does their site load? (PageSpeed Insights)

---

## 17. Implementation Priority Matrix

### Phase 1 — Critical Foundation (Week 1)

| Task | Effort | SEO Impact | Section |
|------|--------|------------|---------|
| Add `<h1>` heading | 5 min | High | 7A |
| Remove Tech-savvies meta tags | 5 min | Medium | 7B |
| Wrap content in `<main>` | 5 min | Medium | 7C |
| Add `robots` meta tag | 2 min | Low | 7D |
| Add `article:modified_time` | 2 min | Medium | 7F |
| Add WebApplication JSON-LD | 15 min | Medium | 3A |
| Optimize title tag | 5 min | High | 6C |
| Optimize meta description | 5 min | High | 6D |
| Set up Google Search Console | 15 min | Critical | 13A |
| Submit sitemap to GSC | 5 min | Critical | 13A |
| Set up Bing Webmaster Tools | 10 min | Medium | 13B |

**Estimated time: ~1.5 hours. This is your Day 1 work.**

### Phase 2 — Crawlable Content (Week 2-3)

| Task | Effort | SEO Impact | Section |
|------|--------|------------|---------|
| Pre-render tier list in HTML | 3 hr | Critical | 2 |
| Add FAQ section with schema | 1 hr | High | 6A, 3C |
| Add meta summary section | 30 min | High | 6B |
| Add FAQPage JSON-LD | 15 min | High | 3C |
| Improve image alt text | 30 min | Medium | 11A |
| Add `width`/`height` to images | 15 min | Medium (CLS) | 8B |
| Preload data.json | 5 min | Medium (LCP) | 8A |
| Add `font-display: swap` | 15 min | Medium (LCP) | 8D |

**Estimated time: ~6 hours. The pre-rendering is the heavy lift.**

### Phase 3 — Individual Brawler Pages (Week 3-5)

| Task | Effort | SEO Impact | Section |
|------|--------|------------|---------|
| Create brawler page template | 2 hr | Critical | 4 |
| Build page generation script | 3 hr | Critical | 4 |
| Generate 100 brawler pages | (automated) | Critical | 4 |
| Add ItemList JSON-LD (homepage) | 30 min | High | 3B |
| Add Article JSON-LD (per brawler) | 30 min | Medium | 3D |
| Expand sitemap to 102+ URLs | 30 min | High | 5 |
| Internal linking (icon → page) | 1 hr | High | 9A |
| Cross-linking between pages | 1 hr | Medium | 9C, 9D |
| Generate unique OG images | 3 hr | Medium | 11B |

**Estimated time: ~12 hours. This is the single biggest SEO investment and the highest ROI.**

### Phase 4 — Performance & Polish (Week 5-6)

| Task | Effort | SEO Impact | Section |
|------|--------|------------|---------|
| Convert images to WebP/AVIF | 2 hr | Medium | 8E |
| Self-host fonts | 1 hr | Medium (LCP) | 8D |
| Inline critical CSS | 1 hr | Medium (LCP) | 8A |
| Minify all assets (Vite) | 30 min | Medium | PROBLEMS.md #5 |
| Fix mobile tap targets | 15 min | Low | 12B |

**Estimated time: ~5 hours.**

### Phase 5 — Growth (Ongoing)

| Task | Effort | SEO Impact | Section |
|------|--------|------------|---------|
| Weekly meta summary updates | 30 min/week | High | 6B |
| Reddit community engagement | 1 hr/week | High (backlinks) | 10A |
| Monthly blog posts | 2 hr/month | High | 14 |
| Discord community | 1 hr setup | Medium (engagement) | 10B |
| Competitor monitoring | 30 min/month | Low | 16 |

---

## 18. Monthly SEO Maintenance Checklist

### Weekly (After Each Data Update)
- [ ] Regenerate all brawler pages from updated `data.json`
- [ ] Update `lastmod` dates in sitemap
- [ ] Update homepage title tag date
- [ ] Update meta summary section
- [ ] Update `article:modified_time`
- [ ] Test structured data still validates

### Monthly
- [ ] Check Google Search Console for:
  - [ ] Crawl errors / pages not indexed
  - [ ] Mobile usability issues
  - [ ] Core Web Vitals problems
  - [ ] New keyword opportunities in Performance report
- [ ] Check Bing Webmaster Tools for same
- [ ] Review top-performing pages and queries
- [ ] Publish a blog post (meta report, analysis, or guide)
- [ ] Share update on Reddit/Discord
- [ ] Run PageSpeed Insights — track scores over time
- [ ] Validate structured data (Rich Results Test)

### Quarterly
- [ ] Full competitor audit (Section 16)
- [ ] Review and update FAQ content
- [ ] Audit internal links — ensure no broken links
- [ ] Review backlink profile (Ahrefs/Moz free tools)
- [ ] Update evergreen content (methodology page, about section)

---

## Summary of Expected Outcomes

If you execute Phases 1-3 fully:

| Metric | Current (est.) | After 3 months | After 6 months |
|--------|---------------|----------------|----------------|
| Indexed pages | 1 | 102+ | 120+ (with blog) |
| Target keywords | ~5 | 500+ | 1000+ |
| Organic monthly visitors | Low | 2-5x current | 10-20x current |
| Rich snippets | None | FAQ dropdowns, possible carousel | Multiple rich results |
| Domain authority | New/low | Building | Established in niche |

The Brawl Stars tier list niche is competitive but BrawlRank has a genuine differentiator (multi-source aggregation) that no other tool offers. The technical SEO foundation is already decent — the gap is entirely in **crawlable content** and **page coverage**. Individual brawler pages are the single highest-ROI investment you can make.
