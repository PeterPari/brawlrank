# BrawlRank Objectivity Overhaul — Execution Plan

This plan makes BrawlRank's tier list maximally objective and neutral by restructuring weights, merging correlated sources, adding transparency metrics, and fixing inconsistencies. Every change is specified with exact file locations, exact strings to find, and exact replacement text. **No reasoning or code exploration is required to execute this plan.**

---

## Summary of All Changes

| # | Change | File(s) | Impact |
|---|--------|---------|--------|
| 1 | Merge Noff.gg + Noff Ranked into one source | app.js, index.html, sources.md | Removes double-counting from same data pipeline |
| 2 | New data-first weight system (0.3x–1.5x) | app.js, index.html, sources.md | Data sources get highest weight; 5:1 ratio replaces 2:1 |
| 3 | Runtime score recalculation | app.js | Scores computed from raw ratings + weights at load time |
| 4 | Disagreement metric (σ) per brawler | app.js, styles.css | Shows source consensus: Strong / Moderate / Weak |
| 5 | Fix D-tier threshold (1.8 → 1.5) | app.js, index.html, sources.md | Aligns code with documentation, allows F-tier placements |
| 6 | Update source count (10 → 9) | app.js, index.html | Reflects merged Noff |
| 7 | Update all methodology text | index.html, sources.md | Documents new data-first philosophy |
| 8 | Update SOURCE_DETAILS | app.js | New weight explanations for source detail popups |

---

## New Weight Table

| Source | Type | Old Weight | New Weight | Rationale |
|--------|------|-----------|-----------|-----------|
| Noff.gg (combined) | Data (Top 200 + Ranked) | 1.0 + 0.8 separate | **1.5x** | Empirical data is the most objective signal; combined scope covers both elite and ranked play |
| MmonsteR | Data (Top 200) | 1.0 | **1.3x** | Independent data verification; two data pipelines agreeing increases confidence |
| SpenLC | Pro Player | 1.2 | **1.0x** | Expert but inherently subjective; no source gets bonus for being a personality |
| KairosTime | Pro Tier List | 1.2 | **1.0x** | Pro-consulted and transparent, but still opinion filtered through content creation |
| BobbyBS | Creator + 10 Pros | 1.0 | **0.8x** | Pro input filtered through editorial curation adds a subjective layer |
| HMBLE | Pro Team | 0.9 | **0.8x** | Team-play bias; coordinated 3v3 perspective differs from solo queue reality |
| Ash | Creator | 1.0 | **0.7x** | Single analyst without competitive tournament pedigree or pro consultation |
| Driffle | Editorial | 0.7 | **0.4x** | Secondary synthesis that lags the competitive meta |
| BrawlTime Votes | Community (312K) | 0.6 | **0.3x** | Community perception ≠ competitive performance |

**Category breakdown after changes:**
- Data: 2.8 total weight (37%) — was 2.8 (30%) but from 3 sources, now from 2
- Pro/Creator: 4.3 total weight (56%) — was 5.3 (56%)
- Community: 0.7 total weight (9%) — was 1.3 (14%)
- **Weight range: 0.3x–1.5x (5:1 ratio)** — was 0.6x–1.2x (2:1 ratio)

---

## File Changes

---

### FILE: `app.js`

---

#### Change 1: Update `total_sources` in TIER_DATA (line 1)

**Find:**
```
"total_sources": 10
```

**Replace with:**
```
"total_sources": 9
```

---

#### Change 2: Update Noff.gg type in TIER_DATA sources array (line 1)

**Find:**
```
{"name": "Noff.gg", "type": "Data (Top 200)", "date": "March 16, 2026", "url": "https://www.noff.gg/brawl-stars/tier-list"}
```

**Replace with:**
```
{"name": "Noff.gg", "type": "Data (Top 200 + Ranked)", "date": "March 16, 2026", "url": "https://www.noff.gg/brawl-stars/tier-list"}
```

---

#### Change 3: Remove Noff Ranked from TIER_DATA sources array (line 1)

**Find:**
```
, {"name": "Noff Ranked", "type": "Data (Ranked Mode)", "date": "March 16, 2026", "url": "https://www.noff.gg/brawl-stars/tier-list"}
```

**Replace with:**
(empty string — delete entirely)

---

#### Change 4: Replace SOURCE_WEIGHTS (lines 3–14)

**Find (lines 3–14):**
```javascript
const SOURCE_WEIGHTS = {
  'KairosTime': 1.2,
  'SpenLC': 1.2,
  'MmonsteR': 1.0,
  'Driffle': 0.7,
  'BrawlTime Votes': 0.6,
  'HMBLE': 0.9,
  'Noff Ranked': 0.8,
  'Ash': 1.0,
  'BobbyBS': 1.0,
  'Noff.gg': 1.0
};
```

**Replace with:**
```javascript
const SOURCE_WEIGHTS = {
  'Noff.gg': 1.5,
  'MmonsteR': 1.3,
  'SpenLC': 1.0,
  'KairosTime': 1.0,
  'BobbyBS': 0.8,
  'HMBLE': 0.8,
  'Ash': 0.7,
  'Driffle': 0.4,
  'BrawlTime Votes': 0.3
};
```

---

#### Change 5: Replace SOURCE_DETAILS (lines 16–67)

**Find (lines 16–67):**
```javascript
const SOURCE_DETAILS = {
  'Ash': {
    whatItIs: 'A creator-driven tier list focused on practical ranked and ladder play.',
    whyWeight: 'Weighted at 1.0x as a baseline source in the blended model.',
    uses: ['Ash (single analyst)', 'Current patch experience', 'Creator match review and testing']
  },
  'KairosTime': {
    whatItIs: 'A pro-led tier list with strong competitive framing and broad community trust.',
    whyWeight: 'Receives a 1.2x multiplier for competitive authority.',
    uses: ['KairosTime + competitive collaborators', 'Scrim and high-level ranked context', 'Patch-adjusted matchup analysis']
  },
  'BobbyBS': {
    whatItIs: 'A creator list informed by direct input from multiple professional players.',
    whyWeight: 'Weighted at 1.0x as a baseline source in the blended model.',
    uses: ['BobbyBS + around 10 pro players', 'Pro feedback consensus', 'High-level mode and map discussions']
  },
  'Noff.gg': {
    whatItIs: 'A data-oriented tier list for top-end player performance.',
    whyWeight: 'Weighted at 1.0x as a baseline source in the blended model.',
    uses: ['Top 200 performance snapshots', 'Pick and win trends', 'Ranked/ladder results by mode']
  },
  'SpenLC': {
    whatItIs: 'A pro player tier list with direct competitive gameplay insight.',
    whyWeight: 'Receives a 1.2x multiplier for competitive authority.',
    uses: ['SpenLC (pro player)', 'Competitive experience and scrims', 'Draft and matchup priority judgment']
  },
  'MmonsteR': {
    whatItIs: 'A data-based meta source centered on upper-skill players.',
    whyWeight: 'Weighted at 1.0x as a baseline source in the blended model.',
    uses: ['Top 200 style data model', 'Usage and success metrics', 'Patch-cycle trend tracking']
  },
  'Driffle': {
    whatItIs: 'An editorial tier list designed for broad audience readability.',
    whyWeight: 'Set to 0.7x as a lower weight for an editorial source.',
    uses: ['Editorial analysis team', 'General gameplay patterns', 'Cross-source synthesis for mainstream players']
  },
  'BrawlTime Votes': {
    whatItIs: 'A large community-vote ranking that reflects crowd sentiment.',
    whyWeight: 'Set to 0.6x as a lower weight for a community-aggregated source.',
    uses: ['312K+ community votes', 'Public sentiment trends', 'Large-sample opinion aggregation']
  },
  'HMBLE': {
    whatItIs: 'A pro team perspective rooted in coordinated competitive play.',
    whyWeight: 'Slightly adjusted to 0.9x.',
    uses: ['HMBLE pro team members', 'Team scrim/testing environment', 'Coordinated composition insights']
  },
  'Noff Ranked': {
    whatItIs: 'A ranked-mode-specific data source emphasizing live ladder performance.',
    whyWeight: 'Slightly adjusted to 0.8x.',
    uses: ['Ranked mode performance data', 'Role and mode-specific outcomes', 'Recent ranked trend slices']
  }
};
```

**Replace with:**
```javascript
const SOURCE_DETAILS = {
  'Noff.gg': {
    whatItIs: 'A data-driven tier list combining Top 200 leaderboard performance and Ranked Mode statistics into a single empirical view of the meta.',
    whyWeight: 'Weighted at 1.5x — the highest in BrawlRank — because empirical performance data from the best players is the most objective measure of brawler strength available.',
    uses: ['Top 200 global leaderboard win/pick rates', 'Ranked Mode performance data across skill tiers', 'Automated, regularly refreshed statistical snapshots']
  },
  'MmonsteR': {
    whatItIs: 'An independent data-driven meta analysis focused on upper-skill performance, providing a second empirical perspective alongside Noff.gg.',
    whyWeight: 'Weighted at 1.3x as an independent data source. Two independent data pipelines agreeing on a brawler\'s strength increases confidence.',
    uses: ['Top 200 player performance modeling', 'Usage rates and success metrics across patches', 'Patch-cycle trend tracking']
  },
  'SpenLC': {
    whatItIs: 'An active professional Brawl Stars player competing at the championship level, offering first-hand competitive insight.',
    whyWeight: 'Weighted at 1.0x — expert opinion is valuable but inherently subjective. Pro players can have blind spots or biases toward their own playstyle.',
    uses: ['SpenLC (active pro player)', 'First-hand scrim and tournament experience', 'Draft and matchup priority from direct gameplay']
  },
  'KairosTime': {
    whatItIs: 'A long-running Brawl Stars content creator whose tier lists are built in collaboration with top competitive players.',
    whyWeight: 'Weighted at 1.0x — benefits from pro consultation and transparent methodology, but is still an opinion-based assessment filtered through a content creator.',
    uses: ['KairosTime + competitive collaborators', 'Scrim and high-level ranked context', 'Patch-adjusted matchup analysis']
  },
  'BobbyBS': {
    whatItIs: 'A creator tier list informed by direct input from roughly 10 professional players, providing a crowd-sourced competitive perspective.',
    whyWeight: 'Weighted at 0.8x — pro input adds credibility, but editorial synthesis of that input adds a subjective layer between raw pro opinion and the final list.',
    uses: ['BobbyBS + around 10 pro players', 'Pro feedback consensus', 'High-level mode and map discussions']
  },
  'HMBLE': {
    whatItIs: 'A professional Brawl Stars esports team whose tier list reflects coordinated 3v3 team play from scrims and competition.',
    whyWeight: 'Weighted at 0.8x — genuine competitive authority, but evaluates through the lens of coordinated team play which differs from solo queue.',
    uses: ['HMBLE pro team members', 'Team scrim and composition testing', 'Coordinated play viability assessment']
  },
  'Ash': {
    whatItIs: 'A well-known Brawl Stars content creator producing tier lists focused on practical ranked and ladder play.',
    whyWeight: 'Weighted at 0.7x — reliable single-analyst perspective but lacks competitive tournament pedigree and data-driven objectivity.',
    uses: ['Ash (single analyst)', 'Current patch experience and testing', 'Ranked ladder viability focus']
  },
  'Driffle': {
    whatItIs: 'An editorial tier list aimed at a broad audience, synthesizing publicly available meta information into an accessible guide format.',
    whyWeight: 'Weighted at 0.4x — editorial lists lag behind the competitive meta and rely on secondary sources rather than original data or gameplay.',
    uses: ['Editorial analysis team', 'Cross-source synthesis', 'General/mainstream player focus']
  },
  'BrawlTime Votes': {
    whatItIs: 'A community voting system with 312,000+ votes where any player can rate brawlers, representing the largest sample size of any source.',
    whyWeight: 'Weighted at 0.3x — the lowest in BrawlRank. Community perception and competitive reality often diverge: casual players overrate fun/frustrating brawlers and underrate high-skill ones.',
    uses: ['312K+ individual community votes', 'Open participation regardless of skill level', 'Broad player sentiment tracking']
  }
};
```

---

#### Change 6: Fix D-tier threshold (lines 79–85)

**Find (lines 79–85):**
```javascript
const TIER_THRESHOLDS = {
  S: 5.5,
  A: 4.5,
  B: 3.5,
  C: 2.5,
  D: 1.8
};
```

**Replace with:**
```javascript
const TIER_THRESHOLDS = {
  S: 5.5,
  A: 4.5,
  B: 3.5,
  C: 2.5,
  D: 1.5
};
```

---

#### Change 7: Add runtime score calculation (insert after line 94)

After the closing `}` of `getTierFromScore()` on line 94, insert the following new code:

**Insert after line 94:**
```javascript

const TIER_VALUES = { S: 6, A: 5, B: 4, C: 3, D: 2, F: 1 };

function valueToTier(value) {
  const rounded = Math.round(value);
  const map = { 6: 'S', 5: 'A', 4: 'B', 3: 'C', 2: 'D', 1: 'F' };
  return map[Math.max(1, Math.min(6, rounded))] || 'F';
}

function calculateAllScores() {
  TIER_DATA.brawlers.forEach(b => {
    let weightedSum = 0;
    let totalWeight = 0;
    const ratings = [];

    // Merge Noff.gg (Top 200) and Noff Ranked into one source
    const noffTop = b.sources['Noff.gg'];
    const noffRanked = b.sources['Noff Ranked'];
    let mergedNoffValue = null;

    if (noffTop || noffRanked) {
      if (noffTop && noffRanked) {
        mergedNoffValue = (TIER_VALUES[noffTop] + TIER_VALUES[noffRanked]) / 2;
      } else {
        mergedNoffValue = TIER_VALUES[noffTop || noffRanked];
      }
      const w = SOURCE_WEIGHTS['Noff.gg'];
      weightedSum += mergedNoffValue * w;
      totalWeight += w;
      ratings.push(mergedNoffValue);
    }
    b.noffMergedTier = mergedNoffValue !== null ? valueToTier(mergedNoffValue) : null;

    // Process all other sources (skip raw Noff entries handled above)
    for (const [sourceName, weight] of Object.entries(SOURCE_WEIGHTS)) {
      if (sourceName === 'Noff.gg') continue;
      const tier = b.sources[sourceName];
      if (!tier) continue;
      const value = TIER_VALUES[tier];
      weightedSum += value * weight;
      totalWeight += weight;
      ratings.push(value);
    }

    // Weighted average score
    b.score = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : 0;
    b.num_sources = ratings.length;

    // Disagreement: population standard deviation of source ratings
    if (ratings.length > 0) {
      const mean = ratings.reduce((a, v) => a + v, 0) / ratings.length;
      const variance = ratings.reduce((a, v) => a + (v - mean) ** 2, 0) / ratings.length;
      b.disagreement = Math.round(Math.sqrt(variance) * 100) / 100;
    } else {
      b.disagreement = 0;
    }
  });

  // Sort brawlers by score descending
  TIER_DATA.brawlers.sort((a, b) => b.score - a.score);
}
```

---

#### Change 8: Call `calculateAllScores()` before building tiers (line 128)

**Find (line 128):**
```javascript
const DISPLAY_TIERS = buildTiersFromScores();
```

**Replace with:**
```javascript
calculateAllScores();
const DISPLAY_TIERS = buildTiersFromScores();
```

---

#### Change 9: Handle merged Noff display in modal source list (lines 249–261)

**Find (lines 249–261):**
```javascript
  let sourcesHTML = '';
  const allSources = TIER_DATA.sources;
  allSources.forEach(src => {
    const rating = b.sources[src.name];
    if (rating) {
      const rColor = TIER_COLORS[rating] || '#8e8e93';
      sourcesHTML += `
        <div class="modal-source-row">
          <button class="modal-source-name modal-source-name-btn" type="button" data-source-name="${src.name}" aria-label="Open source details for ${src.name}">${src.name}</button>
          <span class="modal-source-tier" style="background:${rColor}">${rating}</span>
        </div>`;
    }
  });
```

**Replace with:**
```javascript
  let sourcesHTML = '';
  const allSources = TIER_DATA.sources;
  allSources.forEach(src => {
    let rating;
    if (src.name === 'Noff.gg') {
      rating = b.noffMergedTier;
    } else {
      rating = b.sources[src.name];
    }
    if (rating) {
      const rColor = TIER_COLORS[rating] || '#8e8e93';
      sourcesHTML += `
        <div class="modal-source-row">
          <button class="modal-source-name modal-source-name-btn" type="button" data-source-name="${src.name}" aria-label="Open source details for ${src.name}">${src.name}</button>
          <span class="modal-source-tier" style="background:${rColor}">${rating}</span>
        </div>`;
    }
  });
```

---

#### Change 10: Add disagreement display in modal (line 280)

**Find (line 280):**
```javascript
    <div class="modal-sources-title">Source Breakdown (${b.num_sources} sources)</div>
```

**Replace with:**
```javascript
    <div class="modal-consensus">
      <span class="consensus-label">Source agreement:</span>
      <span class="consensus-value ${b.disagreement < 0.8 ? 'consensus-strong' : b.disagreement < 1.5 ? 'consensus-moderate' : 'consensus-weak'}">${b.disagreement < 0.8 ? 'Strong' : b.disagreement < 1.5 ? 'Moderate' : 'Weak'} consensus</span>
      <span class="consensus-detail">(\u03c3 = ${b.disagreement.toFixed(2)})</span>
    </div>
    <div class="modal-sources-title">Source Breakdown (${b.num_sources} sources)</div>
```

> **Note:** `\u03c3` is the Unicode sigma character (σ). Inside a JS template literal this renders correctly.

---

### FILE: `index.html`

---

#### Change 11: Update meta description (line 25)

**Find (line 25):**
```html
<meta name="description" content="BrawlRank aggregates Brawl Stars tier lists from 10 pro players, creators, and data sources into one definitive ranking.">
```

**Replace with:**
```html
<meta name="description" content="BrawlRank aggregates Brawl Stars tier lists from 9 data, pro, and community sources into one objective ranking.">
```

---

#### Change 12: Update og:description (line 32)

**Find (line 32):**
```html
<meta property="og:description" content="Aggregated Brawl Stars tier list from 10 pro players, creators, and data sources. Updated weekly.">
```

**Replace with:**
```html
<meta property="og:description" content="Aggregated Brawl Stars tier list from 9 data, pro, and community sources. Updated weekly.">
```

---

#### Change 13: Update twitter:description (line 41)

**Find (line 41):**
```html
<meta name="twitter:description" content="Aggregated Brawl Stars tier list from 10 pro players, creators, and data sources. Updated weekly.">
```

**Replace with:**
```html
<meta name="twitter:description" content="Aggregated Brawl Stars tier list from 9 data, pro, and community sources. Updated weekly.">
```

---

#### Change 14: Update header subtitle (line 75)

**Find (line 75):**
```html
        <p class="header-sub">Aggregated from 10 sources — pros, data, and community</p>
```

**Replace with:**
```html
        <p class="header-sub">Aggregated from 9 sources — data, pros, and community</p>
```

---

#### Change 15: Update source count badge (line 86)

**Find (line 86):**
```html
    <span class="src-count">10</span>
```

**Replace with:**
```html
    <span class="src-count">9</span>
```

---

#### Change 16: Update sources popup subtitle (line 95)

**Find (line 95):**
```html
    <div class="sources-popup-sub">10 tier lists averaged - open details to see weighting logic.</div>
```

**Replace with:**
```html
    <div class="sources-popup-sub">9 tier lists averaged — open details to see weighting logic.</div>
```

---

#### Change 17: Update methodology text (lines 138–142)

**Find (lines 138–142):**
```html
    <div class="methodology-box">
      <strong>BrawlRank</strong> aggregates tier lists from <strong>10 different sources</strong> including pro players, content creators, and data-driven platforms. Each source rates brawlers from <strong>S</strong> (best) to <strong>F</strong> (worst). We assign numerical scores (<strong>S=6, A=5, B=4, C=3, D=2, F=1</strong>), apply source weights based on recency and authority, then calculate a weighted average. The final tier is determined by these score thresholds: <strong>S >= 5.5, A >= 4.5, B >= 3.5, C >= 2.5, D >= 1.8, F < 1.8</strong>.
      <br><br>
      <strong>Source weights:</strong> KairosTime and SpenLC receive a <strong>1.2×</strong> multiplier for competitive authority. HMBLE (<strong>0.9×</strong>) and Noff Ranked (<strong>0.8×</strong>) are slightly adjusted. Driffle (<strong>0.7×</strong>) and BrawlTime Votes (<strong>0.6×</strong>) receive lower weights as editorial or community-aggregated sources. All other sources are weighted at <strong>1.0×</strong>.
    </div>
```

**Replace with:**
```html
    <div class="methodology-box">
      <strong>BrawlRank</strong> aggregates tier lists from <strong>9 independent sources</strong> including data platforms, pro players, content creators, and community votes. Each source rates brawlers from <strong>S</strong> (best) to <strong>F</strong> (worst). We assign numerical scores (<strong>S=6, A=5, B=4, C=3, D=2, F=1</strong>), apply source weights that prioritize empirical data over subjective opinion, then calculate a weighted average. The final tier is determined by these score thresholds: <strong>S >= 5.5, A >= 4.5, B >= 3.5, C >= 2.5, D >= 1.5, F < 1.5</strong>.
      <br><br>
      <strong>Source weights prioritize objectivity:</strong> Data sources receive the highest weights — Noff.gg (<strong>1.5×</strong>) and MmonsteR (<strong>1.3×</strong>). Pro players SpenLC and KairosTime receive <strong>1.0×</strong>. BobbyBS and HMBLE receive <strong>0.8×</strong>. Creator Ash receives <strong>0.7×</strong>. Editorial source Driffle (<strong>0.4×</strong>) and community votes BrawlTime (<strong>0.3×</strong>) receive the lowest weights, as perception and competitive reality often diverge.
    </div>
```

---

### FILE: `styles.css`

---

#### Change 18: Add consensus/disagreement indicator styles

**Insert after line 1017** (after the closing `}` of the last `.source-detail-link:hover` rule, before the `/* Methodology */` comment on line 1020):

```css

/* Consensus / Disagreement indicator */
.modal-consensus {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
  margin-bottom: 4px;
  font-size: 13px;
}

.consensus-label {
  color: var(--text-muted);
}

.consensus-value {
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.consensus-strong {
  color: #34c759;
  background: rgba(52, 199, 89, 0.12);
}

.consensus-moderate {
  color: #ffcc00;
  background: rgba(255, 204, 0, 0.12);
}

.consensus-weak {
  color: #ff3b30;
  background: rgba(255, 59, 48, 0.12);
}

.consensus-detail {
  color: var(--text-muted);
  font-size: 12px;
  font-style: italic;
}
```

---

### FILE: `sources.md`

---

#### Change 19: Complete rewrite

**Replace the entire contents of `sources.md` with:**

```markdown
# BrawlRank Sources

BrawlRank aggregates 9 independent sources to produce a single blended tier list for every brawler in Brawl Stars. This document explains each source, how it's weighted, and why.

## How the Blending Works

Each source assigns brawlers a tier (S through F). These tiers are converted to numerical scores (S=6, A=5, B=4, C=3, D=2, F=1), then multiplied by that source's weight. The weighted scores are averaged across all sources to produce a final score, which maps back to a tier:

| Final Score | Tier |
| --- | --- |
| ≥ 5.5 | S |
| ≥ 4.5 | A |
| ≥ 3.5 | B |
| ≥ 2.5 | C |
| ≥ 1.5 | D |
| < 1.5 | F |

Additionally, BrawlRank calculates a **disagreement metric** (standard deviation σ) for each brawler to indicate how much sources agree:

| σ Range | Label | Meaning |
| --- | --- | --- |
| < 0.80 | Strong consensus | Sources broadly agree on this brawler's placement |
| 0.80–1.49 | Moderate consensus | Some disagreement between source types |
| ≥ 1.50 | Weak consensus | Sources disagree significantly — tier should be interpreted with caution |

### Weight Philosophy

BrawlRank's weighting system is designed for **maximum objectivity**. Weights range from 0.3x to 1.5x (a 5:1 ratio) based on one core principle: **empirical data is more objective than human opinion**.

1. **Data sources receive the highest weights** (1.3x–1.5x) — Performance statistics from top-level play are verifiable, reproducible, and free from personal bias. They measure what players actually win with, not what anyone thinks is strong.
2. **Pro player and creator sources receive moderate weights** (0.7x–1.0x) — Expert opinion is valuable for capturing nuances that data misses (draft priority, team synergy, emerging trends), but it is inherently subjective and can reflect individual playstyle biases.
3. **Community and editorial sources receive the lowest weights** (0.3x–0.4x) — These reflect popular perception, which often diverges from competitive reality. They serve as a minimal "pulse check" but should not drive the ranking.

This data-first approach means the final tier list is anchored in measurable performance, with human judgment as a corrective lens rather than the primary signal.

### Noff.gg Source Merge

Noff.gg provides two data slices: Top 200 leaderboard performance and Ranked Mode statistics. In earlier versions of BrawlRank, these were treated as two separate sources with independent weights (1.0x and 0.8x). This gave Noff a combined weight of 1.8x — more influence than any other entity — while also introducing correlated data from the same pipeline.

BrawlRank now merges these into a single source. When both data slices are available for a brawler, their tier ratings are averaged into one value. This prevents double-counting while preserving the breadth of Noff's data coverage.

---

## Source Overview

| # | Source | Type | Date | Weight | Link |
| --- | --- | --- | --- | --- | --- |
| 1 | Noff.gg | Data (Top 200 + Ranked) | Mar 16, 2026 | 1.5x | [noff.gg](https://www.noff.gg/brawl-stars/tier-list) |
| 2 | MmonsteR | Data (Top 200) | Mar 6, 2026 | 1.3x | [mmonster.co](https://mmonster.co/blog/brawl-stars-meta) |
| 3 | SpenLC | Pro Player | Mar 6, 2026 | 1.0x | [YouTube](https://www.youtube.com/watch?v=_DhyVzHiKPU) |
| 4 | KairosTime | Pro Tier List | Mar 13, 2026 | 1.0x | [YouTube](https://www.youtube.com/watch?v=-fokXGGmD5s) |
| 5 | BobbyBS | Creator + 10 Pros | Mar 3, 2026 | 0.8x | [YouTube](https://www.youtube.com/watch?v=qpRBEf4Vs6Q) |
| 6 | HMBLE | Pro Team | Mar 12, 2026 | 0.8x | [YouTube](https://www.youtube.com/watch?v=dmqCRfwz3Zk) |
| 7 | Ash | Creator | Mar 2, 2026 | 0.7x | [YouTube](https://www.youtube.com/watch?v=Pjynn47AoNg) |
| 8 | Driffle | Editorial | Mar 2026 | 0.4x | [driffle.com](https://driffle.com/blog/brawl-stars-tier-list/) |
| 9 | BrawlTime Votes | Community (312K Votes) | Mar 16, 2026 | 0.3x | [brawltime.ninja](https://brawltime.ninja/tier-list/brawler) |

---

## Detailed Source Breakdown

### 1. Noff.gg — Data, Top 200 + Ranked (1.5x)

**What it is:** Noff.gg tracks performance statistics for the top 200 players globally and across Ranked Mode, producing tier lists based on pick rates, win rates, and usage trends. BrawlRank combines both data slices (Top 200 and Ranked) into a single averaged rating per brawler.

**Why 1.5x:** Pure performance data from top-level play is the most objective input available. It reveals what the best players are actually winning with, free from personal bias or content incentives. It earns the highest weight because empirical data is verifiable and reproducible. The combined scope (Top 200 + Ranked) gives the broadest statistical view of any single source.

**Data and methodology:**
- Win rate and pick rate data from the global top 200 leaderboard
- Ranked Mode performance data across broader skill tiers
- Performance tracked across game modes
- Automated, regularly refreshed statistical snapshots

---

### 2. MmonsteR — Data, Top 200 (1.3x)

**What it is:** MmonsteR provides an independent data-driven meta analysis focused on upper-skill performance, using a separate data pipeline from Noff.gg.

**Why 1.3x:** Having two independent data sources helps validate statistical trends. If both Noff and MmonsteR agree a brawler is strong, it's almost certainly reflected in actual high-level play. MmonsteR earns 1.3x (slightly below Noff's 1.5x) because it covers a single data slice (Top 200 only) compared to Noff's combined view.

**Data and methodology:**
- Top 200 player performance modeling
- Usage rates and success metrics across patches
- Patch-cycle trend tracking to detect rising or falling brawlers

---

### 3. SpenLC — Pro Player (1.0x)

**What it is:** SpenLC is an active professional Brawl Stars player competing at the championship level. His tier list reflects first-hand experience from scrims, tournament drafts, and top-ladder play.

**Why 1.0x:** As someone who plays against other pros daily, SpenLC captures nuances that pure data can miss: which brawlers are being practiced in scrims, which fall apart against coordinated teams, and which are overhyped. However, even expert opinion is inherently subjective and can reflect individual playstyle preferences. The 1.0x weight respects this expertise while keeping data sources as the primary signal.

**Data and methodology:**
- First-hand competitive play (scrims, tournaments, ranked)
- Draft priority and ban-rate intuition from actual competitive matches
- Matchup knowledge from direct gameplay

---

### 4. KairosTime — Pro Tier List (1.0x)

**What it is:** KairosTime is one of the longest-running and most recognized Brawl Stars content creators. His tier lists are built in collaboration with top competitive players and are framed around high-level ranked and tournament play.

**Why 1.0x:** KairosTime's lists benefit from both competitive consultation and years of meta tracking. His methodology is transparent — he explains tier placements with matchup reasoning and mode context. However, as a content creator synthesizing pro input, there is an editorial layer between raw competitive insight and the final list, keeping the weight at 1.0x rather than higher.

**Data and methodology:**
- Direct collaboration with competitive players and coaches
- Scrim results and high-level ranked performance
- Patch-adjusted matchup and composition analysis
- Per-brawler reasoning with mode-specific context

---

### 5. BobbyBS — Creator + 10 Pros (0.8x)

**What it is:** BobbyBS creates tier lists informed by direct input from roughly 10 professional players, giving his list a crowd-sourced competitive edge.

**Why 0.8x:** Despite incorporating pro opinions, BobbyBS acts as the curator and presenter, introducing an editorial layer between the raw pro input and the final list. The pro input adds credibility, but because BobbyBS synthesizes and interprets that input rather than presenting raw data, the weight is set below direct pro sources.

**Data and methodology:**
- Aggregated feedback from ~10 professional players
- Consensus-driven placement rather than single-analyst opinion
- High-level mode and map discussions informing tier decisions

---

### 6. HMBLE — Pro Team (0.8x)

**What it is:** HMBLE is a professional Brawl Stars esports team. Their tier list reflects the team's internal competitive perspective, shaped by coordinated scrims and team composition testing.

**Why 0.8x:** Pro team perspectives carry genuine competitive authority but evaluate brawlers through the lens of coordinated 3v3 team play, which can differ significantly from solo queue or ladder. A brawler that excels in a practiced team composition might be mediocre in random matchmaking (and vice versa). The 0.8x weight accounts for this team-play bias.

**Data and methodology:**
- Internal team scrim results and composition testing
- Input from multiple pro team members
- Emphasis on team synergy and coordinated play viability

---

### 7. Ash — Creator (0.7x)

**What it is:** Ash is a well-known Brawl Stars content creator who produces regular tier lists focused on practical ranked and ladder play.

**Why 0.7x:** Ash provides a solid, reliable perspective grounded in extensive gameplay and content creation experience. However, as a single analyst without formal competitive tournament involvement or pro consultation, his lists carry less authority than pro-sourced or data-driven inputs. The 0.7x weight includes this perspective while keeping it proportional to its evidentiary strength.

**Data and methodology:**
- Single-analyst perspective with deep game knowledge
- Current patch testing and match review
- Focus on ranked ladder viability across trophy ranges

---

### 8. Driffle — Editorial (0.4x)

**What it is:** Driffle publishes an editorial tier list aimed at a broad audience, synthesizing publicly available meta information into an accessible format.

**Why 0.4x:** Editorial sources capture the "mainstream meta" — what the wider community believes is strong — but tend to lag behind the competitive meta, rely on secondary sources rather than original data or gameplay, and prioritize readability over precision. The 0.4x weight includes this perspective without letting it distort more authoritative signals.

**Data and methodology:**
- Editorial analysis synthesizing publicly available tier lists and meta discussion
- Aimed at general/mainstream players rather than competitive specialists
- Cross-source synthesis rather than original data or gameplay

---

### 9. BrawlTime Votes — Community, 312K Votes (0.3x)

**What it is:** BrawlTime Ninja hosts a community voting system where any player can rate brawlers. With over 312,000 votes, it represents the largest sample size of any source in BrawlRank.

**Why 0.3x:** The massive sample size makes this source statistically robust for measuring *community perception*, but community perception and competitive reality often diverge. Casual players may overrate brawlers that are fun or frustrating to face, and underrate brawlers that require high skill to unlock their potential. The 0.3x weight — the lowest in BrawlRank — keeps this "popularity check" in the blend without letting it distort rankings that should reflect competitive viability.

**Data and methodology:**
- 312,000+ individual community votes (largest sample of any source)
- Open participation — any player can vote regardless of skill level
- Reflects broad player sentiment and perceived meta strength
- Updated continuously as new votes come in

---

## Why These 9 Sources?

BrawlRank's source selection covers three distinct perspectives on the meta, weighted by objectivity:

| Perspective | Sources | Weight Range | Total Weight | Share | What it captures |
| --- | --- | --- | --- | --- | --- |
| **Statistical data** | Noff.gg, MmonsteR | 1.3x–1.5x | 2.8 | **37%** | How the meta *actually plays out* in verifiable win/pick rate data |
| **Competitive opinion** | SpenLC, KairosTime, BobbyBS, HMBLE, Ash | 0.7x–1.0x | 4.3 | **56%** | How the best players and analysts *think* the meta looks |
| **Community sentiment** | Driffle, BrawlTime Votes | 0.3x–0.4x | 0.7 | **9%** | How the *broader playerbase* perceives brawler strength |

Data sources earn the highest per-source weight because empirical performance data is the most objective measure available. Competitive opinion contributes the most total weight because five independent expert perspectives provide valuable coverage of nuances data cannot capture. Community sources serve as a minimal "pulse check" to flag brawlers where perception diverges dramatically from expert and data assessment.

No single perspective is complete on its own. Data can be misleading without context (sample size issues for niche brawlers, meta shifts not yet reflected in statistics). Pro opinions capture emerging trends but carry subjective bias. Community votes reflect perception, not reality. By blending all three with objectivity-driven weights, BrawlRank produces a tier list anchored in empirical evidence and corrected by expert judgment.
```

---

## Execution Order

Execute changes in this order to avoid line number shifts from invalidating subsequent references:

1. **`sources.md`** — Change 19 (complete rewrite, no line dependencies)
2. **`styles.css`** — Change 18 (insert new CSS, no impact on other files)
3. **`index.html`** — Changes 11–17 (work bottom-to-top to preserve line numbers: 17 → 16 → 15 → 14 → 13 → 12 → 11)
4. **`app.js`** — Changes in this order:
   1. Change 10 (line 280 — add disagreement display in modal)
   2. Change 9 (lines 249–261 — merged Noff in modal source list)
   3. Change 8 (line 128 — add `calculateAllScores()` call)
   4. Change 7 (insert after line 94 — new calculation functions)
   5. Change 6 (lines 79–85 — fix D threshold)
   6. Change 5 (lines 16–67 — replace SOURCE_DETAILS)
   7. Change 4 (lines 3–14 — replace SOURCE_WEIGHTS)
   8. Change 3 (line 1 — remove Noff Ranked from sources array)
   9. Change 2 (line 1 — update Noff.gg type)
   10. Change 1 (line 1 — total_sources 10→9)

> **Why bottom-to-top for app.js:** Editing later lines first preserves the line numbers of earlier lines, so each "Find" string remains at its documented location.

---

## Verification Checklist

After executing all changes, verify:

- [ ] Open the site in a browser — no console errors
- [ ] Tier list renders with recalculated scores (scores will differ from before)
- [ ] Click any brawler → modal shows:
  - [ ] Updated score (different from old pre-baked value)
  - [ ] "Source agreement" indicator (Strong/Moderate/Weak with σ value)
  - [ ] "Noff.gg" appears once (not twice) in source breakdown
  - [ ] Source count says the correct number (max 9)
- [ ] Click "Sources" button → popup shows 9 sources (not 10)
- [ ] Click weight button on any source → detail popup shows updated weight and explanation
- [ ] Sources grid below tier list shows 9 cards
- [ ] Methodology section shows updated thresholds (D >= 1.5) and new weights
- [ ] F tier may now contain brawlers (previously empty because D threshold was 1.8)
- [ ] Spot-check a brawler with both Noff.gg and Noff Ranked ratings (e.g., Bibi: both S → merged S) — the merged rating in the modal should be the average rounded to nearest tier
- [ ] Spot-check a brawler with divergent sources (e.g., Poco: HMBLE=S but Noff/Driffle=F) — should show "Weak consensus" indicator
- [ ] Header says "9 sources" not "10 sources"
- [ ] Browser tab title unchanged ("BrawlRank — The Meta, Averaged")

---

## What This Plan Does NOT Change

These were considered but intentionally excluded to keep scope manageable:

1. **Recency weighting** — Sources span March 2–16 (14 days). A recency decay could improve accuracy but adds complexity for a small window. Consider for a future update when source dates span > 3 weeks.
2. **Nonlinear tier scoring** — The S=6...F=1 linear scale assumes equal gaps between tiers. A nonlinear scale (e.g., S=10, A=7, B=5...) would better reflect competitive reality but requires retuning all thresholds. Consider as a v3 change.
3. **Confidence penalty for missing sources** — Brawlers with fewer sources have implicitly wider confidence intervals but are presented the same. Flagging low-source-count brawlers (e.g., 8-Bit with only 6 sources) is a good future addition.
4. **Per-mode tier lists** — The current system blends all modes. Mode-specific tiers would be more useful but require mode-specific data from all sources, which most don't provide.
