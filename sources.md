# BrawlRank Sources

BrawlRank aggregates 10 independent sources to produce a single blended tier list for every brawler in Brawl Stars. This document explains each source, how it's weighted, and why.

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

### Weight Philosophy

Not all sources carry equal authority. Weights range from 0.6x to 1.2x based on three factors:

1. **Expertise depth** — Pro players and analysts who compete at the highest level understand matchups, draft priority, and composition synergy in ways that casual play cannot reveal.
2. **Data quality** — Sources backed by large statistical samples (top 200 leaderboard data, 300K+ community votes) provide objectivity that opinion alone cannot.
3. **Independence** — Sources that rely on distinct methodologies (data vs. opinion vs. crowd vote) reduce the risk of groupthink when blended together.

Sources with higher competitive authority (active pro players, pro-consulted lists) receive up to 1.2x. Sources with broader but shallower methodology (editorial roundups, community polls) receive 0.6x–0.7x to prevent popular sentiment from overriding competitive insight.

---

## Source Overview

| # | Source | Type | Date | Weight | Link |
| --- | --- | --- | --- | --- | --- |
| 1 | KairosTime | Pro Tier List | Mar 13, 2026 | 1.2x | [YouTube](https://www.youtube.com/watch?v=-fokXGGmD5s) |
| 2 | SpenLC | Pro Player | Mar 6, 2026 | 1.2x | [YouTube](https://www.youtube.com/watch?v=_DhyVzHiKPU) |
| 3 | Ash | Creator | Mar 2, 2026 | 1.0x | [YouTube](https://www.youtube.com/watch?v=Pjynn47AoNg) |
| 4 | BobbyBS | Creator + 10 Pros | Mar 3, 2026 | 1.0x | [YouTube](https://www.youtube.com/watch?v=qpRBEf4Vs6Q) |
| 5 | Noff.gg | Data (Top 200) | Mar 16, 2026 | 1.0x | [noff.gg](https://www.noff.gg/brawl-stars/tier-list) |
| 6 | MmonsteR | Data (Top 200) | Mar 6, 2026 | 1.0x | [mmonster.co](https://mmonster.co/blog/brawl-stars-meta) |
| 7 | HMBLE | Pro Team | Mar 12, 2026 | 0.9x | [YouTube](https://www.youtube.com/watch?v=dmqCRfwz3Zk) |
| 8 | Noff Ranked | Data (Ranked Mode) | Mar 16, 2026 | 0.8x | [noff.gg](https://www.noff.gg/brawl-stars/tier-list) |
| 9 | Driffle | Editorial | Mar 2026 | 0.7x | [driffle.com](https://driffle.com/blog/brawl-stars-tier-list/) |
| 10 | BrawlTime Votes | Community (312K Votes) | Mar 16, 2026 | 0.6x | [brawltime.ninja](https://brawltime.ninja/tier-list/brawler) |

---

## Detailed Source Breakdown

### 1. KairosTime — Pro Tier List (1.2x)

**What it is:** KairosTime is one of the longest-running and most recognized Brawl Stars content creators. His tier lists are built in collaboration with top competitive players and are framed around high-level ranked and tournament play. He consistently updates per balance patch and explains reasoning per brawler.

**Why 1.2x:** KairosTime's lists benefit from both competitive consultation and years of meta tracking. His methodology is transparent — he explains tier placements with matchup reasoning and mode context, not just gut feel. The competitive framing and consistent track record of accuracy earn the highest weight tier.

**Data and methodology:**
- Direct collaboration with competitive players and coaches
- Scrim results and high-level ranked performance
- Patch-adjusted matchup and composition analysis
- Per-brawler reasoning with mode-specific context

---

### 2. SpenLC — Pro Player (1.2x)

**What it is:** SpenLC is an active professional Brawl Stars player competing at the championship level. His tier list reflects first-hand experience from scrims, tournament drafts, and top-ladder play — not second-hand analysis.

**Why 1.2x:** As someone who plays against other pros daily, SpenLC's perspective captures nuances that data and creator opinions can miss: which brawlers are being quietly practiced in scrims, which ones fall apart against coordinated teams, and which are overhyped. Active pro players receive the highest weight because their tier judgments are tested in the most demanding environment the game offers.

**Data and methodology:**
- First-hand competitive play (scrims, tournaments, ranked)
- Draft priority and ban-rate intuition from actual competitive matches
- Matchup knowledge from direct gameplay, not just theory

---

### 3. Ash — Creator (1.0x)

**What it is:** Ash is a well-known Brawl Stars content creator who produces regular tier lists focused on practical ranked and ladder play. His content targets players who want to climb effectively rather than those playing at the professional level.

**Why 1.0x:** Ash provides a solid, reliable perspective grounded in extensive gameplay and content creation experience. While he doesn't carry the competitive tournament pedigree of pro players (hence not 1.2x), his consistency and focus on practical viability make him a strong baseline source. His lists tend to be well-calibrated for the experience of skilled non-pro players.

**Data and methodology:**
- Single-analyst perspective with deep game knowledge
- Current patch testing and match review
- Focus on ranked ladder viability across trophy ranges

---

### 4. BobbyBS — Creator + 10 Pros (1.0x)

**What it is:** BobbyBS creates tier lists informed by direct input from roughly 10 professional players. This gives his list a crowd-sourced competitive edge — it's not just one person's opinion, but a consensus view from multiple high-level players.

**Why 1.0x:** Despite incorporating pro opinions, BobbyBS acts as the curator and presenter, which introduces an editorial layer between the raw pro input and the final list. The pro input adds credibility, but because BobbyBS synthesizes and interprets that input rather than presenting raw data, the weight stays at 1.0x rather than receiving the 1.2x multiplier reserved for direct pro sources.

**Data and methodology:**
- Aggregated feedback from ~10 professional players
- Consensus-driven placement rather than single-analyst opinion
- High-level mode and map discussions informing tier decisions

---

### 5. Noff.gg — Data, Top 200 (1.0x)

**What it is:** Noff.gg tracks performance statistics for the top 200 players globally, producing tier lists based on pick rates, win rates, and usage trends among the best players in the game.

**Why 1.0x:** Pure data from top-level play is one of the most objective inputs available. It reveals what the best players are actually winning with, free from personal bias or content incentives. It earns 1.0x (not higher) because raw statistics can miss context — a brawler might have a high win rate because only experts play it, or a low win rate because it's new and people are still learning it. Data is essential but needs to be blended with human judgment.

**Data and methodology:**
- Win rate and pick rate data from the global top 200 leaderboard
- Performance tracked across game modes
- Automated, regularly refreshed statistical snapshots

---

### 6. MmonsteR — Data, Top 200 (1.0x)

**What it is:** MmonsteR provides a data-driven meta analysis focused on upper-skill performance, similar to Noff.gg but from an independent data pipeline and presentation.

**Why 1.0x:** Having two independent top-200 data sources helps validate statistical trends. If both Noff and MmonsteR agree a brawler is strong, it's almost certainly reflected in actual high-level play. MmonsteR earns the same 1.0x as Noff because it uses a comparable methodology and skill tier. The redundancy is intentional — it increases confidence in data-backed placements.

**Data and methodology:**
- Top 200 player performance modeling
- Usage rates and success metrics across patches
- Patch-cycle trend tracking to detect rising or falling brawlers

---

### 7. HMBLE — Pro Team (0.9x)

**What it is:** HMBLE is a professional Brawl Stars esports team. Their tier list reflects the team's internal competitive perspective, shaped by coordinated scrims and team composition testing.

**Why 0.9x:** Pro team perspectives are valuable but carry a specific bias: they evaluate brawlers through the lens of coordinated 3v3 team play, which can differ significantly from solo queue or ladder. A brawler that excels in a practiced team composition might be mediocre in random matchmaking (and vice versa). The slight reduction to 0.9x accounts for this team-play bias while still recognizing the competitive authority of active pros.

**Data and methodology:**
- Internal team scrim results and composition testing
- Input from multiple pro team members (not a single player's view)
- Emphasis on team synergy and coordinated play viability

---

### 8. Noff Ranked — Data, Ranked Mode (0.8x)

**What it is:** A separate data slice from Noff.gg that focuses specifically on Ranked Mode performance across a broader skill range, rather than only the top 200.

**Why 0.8x:** Ranked mode data captures a wider population than top-200 data, which means it better reflects the average competitive player's experience. However, this breadth comes at the cost of depth — it includes players at many skill levels, diluting the signal from the highest-level play. The 0.8x weight balances its value as a ranked-specific lens against the noise introduced by the wider sample. It also partially overlaps with the Noff.gg top-200 source, so a lower weight avoids double-counting Noff's influence.

**Data and methodology:**
- Win rate and pick rate data filtered to Ranked Mode
- Broader skill range than top-200 sources
- Role and mode-specific outcome tracking
- Regularly refreshed with recent ranked seasons

---

### 9. Driffle — Editorial (0.7x)

**What it is:** Driffle publishes an editorial tier list aimed at a broad audience, synthesizing publicly available meta information into an accessible format. It reads more like a guide than a raw competitive ranking.

**Why 0.7x:** Editorial sources play a useful role in capturing the "mainstream meta" — what the wider community believes is strong. However, editorial lists tend to lag behind the competitive meta, rely on secondary sources rather than original data or gameplay, and prioritize readability over precision. The 0.7x weight includes this perspective without letting it override more authoritative sources.

**Data and methodology:**
- Editorial analysis synthesizing publicly available tier lists and meta discussion
- Aimed at general/mainstream players rather than competitive specialists
- Cross-source synthesis rather than original data or gameplay

---

### 10. BrawlTime Votes — Community, 312K Votes (0.6x)

**What it is:** BrawlTime Ninja hosts a community voting system where any player can rate brawlers. With over 312,000 votes, it represents the largest sample size of any source in BrawlRank.

**Why 0.6x:** The massive sample size makes this source statistically robust for measuring *community perception*, but community perception and competitive reality often diverge. Casual players may overrate brawlers that are fun or frustrating to face, and underrate brawlers that require high skill to unlock their potential. The 0.6x weight — the lowest in BrawlRank — keeps this "popularity check" in the blend without letting it distort rankings that should reflect competitive viability. Despite the low weight, this source is valuable: if a brawler is rated highly by both pros and 312K community voters, that's a strong signal.

**Data and methodology:**
- 312,000+ individual community votes (largest sample of any source)
- Open participation — any player can vote regardless of skill level
- Reflects broad player sentiment and perceived meta strength
- Updated continuously as new votes come in

---

## Why These 10 Sources?

BrawlRank's source selection is designed to cover three distinct perspectives on the meta:

| Perspective | Sources | What it captures |
| --- | --- | --- |
| **Competitive opinion** | KairosTime, SpenLC, HMBLE, BobbyBS, Ash | How the best players and most experienced analysts *think* the meta looks |
| **Statistical data** | Noff.gg, MmonsteR, Noff Ranked | How the meta *actually plays out* in win/pick rate data |
| **Community sentiment** | BrawlTime Votes, Driffle | How the *broader playerbase* perceives brawler strength |

No single perspective is complete on its own. Pros can have blind spots. Data can be misleading without context. Community votes reflect perception, not reality. By blending all three with appropriate weights, BrawlRank produces a tier list that is more accurate and well-rounded than any individual source.
