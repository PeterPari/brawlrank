# AdSense Fix Plan — BrawlRank

## Problem Summary

Google has flagged BrawlRank for two overlapping policy violations:

1. **Google-served ads on screens without publisher-content / low-value content** — The tier list is rendered entirely by JavaScript (`app.js`). When Google's AdSense quality reviewers evaluate the page (especially non-JS crawlers or manual reviewers), they may see a shell of a page: empty `<div id="tierContainer">` and no substantial static HTML content. Even when JS renders correctly, the page is a single-page tool with no clear site identity, no policy pages, no navigation, and very thin surrounding editorial copy.

2. **Low value content** — Google's definition is not just about word count. It covers whether the site demonstrates E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness). BrawlRank currently has no About page, no Privacy Policy, no Contact page, no named authors, no navigation, and no content beyond the tool itself and a small FAQ/Methodology block.

**Root causes (in priority order):**

| # | Problem | Why it matters to Google |
|---|---------|-------------------------|
| 1 | No Privacy Policy page | Required for AdSense; without it, account can be suspended |
| 2 | No About / Contact pages | E-E-A-T trust signal — reviewers look for "who is behind this site" |
| 3 | No site navigation | A site with no nav looks unfinished / like a dead-end screen |
| 4 | Core content is JS-rendered only | Automated quality checks may evaluate static HTML content alone |
| 5 | Footer has only 2 links | Looks like an under-construction site to reviewers |
| 6 | No actual ad units placed | AdSense may have evaluated the page without seeing how ads fit into a layout |
| 7 | Consent bar copy is vague | Does not mention Google Ads / third-party advertising cookies |

---

## Phase 1 — Trust & Policy Pages (Highest Priority, Blocks Everything Else)

Google will not approve AdSense (or will revoke it) if a privacy policy does not exist and disclose third-party ad cookies. These pages must exist before re-submitting for review.

### 1.1 — Create `privacy.html`

**File:** `privacy.html`

**What it must contain (AdSense requirements):**
- Statement that the site uses cookies and web beacons for advertising
- Explicit disclosure that Google AdSense uses the DoubleClick cookie to serve interest-based ads
- Link to Google's privacy policy (`https://policies.google.com/privacy`) and `https://www.google.com/settings/ads`
- Explanation of what data is collected and why
- Contact email or form for privacy-related requests
- Date the policy was last updated

**Recommended sections:**
1. Introduction (who we are, what this policy covers)
2. Information we collect (analytics, cookies)
3. Third-party advertising (Google AdSense disclosure — this is the legally required section)
4. How to opt out of personalized ads (link to `https://www.google.com/settings/ads`)
5. Children's privacy (state the site is not directed at users under 13)
6. Changes to this policy
7. Contact information

**Key language required by AdSense (must be verbatim or equivalent):**

> Third parties, including Google, use cookies to serve ads based on your prior visits to this website or other websites. Google's use of advertising cookies enables it and its partners to serve ads based on your visit to this site and/or other sites on the Internet. You may opt out of personalized advertising by visiting [Google Ads Settings](https://www.google.com/settings/ads).

### 1.2 — Create `about.html`

**File:** `about.html`

**What it must contain:**
- Explanation of what BrawlRank is and why it exists (mission statement)
- Who built it (Tech-savvies — even a brief team blurb helps)
- How the methodology works (can be a summary referencing the main page)
- How often the data is updated and who maintains it
- Disclaimer that BrawlRank is an independent fan site and is not affiliated with Supercell

**Why this matters:** Google's manual reviewers specifically look for "About" pages to verify the site has a real identity behind it. A site with no About page looks like spam or a placeholder.

### 1.3 — Create `contact.html` (or embed contact in About)

**Options:**
- A separate `contact.html` with a contact form or email address
- A "Contact" section at the bottom of `about.html`

**Minimum requirement:** A reachable email address (can be obfuscated for spam prevention) or a web form. Google wants to confirm someone real is behind the site.

---

## Phase 2 — Navigation & Site Structure

The site currently has no navigation bar and no internal links between pages. This is one of the clearest signals to Google that a site is "under construction" or a dead-end. Every AdSense-approved site has consistent navigation.

### 2.1 — Add a Navigation Bar to `index.html` (and all new pages)

Add a `<nav>` element above or inside the `<header>`:

```html
<nav class="site-nav">
  <div class="container">
    <a href="/" class="nav-home">BrawlRank</a>
    <div class="nav-links">
      <a href="/about.html">About</a>
      <a href="/contact.html">Contact</a>
      <a href="/privacy.html">Privacy</a>
    </div>
  </div>
</nav>
```

**Style requirements:**
- Visible on desktop and mobile
- Not sticky (do not compete with the sticky search bar)
- Simple, unobtrusive — matches the existing dark theme

### 2.2 — Update the Footer

The footer currently only has:
- "Created by Tech-savvies" (external link)
- "Data sourced from Brawlify" (external link)

**Add:**
- Internal links: About, Privacy Policy, Contact
- Copyright line: `© 2026 BrawlRank. All rights reserved.`
- Remove or supplement the sole "Brawl Stars is a trademark of Supercell" line with a fuller disclaimer

**Target footer HTML:**

```html
<footer class="footer">
  <div class="container">
    <div class="footer-links">
      <a href="/about.html">About</a>
      <a href="/privacy.html">Privacy Policy</a>
      <a href="/contact.html">Contact</a>
      <a href="https://tech-savvies.com/" target="_blank" rel="noopener">Built by Tech-savvies</a>
      <a href="https://brawlify.com" target="_blank" rel="noopener">Data: Brawlify</a>
    </div>
    <p class="footer-disclaimer">BrawlRank is an independent fan site and is not affiliated with, endorsed by, or connected to Supercell. Brawl Stars is a trademark of Supercell.</p>
    <p class="footer-copyright">© 2026 BrawlRank. All rights reserved.</p>
  </div>
</footer>
```

---

## Phase 3 — Content Depth & Static HTML Fallback

The tier list is the core content but it is entirely JavaScript-rendered. The raw HTML that Google's crawler or a manual reviewer first sees is nearly empty in the `<main>` area. Two problems stem from this:

1. Non-JS crawlers see almost no content
2. Human reviewers whose JS is slow or disabled see a blank page or spinner

### 3.1 — Add a Static Content Block Above the Tier List

Insert a real editorial section directly into the HTML (not JS-generated) above `<!-- TIER LIST -->`. This content should:
- Describe what the page is (already partially in `<header>` but not enough)
- Mention the current meta context (what patch/season this is for)
- Be 150–300 words of useful text

**Example placement in `index.html` (after the sources popup, before `<!-- SEARCH -->`):**

```html
<!-- INTRO COPY — static, visible without JS -->
<section class="intro-section">
  <div class="container">
    <p class="intro-copy">
      BrawlRank is an aggregated Brawl Stars tier list for <strong>March 2026</strong>.
      Instead of relying on a single pro player's opinion, BrawlRank collects rankings
      from <strong>9 independent sources</strong> — including data platforms like Noff.gg
      and MmonsteR, professional players like KairosTime and SpenLC, and community
      votes from BrawlTime — and blends them using source-specific weights that
      prioritize empirical data over editorial opinion. The result is a consensus ranking
      that reflects the current competitive meta more accurately than any single list.
      Scroll down to see all 100 brawlers ranked, or use the search box to jump directly
      to a specific brawler.
    </p>
  </div>
</section>
```

### 3.2 — Add More Written Content Per Brawler (Modal Enhancement)

When a user clicks a brawler, the modal currently shows tier breakdowns and source scores. Add a brief (2–3 sentence) text summary per brawler inside `app.js` data — something like "Bibi is a close-range melee brawler who excels at area denial…". This dramatically increases content depth and makes the site genuinely valuable to users, not just a data dump.

This doesn't need to be AI-generated fluff — even short factual descriptions (role, best game modes, why they are rated high/low) improve content quality significantly.

### 3.3 — Add a "Current Meta Analysis" Section

Insert a static editorial block (in HTML, not JS) below the tier list and above the Sources section. This section should:
- Be 200–400 words of actual editorial analysis
- Explain which brawlers are dominating the current meta and why
- Reference the current patch or balance changes
- Be updated each time the tier list is updated

**Sample heading:**

```html
<section class="meta-analysis-section">
  <div class="container">
    <h2 class="section-heading">March 2026 Meta Analysis</h2>
    <p class="section-sub">What's strong, what changed, and why.</p>
    <div class="meta-analysis-box">
      <!-- 250–400 words of written analysis about the current patch -->
    </div>
  </div>
</section>
```

This is one of the highest-impact changes for AdSense compliance because it signals that a real person is maintaining the site with substantive editorial content, not just auto-generating a list.

---

## Phase 4 — Consent Bar & Privacy Compliance Fix

The current consent bar reads: *"We use analytics to improve BrawlRank."*

This is insufficient. AdSense requires the consent notice to explicitly mention advertising cookies and third-party data use.

### 4.1 — Update Consent Bar Copy

**Current:**
```html
<span>We use analytics to improve BrawlRank.</span>
```

**Required:**
```html
<span>
  We use cookies for analytics and to serve personalised ads via Google AdSense.
  See our <a href="/privacy.html">Privacy Policy</a> for details.
</span>
```

The "Accept" button should also have a companion "Manage" or "Reject" option if you are targeting EU/UK users under GDPR. For GDPR compliance, you must support both consent and refusal.

### 4.2 — Implement Google Consent Mode (If Applicable)

If there are EU visitors, Google recommends (and may enforce) using Google Consent Mode v2. This is a JavaScript API that tells Google's ad tags whether the user has consented to ad personalisation. Without it, Google may withhold ad revenue from EEA traffic entirely.

Implementation is a small `<script>` block in `<head>` before the AdSense tag:

```html
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent', 'default', {
    'ad_storage': 'denied',
    'analytics_storage': 'denied',
    'wait_for_update': 500
  });
</script>
```

Then, when the user clicks Accept, update:

```js
gtag('consent', 'update', {
  'ad_storage': 'granted',
  'analytics_storage': 'granted'
});
```

---

## Phase 5 — Ad Unit Placement Strategy

Currently there are **zero actual ad units** in the HTML. Only the AdSense script tag is loaded. This means Google may have reviewed the page and found no placement context. Ad units need to be properly placed in contextually appropriate locations.

### 5.1 — Ad Placement Rules (Do Not Violate These)

- **Never** place ads where the content-to-ad ratio tips to more ads than content
- **Never** place ads adjacent to the tier list icons in a way that could cause accidental clicks
- **Never** place ads in the popup/modal overlays
- Ads must be surrounded by real publisher content, not isolated

### 5.2 — Recommended Ad Unit Locations

| Location | Placement | Format | Reasoning |
|----------|-----------|--------|-----------|
| Below header, above tier list | `<div>` after `.sources-center` | Leaderboard (728×90) or Responsive | High visibility, surrounded by real content |
| Between Tier list and Sources section | `<div>` between `</section>` and `<section class="sources-section">` | Rectangle (300×250) or Responsive | Mid-page, flanked by meaningful content sections |
| Below FAQ, above footer | `<div>` before `</main>` | Leaderboard or Responsive | End of content, natural reading stop point |

### 5.3 — Ad Unit HTML Pattern

```html
<div class="ad-unit" aria-label="Advertisement">
  <ins class="adsbygoogle"
       style="display:block"
       data-ad-client="ca-pub-1616218690402516"
       data-ad-slot="REPLACE_WITH_SLOT_ID"
       data-ad-format="auto"
       data-full-width-responsive="true"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>
```

Style `.ad-unit` with a small top/bottom margin (e.g., `margin: 24px 0`) so it is visually separated from content but clearly in context.

### 5.4 — Do NOT Place Ads On

- The consent bar area or anywhere that could trigger unintended clicks
- The modal/popup overlays (sources popup, source detail popup, brawler detail modal)
- The sticky search section (ads adjacent to sticky UI are a policy risk)

---

## Phase 6 — E-E-A-T Signals (Long-term Quality)

Google evaluates "Experience, Expertise, Authoritativeness, Trustworthiness." For a gaming fan site, the bar is lower than for YMYL (medical/financial) sites, but manual reviewers still look for these signals.

### 6.1 — Add Author Attribution

In the methodology section and any editorial content, attribute the writing to a real person or team:

```html
<p class="byline">Maintained by <a href="https://tech-savvies.com/">Tech-savvies</a> — last updated March 16, 2026.</p>
```

### 6.2 — Add "Last Updated" Dates to Sections

The header already has `<p class="header-date" id="lastUpdated">` populated by JS. Ensure this date is also present in the Methodology section and the Meta Analysis section as static HTML so it is visible without JavaScript.

### 6.3 — Create a Changelog / Version History Page

The footer currently has a `Version --` button populated by JS. Replace this with a link to a static `changelog.html` page that lists updates with dates. This signals ongoing editorial maintenance to Google's quality reviewers.

### 6.4 — Improve `<title>` and Meta Description Specificity

Current title: `BrawlRank: a Brawl Stars Tier list`

This is fine but could be more specific to signal freshness:

> `BrawlRank — Brawl Stars Tier List March 2026 | Aggregated from 9 Sources`

Update monthly when the tier list is refreshed.

---

## Phase 7 — Technical Checks

### 7.1 — Verify `ads.txt`

Check that `/ads.txt` is correctly formatted and lists `ca-pub-1616218690402516` as an authorized seller:

```
google.com, pub-1616218690402516, DIRECT, f08c47fec0942fa0
```

If this line is missing or the format is wrong, AdSense will not serve ads regardless of content quality.

### 7.2 — Ensure Pages Are Indexable

Check `robots.txt` does not block the new pages (`privacy.html`, `about.html`, `contact.html`). Currently:

```
User-agent: *
Allow: /
```

Verify this applies to all new pages.

### 7.3 — Add New Pages to `sitemap.xml`

Add entries for each new page:

```xml
<url>
  <loc>https://brawlrank.com/about.html</loc>
  <lastmod>2026-03-29</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.5</priority>
</url>
<url>
  <loc>https://brawlrank.com/privacy.html</loc>
  <lastmod>2026-03-29</lastmod>
  <changefreq>yearly</changefreq>
  <priority>0.3</priority>
</url>
<url>
  <loc>https://brawlrank.com/contact.html</loc>
  <lastmod>2026-03-29</lastmod>
  <changefreq>yearly</changefreq>
  <priority>0.3</priority>
</url>
```

---

## Implementation Order (Strict Priority)

The items below must be done in this order because some are prerequisites for AdSense approval while others are improvements.

| Step | Task | Blocking? | Effort |
|------|------|-----------|--------|
| **1** | Create `privacy.html` with full AdSense disclosure | YES — required to re-apply | 2–3 hrs |
| **2** | Create `about.html` with team info and mission | YES — required for trust | 1–2 hrs |
| **3** | Add nav bar + updated footer to `index.html` and new pages | YES — site looks incomplete without | 1 hr |
| **4** | Update consent bar copy to mention Google AdSense | YES — policy requirement | 15 min |
| **5** | Add static intro copy block to `index.html` (Phase 3.1) | HIGH — content depth | 30 min |
| **6** | Add Meta Analysis editorial section (Phase 3.2) | HIGH — content value | 1–2 hrs |
| **7** | Place actual ad units in `index.html` (Phase 5) | HIGH — ads must be placed before re-review | 30 min |
| **8** | Verify and correct `ads.txt` (Phase 7.1) | HIGH | 15 min |
| **9** | Update `sitemap.xml` with new pages | MEDIUM | 15 min |
| **10** | Add brawler descriptions to modal content (Phase 3.2) | MEDIUM — long-term content value | 4–8 hrs |
| **11** | Implement Google Consent Mode v2 (Phase 4.2) | MEDIUM — required for EEA monetisation | 1 hr |
| **12** | Create `contact.html` | MEDIUM | 30 min |
| **13** | Add author bylines + last-updated timestamps | LOW | 30 min |
| **14** | Create `changelog.html` | LOW | 1 hr |

---

## Re-submission Checklist

Before re-submitting the site for AdSense review, verify every item:

- [ ] `privacy.html` exists, is linked from footer on every page, and explicitly mentions Google AdSense cookies
- [ ] `about.html` exists with genuine information about the site and team
- [ ] All pages have a nav bar with links to About, Privacy, Contact
- [ ] Footer on all pages includes internal links (About, Privacy, Contact) plus copyright line
- [ ] Consent bar mentions advertising cookies and links to Privacy Policy
- [ ] At least one actual `<ins class="adsbygoogle">` ad unit is placed in `index.html`
- [ ] `/ads.txt` contains the correct `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0` line
- [ ] `sitemap.xml` includes all new pages
- [ ] `robots.txt` does not block new pages
- [ ] `index.html` has static written content visible without JavaScript
- [ ] A Meta Analysis or editorial section with ≥200 words is present in `index.html`
- [ ] The site is live at `https://brawlrank.com` and fully accessible before submitting

---

## Why Each Fix Addresses the Policy Violation

**"Screens without publisher-content / low-value content"** is resolved by:
- Adding substantial static editorial content (Phase 3.1, 3.3)
- Creating real supporting pages (Phase 1, 2)
- Demonstrating ongoing editorial maintenance (Phase 6.2, 6.3)

**"Site does not yet meet the criteria of use in the Google publisher network"** is resolved by:
- Privacy Policy with AdSense disclosure (Phase 1.1) — this is non-negotiable
- About page establishing site identity (Phase 1.2) — required for trust
- Navigation and footer (Phase 2) — required for site completeness
- Actual ad units placed in appropriate positions (Phase 5) — AdSense needs to see a real ad layout

The combined effect of all phases makes BrawlRank look and function like a complete, maintained, trustworthy gaming resource rather than a single-page JavaScript tool — which is what Google's policy reviewers are evaluating.
