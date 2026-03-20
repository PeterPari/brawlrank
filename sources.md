# BrawlRank Sources

BrawlRank aggregates 9 independent sources to produce a single blended tier list for every brawler in Brawl Stars. This document explains each source, how it's weighted, and why.

---

## How the Blending Works

Each source assigns brawlers a tier (S through F). These tiers are converted to numerical scores, multiplied by that source's weight, and averaged to produce a final score per brawler. That final score maps back to a tier:

| Tier Score | Tier |
| --- | --- |
| S = 6 | S |
| A = 5 | A |
| B = 4 | B |
| C = 3 | C |
| D = 2 | D |
| F = 1 | F |

| Final Score Range | Assigned Tier |
| --- | --- |
| ≥ 5.5 | S |
| ≥ 4.5 | A |
| ≥ 3.5 | B |
| ≥ 2.5 | C |
| ≥ 1.5 | D |
| < 1.5 | F |

### Worked Example

Suppose a brawler receives the following ratings from 4 sources:

| Source | Tier | Score | Weight | Weighted Score |
| --- | --- | --- | --- | --- |
| Noff.gg | S | 6 | 1.5x | 9.0 |
| MmonsteR | A | 5 | 1.3x | 6.5 |
| SpenLC | S | 6 | 1.0x | 6.0 |
| Ash | A | 5 | 0.7x | 3.5 |

**Weighted average** = (9.0 + 6.5 + 6.0 + 3.5) / (1.5 + 1.3 + 1.0 + 0.7) = 25.0 / 4.5 = **5.56 → S tier**

Only sources that actually rate a given brawler contribute to that brawler's score. If a source doesn't cover a brawler, it's excluded from both the numerator and denominator — it doesn't count as a zero.

### Source Agreement (Disagreement Metric)

BrawlRank calculates the **standard deviation (σ)** of raw source scores for each brawler. This measures how much sources agree, independent of weights:

| σ Range | Label | What it means |
| --- | --- | --- |
| < 0.80 | Strong consensus | Sources broadly agree — the tier is reliable |
| 0.80–1.49 | Moderate consensus | Some disagreement between source types — tier is directionally correct but debatable |
| ≥ 1.50 | Weak consensus | Sources disagree significantly — the tier should be interpreted with caution |

The disagreement metric uses **unweighted** scores (each source counts equally) so that it reflects genuine disagreement rather than being dampened by low-weight sources. For example, if data sources rate a brawler S but community sources rate it C, that real disagreement will show up even though the community weight is low.

**Example:** A brawler rated S (6) by two sources and C (3) by two others has a mean of 4.5 and σ ≈ 1.50 — that's "Weak consensus," signaling that the final tier (likely A or B) masks a genuine split in opinion.

---

## Weight Philosophy

BrawlRank's weighting system is designed for **maximum objectivity**. Weights range from 0.3x to 1.5x (a 5:1 ratio) based on one core principle: **empirical data is more objective than human opinion**.

1. **Data sources receive the highest weights** (1.3x–1.5x) — Performance statistics from top-level play are verifiable, reproducible, and free from personal bias. They measure what players actually win with, not what anyone thinks is strong.
2. **Pro player and creator sources receive moderate weights** (0.7x–1.0x) — Expert opinion is valuable for capturing nuances that data misses (draft priority, team synergy, emerging trends), but it is inherently subjective and can reflect individual playstyle biases.
3. **Community and editorial sources receive the lowest weights** (0.3x–0.4x) — These reflect popular perception, which often diverges from competitive reality. They serve as a minimal "pulse check" but should not drive the ranking.

This data-first approach means the final tier list is anchored in measurable performance, with human judgment as a corrective lens rather than the primary signal.

### Previous Weight System (Pre-Overhaul)

Before the objectivity overhaul, BrawlRank used a narrower 2:1 weight range (0.6x–1.2x) where most sources clustered near 1.0x. Pro players like SpenLC and KairosTime received the highest weights (1.2x) based on "competitive authority," while data sources sat at the same 1.0x baseline as most creators. This meant subjective expert opinion had more influence than empirical performance data.

The overhaul inverted this: data now leads, opinion corrects. The wider 5:1 ratio ensures that the weight difference between source types is meaningful rather than cosmetic.

### Noff.gg Source Merge

Noff.gg provides two data slices: Top 200 leaderboard performance and Ranked Mode statistics. In earlier versions of BrawlRank, these were treated as two separate sources with independent weights (1.0x and 0.8x). This gave Noff a combined weight of 1.8x — more influence than any other single entity — while also introducing correlated data from the same pipeline.

BrawlRank now merges these into a single source. When both data slices are available for a brawler, their tier scores are averaged into one value before weighting. For example, if Noff Top 200 rates a brawler S (6) and Noff Ranked rates it A (5), the merged score is 5.5, which maps to tier S. This prevents double-counting while preserving the breadth of Noff's data coverage.

When only one Noff slice covers a brawler (e.g., a brawler is too niche for the Top 200 but appears in Ranked), that single slice is used as-is.

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
| **Statistical data** | Noff.gg, MmonsteR | 1.3x–1.5x | 2.8 | **36%** | How the meta *actually plays out* in verifiable win/pick rate data |
| **Competitive opinion** | SpenLC, KairosTime, BobbyBS, HMBLE, Ash | 0.7x–1.0x | 4.3 | **55%** | How the best players and analysts *evaluate* the meta |
| **Community sentiment** | Driffle, BrawlTime Votes | 0.3x–0.4x | 0.7 | **9%** | How the *broader playerbase* perceives brawler strength |
| **Total** | **9 sources** | **0.3x–1.5x** | **7.8** | **100%** | |

Data sources earn the highest per-source weight (1.4x average) because empirical performance data is the most objective measure available. Competitive opinion contributes the most total weight because five independent expert perspectives provide valuable coverage of nuances data cannot capture — but each individual opinion source is weighted below data. Community sources serve as a minimal "pulse check" to flag brawlers where perception diverges dramatically from expert and data assessment.

No single perspective is complete on its own:
- **Data** can be misleading without context — sample size issues for niche brawlers, meta shifts not yet reflected in statistics, and the inability to account for draft context or team composition.
- **Pro opinions** capture emerging trends and competitive nuance but carry subjective bias, individual playstyle preferences, and potential content incentives.
- **Community votes** reflect perception, not reality — fun or frustrating brawlers get overrated, high-skill-ceiling brawlers get underrated.

By blending all three with objectivity-driven weights, BrawlRank produces a tier list anchored in empirical evidence and corrected by expert judgment.

---

## Known Limitations

These are known limitations of the current system, intentionally scoped out for now:

1. **No recency weighting** — All sources are treated equally regardless of publication date. Sources currently span March 2–16 (14 days). A recency decay could improve accuracy when sources span longer windows (3+ weeks), but adds complexity for a small date range.

2. **Linear tier scoring** — The S=6 through F=1 scale assumes equal gaps between tiers. In competitive reality, the gap between S and A tier is often larger than the gap between C and D. A nonlinear scale (e.g., S=10, A=7, B=5, C=3, D=2, F=1) would better reflect this but requires retuning all thresholds.

3. **No confidence penalty for missing sources** — Brawlers covered by fewer sources have implicitly wider uncertainty, but are displayed identically to brawlers covered by all 9. The disagreement metric partially addresses this, but a dedicated "low coverage" flag would be more explicit.

4. **No per-mode tier lists** — The current system blends all game modes into a single ranking. Mode-specific tiers (e.g., Gem Grab vs. Brawl Ball) would be more useful, but most sources don't provide mode-specific data.

5. **Single-meta snapshot** — BrawlRank reflects a point-in-time snapshot. It does not track how brawler tiers change over time or across patches. Historical trend data would add valuable context for understanding whether a brawler is rising, falling, or stable.
