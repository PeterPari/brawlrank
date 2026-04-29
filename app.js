let TIER_DATA;
let DISPLAY_TIERS = createEmptyTiers();

const brawlerMap = {};

const SOURCE_WEIGHTS = {
  'Noff.gg': 1.5,
  MmonsteR: 1.3,
  SpenLC: 1.0,
  KairosTime: 1.0,
  BobbyBS: 0.8,
  HMBLE: 0.8,
  Ash: 0.7,
  Driffle: 0.4,
  'BrawlTime Votes': 0.3
};

// Recency decay configuration
const RECENCY_THRESHOLD_DAYS = 15; // Days before decay starts
const RECENCY_DECAY_RATE = 7; // Half-life in days after threshold

/**
 * Parse a date string from the sources data.
 * Handles formats: "April 26, 2026", "April 2026", and standard date strings.
 * Returns the last day of the month if only month/year is provided.
 */
function parseSourceDate(dateStr) {
  if (!dateStr) return null;

  // Try parsing as full date first (e.g., "April 26, 2026")
  let date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date;
  }

  // Try parsing as month-year only (e.g., "April 2026")
  // Use the last day of that month as the most generous interpretation
  const monthYearMatch = dateStr.match(/^(\w+)\s+(\d{4})$/);
  if (monthYearMatch) {
    const monthName = monthYearMatch[1];
    const year = parseInt(monthYearMatch[2]);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = monthNames.indexOf(monthName);
    if (monthIndex !== -1) {
      // Get the last day of the month
      const lastDay = new Date(year, monthIndex + 1, 0);
      return lastDay;
    }
  }

  return null;
}

/**
 * Calculate the effective weight for a source based on its age.
 * Sources older than RECENCY_THRESHOLD_DAYS get exponentially less weight.
 * Uses half-life decay: weight = baseWeight * 2^(-daysAfterThreshold / halfLife)
 */
function getRecencyAdjustedWeight(baseWeight, sourceDateStr, referenceDate) {
  const sourceDate = parseSourceDate(sourceDateStr);
  if (!sourceDate || !referenceDate) return baseWeight;

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysOld = Math.max(0, Math.floor((referenceDate - sourceDate) / msPerDay));

  if (daysOld <= RECENCY_THRESHOLD_DAYS) {
    return baseWeight; // No decay for recent sources
  }

  const daysAfterThreshold = daysOld - RECENCY_THRESHOLD_DAYS;
  const decayFactor = Math.pow(2, -daysAfterThreshold / RECENCY_DECAY_RATE);

  return baseWeight * decayFactor;
}

/**
 * Get the effective weight for a source, applying recency decay.
 */
function getEffectiveWeight(sourceName, referenceDate) {
  const baseWeight = SOURCE_WEIGHTS[sourceName] || 1.0;

  if (!TIER_DATA || !TIER_DATA.sources) return baseWeight;

  const source = TIER_DATA.sources.find(s => s.name === sourceName);
  if (!source || !source.date) return baseWeight;

  return getRecencyAdjustedWeight(baseWeight, source.date, referenceDate);
}

const SOURCE_DETAILS = {
  'Noff.gg': {
    whatItIs: 'A fully automated data pipeline that tracks performance statistics for the top 200 players globally and across Ranked Mode. No human analyst is involved — tiers are derived directly from win rates, pick rates, and usage trends at the highest levels of play. BrawlRank merges both Noff data slices (Top 200 + Ranked) into a single averaged rating per brawler.',
    whyWeight: 'Weighted at 1.5x — the highest in BrawlRank — because automated performance data is free from personal bias or content incentives. It measures what the best players are actually winning with, not what anyone thinks is strong. Previously Noff was split into two separate sources (1.0x + 0.8x = 1.8x combined); merging them prevents double-counting while preserving their full data coverage.',
    uses: ['Win rate and pick rate data from the global Top 200 leaderboard', 'Ranked Mode performance data across multiple skill tiers', 'Brawler usage trends tracked across game modes', 'Automated statistical snapshots refreshed regularly', 'Two independent data slices averaged into one merged rating']
  },
  MmonsteR: {
    whatItIs: 'An independent data-driven meta analysis focused on upper-skill player performance, built on a separate data pipeline from Noff.gg. It produces tier assessments based on how brawlers perform among high-level players, functioning as a second empirical check on the competitive meta.',
    whyWeight: 'Weighted at 1.3x as an independent data source — slightly below Noff\'s 1.5x because it covers only Top 200 (no Ranked Mode slice). When two independent data pipelines agree on a brawler\'s strength, that corroboration significantly increases confidence in the placement. Disagreement between Noff and MmonsteR is a reliable signal that a brawler\'s tier is genuinely uncertain.',
    uses: ['Independent Top 200 performance modeling', 'Brawler usage rates and win metrics across patches', 'Patch-cycle trend tracking to detect rising or falling brawlers', 'Separate data pipeline from Noff.gg — no shared methodology']
  },
  SpenLC: {
    whatItIs: 'An active professional Brawl Stars player competing at the championship level. His tier list is built from first-hand competitive experience — scrims, tournament drafts, and top-ladder play — capturing nuances that pure statistics can miss, such as which brawlers are being practiced in pro scrims or which collapse under coordinated pressure.',
    whyWeight: 'Weighted at 1.0x — pro expertise is highly valuable, but opinion is inherently subjective. Players naturally rate brawlers they are personally comfortable with more favorably, and competitive intuition can lag behind a shifting meta. No source gets a weight bonus for being a high-profile personality.',
    uses: ['First-hand scrim and tournament gameplay at championship level', 'Draft priority and ban-rate intuition from actual competitive matches', 'Matchup knowledge built from direct high-level play', 'Awareness of which brawlers are being practiced vs. avoided in pro circles']
  },
  KairosTime: {
    whatItIs: 'One of the longest-running Brawl Stars content creators, producing tier lists in direct collaboration with competitive players and coaches. His methodology is notably transparent — he publicly explains individual tier placements with matchup reasoning and mode context, making his assessments easier to evaluate and cross-check.',
    whyWeight: 'Weighted at 1.0x — benefits from pro consultation and years of meta tracking, but remains an opinion-based assessment filtered through a content creator. There is an editorial layer between the raw competitive input and the final list, which introduces subjectivity even when the source material is strong.',
    uses: ['Direct collaboration with competitive players and coaches', 'Scrim results and high-level ranked performance context', 'Patch-adjusted matchup and team composition analysis', 'Per-brawler reasoning with mode-specific justifications']
  },
  BobbyBS: {
    whatItIs: 'A creator-curated tier list built with direct input from roughly 10 professional players. Rather than one person\'s opinion, BobbyBS gathers feedback from a range of pros and synthesizes it into placements — giving the list a crowd-sourced competitive edge compared to single-analyst creator lists.',
    whyWeight: 'Weighted at 0.8x — below direct pro sources at 1.0x. The pro input adds credibility, but BobbyBS acts as the curator: he synthesizes and interprets that input rather than presenting it raw. That editorial layer introduces a subjective filter between the pro opinions and the final tier placement.',
    uses: ['Aggregated input from ~10 professional players', 'Consensus-driven placement rather than single-analyst opinion', 'High-level mode and map strategy discussions', 'Cross-pro perspective on draft priority and matchups']
  },
  HMBLE: {
    whatItIs: 'A professional Brawl Stars esports team whose tier list reflects their internal competitive perspective, shaped by coordinated scrims and team composition testing. As a practicing pro team, their ratings reflect what works in organized 3v3 play rather than general ladder performance.',
    whyWeight: 'Weighted at 0.8x — genuine competitive authority, but with a significant caveat: pro teams evaluate brawlers through the lens of coordinated play. A brawler that dominates in a practiced team composition may be mediocre in solo queue (and vice versa). This team-play bias makes the list less universally applicable than individual pro assessments.',
    uses: ['Internal team scrim results and composition testing', 'Input from multiple HMBLE pro team members', 'Coordinated 3v3 team play viability as the primary lens', 'Emphasis on team synergy and draft-level decision making']
  },
  Ash: {
    whatItIs: 'A well-known Brawl Stars content creator who produces regular tier lists grounded in extensive personal gameplay experience. His lists focus on practical ranked and ladder viability — what actually works for skilled players grinding trophies — rather than theoretical pro-tournament meta.',
    whyWeight: 'Weighted at 0.7x — reliable and well-informed, but as a single analyst without competitive tournament involvement, pro consultation, or access to statistical data, his assessments carry less evidentiary weight than data-driven or pro-sourced inputs. A single person\'s experience, however deep, has a narrower sample than aggregate data or professional competition.',
    uses: ['Single-analyst perspective with deep game knowledge', 'Current patch testing and personal match review', 'Ranked ladder viability focus across a range of trophy levels', 'Practical "does this actually work?" framing over theoretical strength']
  },
  Driffle: {
    whatItIs: 'An editorial tier list published for a broad general audience, synthesizing publicly available meta information — other tier lists, community discussion, patch notes — into an accessible guide format. It does not use original data or competitive play as inputs.',
    whyWeight: 'Weighted at 0.4x — editorial lists are valuable as a mainstream-meta snapshot, but have two key limitations: they tend to lag the competitive meta by days or weeks (they rely on secondary sources), and they prioritize accessibility and readability over precision. Including it at a low weight adds a useful "what most players think" signal without letting it distort data-driven placements.',
    uses: ['Synthesis of publicly available tier lists and meta discussion', 'General/mainstream player framing rather than competitive specialist focus', 'Secondary source aggregation — no original data or gameplay input', 'Broad audience accessibility as the primary goal']
  },
  'BrawlTime Votes': {
    whatItIs: 'A community voting system hosted by BrawlTime Ninja where any player — regardless of skill level — can rate brawlers. With 312,000+ votes, it is the largest sample size of any source in BrawlRank by a wide margin. It measures community perception rather than competitive performance.',
    whyWeight: 'Weighted at 0.3x — the lowest in BrawlRank. Large sample size makes it statistically reliable for measuring what players *feel* about brawlers, but community perception and competitive reality frequently diverge. Fun-to-play or frustrating-to-face brawlers get overrated; brawlers with high skill ceilings get underrated until the playerbase learns to use them. This keeps the "popularity check" in the blend at minimal influence.',
    uses: ['312,000+ individual community votes — largest sample of any source', 'Open participation from all skill levels, not just top players', 'Reflects broad player sentiment and perceived meta strength', 'Continuously updated as new votes come in']
  }
};

const TIER_COLORS = {
  S: '#ff2d55',
  A: '#ff9500',
  B: '#ffcc00',
  C: '#34c759',
  D: '#5ac8fa',
  F: '#8e8e93'
};

const TIER_ORDER = ['S', 'A', 'B', 'C', 'D', 'F'];
const TIER_THRESHOLDS = {
  S: 5.5,
  A: 4.5,
  B: 3.5,
  C: 2.5,
  D: 1.5
};
const TIER_VALUES = { S: 6, A: 5, B: 4, C: 3, D: 2, F: 1 };

const tierContainer = document.getElementById('tierContainer');
const lastUpdated = document.getElementById('lastUpdated');
const sourceCountBadge = document.querySelector('.src-count');
const sourcesGrid = document.getElementById('sourcesGrid');
const searchInput = document.getElementById('searchInput');
const searchCount = document.getElementById('searchCount');
const overlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const modalContent = document.getElementById('modalContent');
const srcPopupOverlay = document.getElementById('sourcesPopupOverlay');
const srcPopupClose = document.getElementById('sourcesPopupClose');
const srcPopupList = document.getElementById('sourcesPopupList');
const sourceDetailOverlay = document.getElementById('sourceDetailOverlay');
const sourceDetailClose = document.getElementById('sourceDetailClose');
const sourceDetailContent = document.getElementById('sourceDetailContent');
const consentBanner = document.getElementById('consent');
const acceptBtn = document.getElementById('acceptBtn');
const SITE_REPO_URL = 'https://github.com/PeterPari/brawlrank';
const SITE_ISSUES_URL = 'https://github.com/PeterPari/brawlrank/issues';
const CONSENT_STORAGE_KEY = 'consent';
const CLARITY_PROJECT_ID = 'vwyrtsgbq7';

let activeModalMode = null;
let clarityLoaded = false;
let previouslyFocusedElement = null;

// Focus trapping for modals
function trapFocus(overlayEl) {
  previouslyFocusedElement = document.activeElement;
  const focusable = overlayEl.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  first.focus();
  overlayEl._trapHandler = (e) => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  overlayEl.addEventListener('keydown', overlayEl._trapHandler);
}

function releaseFocus(overlayEl) {
  if (overlayEl._trapHandler) {
    overlayEl.removeEventListener('keydown', overlayEl._trapHandler);
    overlayEl._trapHandler = null;
  }
  if (previouslyFocusedElement) {
    previouslyFocusedElement.focus();
    previouslyFocusedElement = null;
  }
}

var _consentMemory = false;
var _storage = null;
try { _storage = window['local' + 'Storage']; } catch (e) { /* sandboxed */ }

function hasAnalyticsConsent() {
  if (_consentMemory) return true;
  try {
    if (_storage && _storage.getItem(CONSENT_STORAGE_KEY) === '1') { _consentMemory = true; return true; }
  } catch (e) { /* sandboxed */ }
  return false;
}

function setAnalyticsConsent() {
  _consentMemory = true;
  try { if (_storage) _storage.setItem(CONSENT_STORAGE_KEY, '1'); } catch (e) { /* sandboxed */ }
}

function hideConsentBanner() {
  if (!consentBanner) return;

  consentBanner.hidden = true;
  document.body.classList.remove('consent-visible');
}

function showConsentBanner() {
  if (!consentBanner) return;

  consentBanner.hidden = false;
  document.body.classList.add('consent-visible');
}

function loadClarity() {
  if (clarityLoaded || document.querySelector('script[data-clarity="true"]')) {
    clarityLoaded = true;
    return;
  }

  window.clarity = window.clarity || function () {
    (window.clarity.q = window.clarity.q || []).push(arguments);
  };

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}`;
  script.dataset.clarity = 'true';
  document.head.appendChild(script);
  clarityLoaded = true;
}

function initAnalyticsConsent() {
  if (!consentBanner || !acceptBtn) return;

  if (hasAnalyticsConsent()) {
    hideConsentBanner();
    loadClarity();
    return;
  }

  showConsentBanner();
  acceptBtn.addEventListener('click', () => {
    setAnalyticsConsent();
    hideConsentBanner();
    loadClarity();
  }, { once: true });
}

async function loadTierData() {
  const response = await fetch('data.json', { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(`Unable to load tier data (${response.status})`);
  }

  return response.json();
}


function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createEmptyTiers() {
  return { S: [], A: [], B: [], C: [], D: [], F: [] };
}

function getTierFromScore(score) {
  if (score >= TIER_THRESHOLDS.S) return 'S';
  if (score >= TIER_THRESHOLDS.A) return 'A';
  if (score >= TIER_THRESHOLDS.B) return 'B';
  if (score >= TIER_THRESHOLDS.C) return 'C';
  if (score >= TIER_THRESHOLDS.D) return 'D';
  return 'F';
}

/**
 * Get the reference date for recency calculations.
 * Uses the most recent source date as the reference point.
 */
function getReferenceDate() {
  if (!TIER_DATA || !TIER_DATA.sources) return new Date();

  let latestDate = null;
  TIER_DATA.sources.forEach((src) => {
    const date = parseSourceDate(src.date);
    if (date && (!latestDate || date > latestDate)) {
      latestDate = date;
    }
  });

  return latestDate || new Date();
}

/**
 * Get the effective weight for a source, optionally showing recency decay info.
 * Returns an object with base weight, effective weight, and decay info.
 */
function getSourceWeightInfo(sourceName, referenceDate) {
  const baseWeight = SOURCE_WEIGHTS[sourceName] || 1.0;

  if (!TIER_DATA || !TIER_DATA.sources) {
    return { baseWeight, effectiveWeight: baseWeight, daysOld: 0, decayFactor: 1.0 };
  }

  const source = TIER_DATA.sources.find(s => s.name === sourceName);
  if (!source || !source.date) {
    return { baseWeight, effectiveWeight: baseWeight, daysOld: 0, decayFactor: 1.0 };
  }

  const sourceDate = parseSourceDate(source.date);
  if (!sourceDate || !referenceDate) {
    return { baseWeight, effectiveWeight: baseWeight, daysOld: 0, decayFactor: 1.0 };
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysOld = Math.max(0, Math.floor((referenceDate - sourceDate) / msPerDay));

  if (daysOld <= RECENCY_THRESHOLD_DAYS) {
    return { baseWeight, effectiveWeight: baseWeight, daysOld, decayFactor: 1.0 };
  }

  const daysAfterThreshold = daysOld - RECENCY_THRESHOLD_DAYS;
  const decayFactor = Math.pow(2, -daysAfterThreshold / RECENCY_DECAY_RATE);
  const effectiveWeight = baseWeight * decayFactor;

  return { baseWeight, effectiveWeight, daysOld, decayFactor };
}

function buildTiersFromScores() {
  const tiers = createEmptyTiers();

  TIER_DATA.brawlers.forEach((b) => {
    const recalculatedTier = getTierFromScore(b.score);
    b.tier = recalculatedTier;
    tiers[recalculatedTier].push(b.name);
  });

  TIER_ORDER.forEach((tier) => {
    tiers[tier].sort((a, b) => brawlerMap[b].score - brawlerMap[a].score);
  });

  return tiers;
}

function addPortraitPaths() {
  TIER_DATA.brawlers.forEach((b) => {
    const match = b.icon.match(/(\d+)\.png$/);
    if (match) {
      const id = match[1];
      b.portrait = `portraits/${id}.png`;
    }
  });
}

function rebuildDerivedState() {
  addPortraitPaths();
  TIER_DATA.brawlers.sort((a, b) => b.score - a.score);

  Object.keys(brawlerMap).forEach((name) => delete brawlerMap[name]);
  TIER_DATA.brawlers.forEach((b) => {
    brawlerMap[b.name] = b;
  });

  DISPLAY_TIERS = buildTiersFromScores();
}

function syncDataMetadata() {
  const headerDate = TIER_DATA.last_updated;
  lastUpdated.textContent = 'Last updated: ' + headerDate;
  if (sourceCountBadge) {
    sourceCountBadge.textContent = String(TIER_DATA.total_sources);
  }
}

function renderDataLoadError() {
  const message = 'Unable to load tier data. Serve the site over HTTP to fetch data.json.';
  tierContainer.innerHTML = `<div style="padding:24px;border:1px solid rgba(255,255,255,0.08);border-radius:20px;background:rgba(255,255,255,0.03);color:var(--text-muted);text-align:center;">${message}</div>`;
  sourcesGrid.innerHTML = `<div style="padding:20px;border:1px solid rgba(255,255,255,0.08);border-radius:18px;color:var(--text-muted);text-align:center;">Source data unavailable.</div>`;
  srcPopupList.innerHTML = `<div style="padding:16px;color:var(--text-muted);text-align:center;">Source data unavailable.</div>`;
  lastUpdated.textContent = 'Last updated: unavailable';
  if (sourceCountBadge) {
    sourceCountBadge.textContent = '0';
  }
  searchInput.disabled = true;
}


function renderTierList() {
  tierContainer.innerHTML = '';

  TIER_ORDER.forEach((tier) => {
    const names = DISPLAY_TIERS[tier];
    if (tier === 'F' && names.length === 0) {
      // Still render empty F tier.
    }

    const row = document.createElement('div');
    row.className = `tier-row tier-${tier.toLowerCase()}`;

    const label = document.createElement('div');
    label.className = 'tier-label';
    label.textContent = tier;

    const brawlers = document.createElement('div');
    brawlers.className = 'tier-brawlers';

    if (names.length === 0 && tier === 'F') {
      const empty = document.createElement('span');
      empty.style.cssText = 'font-size:13px;color:var(--text-muted);font-style:italic;padding:4px 8px;';
      empty.textContent = 'No brawlers in this tier';
      brawlers.appendChild(empty);
    }

    names.forEach((name) => {
      const b = brawlerMap[name];
      if (!b) return;

      const wrap = document.createElement('a');
      wrap.className = 'brawler-icon-wrap';
      wrap.dataset.name = name.toLowerCase();
      wrap.href = '/brawlers/' + slugify(name) + '/';
      wrap.setAttribute('aria-label', name + ', ' + b.tier + ' tier, score ' + b.score.toFixed(2));

      const img = document.createElement('img');
      img.className = 'brawler-icon';
      img.src = b.portrait || b.icon;
      img.alt = name + ' — ' + b.tier + ' Tier brawler in Brawl Stars';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.setAttribute('role', 'img');
      img.onerror = function () {
        if (this.src !== b.icon) {
          this.src = b.icon; // CDN fallback
        } else {
          this.style.display = 'none';
          const fallback = document.createElement('div');
          fallback.className = 'brawler-icon-fallback';
          fallback.textContent = name.charAt(0);
          wrap.insertBefore(fallback, this);
        }
      };

      const tooltip = document.createElement('div');
      tooltip.className = 'brawler-tooltip';
      tooltip.innerHTML = `<span class="tt-name">${name}</span><span class="tt-score">${b.score.toFixed(2)}</span>`;

      const nameLabel = document.createElement('div');
      nameLabel.className = 'brawler-name-label';
      nameLabel.textContent = name;

      wrap.appendChild(img);
      if (b.num_sources < 3) {
        const flag = document.createElement('div');
        flag.className = 'low-sample-flag';
        flag.title = `Low sample size (${b.num_sources} source${b.num_sources !== 1 ? 's' : ''}) — tier may shift as more sources rate this brawler`;
        flag.textContent = '!';
        wrap.appendChild(flag);
      }
      wrap.appendChild(tooltip);
      wrap.appendChild(nameLabel);
      brawlers.appendChild(wrap);
    });

    row.appendChild(label);
    row.appendChild(brawlers);
    tierContainer.appendChild(row);
  });
}

searchInput.addEventListener('input', function () {
  const q = this.value.trim().toLowerCase();
  const icons = document.querySelectorAll('.brawler-icon-wrap');

  if (!q) {
    icons.forEach((el) => {
      el.classList.remove('dimmed', 'highlighted');
    });
    searchCount.textContent = '';
    return;
  }

  let count = 0;
  icons.forEach((el) => {
    const match = el.dataset.name.includes(q);
    el.classList.toggle('dimmed', !match);
    el.classList.toggle('highlighted', match);
    if (match) count++;
  });

  searchCount.textContent = count === 0 ? 'No brawlers found' : `${count} brawler${count !== 1 ? 's' : ''} found`;
});

function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('visible');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('visible'), 2200);
}

function openModal(b) {
  activeModalMode = 'brawler';
  const tierColor = TIER_COLORS[b.tier];
  const pct = ((b.score / 6) * 100).toFixed(1);
  const referenceDate = getReferenceDate();

  let sourcesHTML = '';
  TIER_DATA.sources.forEach((src) => {
    let rating;
    if (src.name === 'Noff.gg') {
      rating = b.noffMergedTier;
    } else {
      rating = b.sources[src.name];
    }
    if (rating) {
      const rColor = TIER_COLORS[rating] || '#8e8e93';
      const weightInfo = getSourceWeightInfo(src.name, referenceDate);
      const isDecayed = weightInfo.decayFactor < 1.0;
      const decayPct = Math.round((1 - weightInfo.decayFactor) * 100);
      const decayBadge = isDecayed
        ? `<span class="modal-source-decay" data-decay-pct="${decayPct}" data-decay-days="${weightInfo.daysOld}">−${decayPct}%</span>`
        : '';
      sourcesHTML += `
        <div class="modal-source-row${isDecayed ? ' modal-source-row-decayed' : ''}">
          <button class="modal-source-name modal-source-name-btn" type="button" data-source-name="${src.name}" aria-label="Open source details for ${src.name}${isDecayed ? ', weight reduced due to age' : ''}">${src.name}</button>
          ${decayBadge}
          <span class="modal-source-tier" style="background:${rColor}">${rating}</span>
        </div>`;
    }
  });

  const shareUrl = location.origin + location.pathname + '#' + encodeURIComponent(b.name);
  const tweetText = encodeURIComponent(`${b.name} is ${b.tier} Tier on BrawlRank (${b.score.toFixed(2)}/6.00) — check the full Brawl Stars meta ranking:`);

  modalContent.innerHTML = `
    <div class="modal-header">
      <img class="modal-icon" src="${b.portrait || b.icon}" alt="${b.name} — ${b.tier} Tier" loading="eager" decoding="sync" onerror="if(this.src!=='${b.icon}'){this.src='${b.icon}'}else{this.style.display='none'}">
      <div class="modal-info">
        <h2>${b.name}</h2>
        <span class="modal-tier-badge" style="background:${tierColor}">${b.tier} Tier</span>
      </div>
    </div>
    <div class="modal-score-section">
      <div class="modal-score-value" style="color:${tierColor}">${b.score.toFixed(2)} <span style="font-size:14px;color:var(--text-muted);font-weight:400;">/ 6.00</span></div>
      <div class="modal-score-bar-bg">
        <div class="modal-score-bar" style="width:0%;background:${tierColor}"></div>
      </div>
    </div>
    ${b.num_sources < 3 ? `<div class="low-sample-warning">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
      <span>Only ${b.num_sources} source${b.num_sources !== 1 ? 's' : ''} have rated this brawler — placement may shift as more data comes in.</span>
    </div>` : ''}
    <div class="modal-consensus">
      <span class="consensus-label">Source agreement:</span>
      <span class="consensus-value ${b.disagreement < 0.8 ? 'consensus-strong' : b.disagreement < 1.5 ? 'consensus-moderate' : 'consensus-weak'}">${b.disagreement < 0.8 ? 'Strong' : b.disagreement < 1.5 ? 'Moderate' : 'Weak'} consensus</span>
      <span class="consensus-detail">(σ = ${b.disagreement.toFixed(2)})</span>
    </div>
    <div class="modal-sources-title">Source Breakdown (${b.num_sources} sources)</div>
    ${sourcesHTML}
    <div class="modal-share-row">
      <button class="modal-share-btn" id="copyLinkBtn">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"/><path stroke-linecap="round" stroke-linejoin="round" d="M10.172 13.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.1-1.1"/></svg>
        Copy link
      </button>
      <a class="modal-tweet-btn" href="https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(shareUrl)}" target="_blank" rel="noopener noreferrer">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        Tweet
      </a>
    </div>
  `;

  document.getElementById('copyLinkBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(shareUrl).then(() => showToast('Link copied to clipboard'));
  });

  modalContent.querySelectorAll('.modal-source-name-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sourceName = btn.dataset.sourceName;
      closeModal();
      openSourceDetail(sourceName);
    });
  });

  history.replaceState(null, '', '#' + encodeURIComponent(b.name));
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => trapFocus(overlay));

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const bar = modalContent.querySelector('.modal-score-bar');
      if (bar) bar.style.width = pct + '%';
    });
  });
}

function closeModal() {
  overlay.classList.remove('active');
  releaseFocus(overlay);
  if (!srcPopupOverlay.classList.contains('active') && !sourceDetailOverlay.classList.contains('active')) {
    document.body.style.overflow = '';
  }

  if (activeModalMode === 'brawler') {
    history.replaceState(null, '', location.pathname);
  }

  activeModalMode = null;
}

modalClose.addEventListener('click', closeModal);
overlay.addEventListener('click', (e) => {
  if (e.target === overlay) closeModal();
});
// Unified Escape key handler — closes topmost overlay only
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (sourceDetailOverlay.classList.contains('active')) {
    closeSourceDetail();
  } else if (srcPopupOverlay.classList.contains('active')) {
    closeSourcesPopup();
  } else if (overlay.classList.contains('active')) {
    closeModal();
  }
});

function renderSources() {
  const referenceDate = getReferenceDate();
  sourcesGrid.innerHTML = '';
  TIER_DATA.sources.forEach((src) => {
    const weightInfo = getSourceWeightInfo(src.name, referenceDate);
    const baseWeight = weightInfo.baseWeight;
    const effectiveWeight = weightInfo.effectiveWeight;
    const isDecayed = weightInfo.decayFactor < 1.0;

    const weightDisplay = isDecayed
      ? `${effectiveWeight.toFixed(2)}× (was ${baseWeight.toFixed(1)}×)`
      : `${baseWeight.toFixed(1)}× weight`;

    const srcDecayPct = Math.round((1 - weightInfo.decayFactor) * 100);
    const decayIndicator = isDecayed
      ? `<span class="source-decay-badge" data-decay-pct="${srcDecayPct}" data-decay-days="${weightInfo.daysOld}">−${srcDecayPct}%</span>`
      : '';

    const card = document.createElement('div');
    card.className = 'source-card' + (isDecayed ? ' source-card-decayed' : '');
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Open source details for ${src.name}${isDecayed ? ', weight reduced due to age' : ''}`);
    card.innerHTML = `
      <div class="source-card-name">${src.name}</div>
      <div class="source-card-type">${src.type}</div>
      <div class="source-card-meta">
        <span>${src.date}</span>
        <div class="source-weight-group">
          <button class="source-weight-btn" type="button" aria-label="Weight details">
            ${weightDisplay}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
          </button>
          ${decayIndicator}
        </div>
      </div>
      <a href="${src.url}" target="_blank" rel="noopener noreferrer" class="source-card-link">View source →</a>
    `;
    card.addEventListener('click', (event) => {
      if (event.target.closest('.source-card-link, .source-weight-btn')) return;
      openSourceDetail(src.name);
    });
    card.addEventListener('keydown', (event) => {
      if (event.target.closest('.source-card-link, .source-weight-btn')) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openSourceDetail(src.name);
    });
    card.querySelector('.source-weight-btn').addEventListener('click', (event) => {
      event.stopPropagation();
      openSourceDetail(src.name);
    });
    sourcesGrid.appendChild(card);
  });
}

function renderSourcesPopup() {
  const referenceDate = getReferenceDate();
  srcPopupList.innerHTML = '';
  TIER_DATA.sources.forEach((src) => {
    const weightInfo = getSourceWeightInfo(src.name, referenceDate);
    const baseWeight = weightInfo.baseWeight;
    const effectiveWeight = weightInfo.effectiveWeight;
    const isDecayed = weightInfo.decayFactor < 1.0;

    const weightDisplay = isDecayed
      ? `${effectiveWeight.toFixed(2)}× (was ${baseWeight.toFixed(1)}×)`
      : `${baseWeight.toFixed(1)}× weight`;

    const popupDecayPct = Math.round((1 - weightInfo.decayFactor) * 100);
    const decayIndicator = isDecayed
      ? `<span class="source-decay-badge" data-decay-pct="${popupDecayPct}" data-decay-days="${weightInfo.daysOld}">−${popupDecayPct}%</span>`
      : '';

    const item = document.createElement('div');
    item.className = 'src-list-item' + (isDecayed ? ' src-list-item-decayed' : '');
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `Open source details for ${src.name}${isDecayed ? ', weight reduced due to age' : ''}`);
    item.innerHTML = `
      <div class="src-list-left">
        <div class="src-list-name">${src.name}</div>
        <div class="src-list-type">${src.type}</div>
      </div>
      <div class="src-list-right">
        <div class="src-list-date">${src.date}</div>
        <div class="src-weight-group">
          <button class="source-weight-btn" type="button" aria-label="Weight details">
            ${weightDisplay}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
          </button>
          ${decayIndicator}
        </div>
      </div>
    `;
    item.addEventListener('click', (event) => {
      if (event.target.closest('.source-weight-btn')) return;
      openSourceDetail(src.name);
    });
    item.addEventListener('keydown', (event) => {
      if (event.target.closest('.source-weight-btn')) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openSourceDetail(src.name);
    });
    item.querySelector('.source-weight-btn').addEventListener('click', (event) => {
      event.stopPropagation();
      openSourceDetail(src.name);
    });
    srcPopupList.appendChild(item);
  });
}

function getFallbackSourceDetail(src, weight) {
  return {
    whatItIs: `${src.type} source included in the blended BrawlRank model.`,
    whyWeight: `Weighted at ${weight.toFixed(1)}x to keep this source in balance with pro, creator, and data-driven inputs.`,
    uses: ['Source publication data', 'Recent patch interpretation', 'Observed gameplay trends']
  };
}

function openSourceDetail(sourceName) {
  const src = TIER_DATA.sources.find((source) => source.name === sourceName);
  if (!src) return;

  const referenceDate = getReferenceDate();
  const weightInfo = getSourceWeightInfo(src.name, referenceDate);
  const baseWeight = weightInfo.baseWeight;
  const effectiveWeight = weightInfo.effectiveWeight;
  const isDecayed = weightInfo.decayFactor < 1.0;

  const weight = baseWeight;
  const detail = SOURCE_DETAILS[src.name] || getFallbackSourceDetail(src, weight);
  const usesHtml = detail.uses.map((item) => `<li>${item}</li>`).join('');
  const typeLC = src.type.toLowerCase();

  const categoryLabel = typeLC.includes('data') ? 'Data Source'
    : typeLC.includes('community') ? 'Community'
    : typeLC.includes('editorial') ? 'Editorial'
    : typeLC.includes('pro player') ? 'Pro Player'
    : typeLC.includes('pro tier') ? 'Pro Creator'
    : 'Creator';
  const categoryClass = typeLC.includes('data') ? 'cat-data'
    : typeLC.includes('community') ? 'cat-community'
    : typeLC.includes('editorial') ? 'cat-editorial'
    : 'cat-pro';
  const weightRank = weight >= 1.4 ? 'Highest weight'
    : weight >= 1.2 ? 'High weight'
    : weight >= 0.9 ? 'Standard weight'
    : weight >= 0.65 ? 'Reduced weight'
    : 'Lowest weight';
  const usesHeading = typeLC.includes('data') ? 'Data inputs'
    : typeLC.includes('community') ? 'How it works'
    : 'Behind the list';

  const iconInfo = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`;
  const iconWeight = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="10" cy="6" r="2" fill="currentColor" stroke="none"/><circle cx="16" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="8" cy="18" r="2" fill="currentColor" stroke="none"/></svg>`;
  const iconList = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="5" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="5" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>`;
  const iconArrow = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;

  sourceDetailContent.innerHTML = `
    <div class="source-detail-head">
      <div class="source-detail-head-left">
        <div class="source-detail-name">${src.name}</div>
        <div class="source-detail-meta">
          <span class="source-cat-pill ${categoryClass}">${categoryLabel}</span>
          <span class="source-detail-date-inline">Updated ${src.date}</span>
        </div>
      </div>
      <div class="source-detail-weight-wrap">
        <div class="source-detail-weight">${isDecayed ? effectiveWeight.toFixed(2) + '×' : weight.toFixed(1) + '×'}</div>
        <div class="source-detail-weight-rank">${weightRank}</div>
        ${isDecayed ? `<span class="source-detail-decay-badge" data-decay-pct="${Math.round((1 - weightInfo.decayFactor) * 100)}" data-decay-days="${weightInfo.daysOld}">−${Math.round((1 - weightInfo.decayFactor) * 100)}% aged</span>` : ''}
      </div>
    </div>

    ${isDecayed ? `
    <div class="source-detail-block source-block-decay">
      <h3><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Source Aging</h3>
      <p>This source is <strong>${weightInfo.daysOld} days old</strong> — ${Math.max(0, weightInfo.daysOld - 15)} days past the 15-day threshold. Its base weight of ${weight.toFixed(1)}× has been reduced to <strong>${effectiveWeight.toFixed(2)}×</strong> (−${Math.round((1 - weightInfo.decayFactor) * 100)}%). Weight halves every 12 hours past the threshold.</p>
    </div>
    ` : ''}

    <div class="source-detail-block source-block-about">
      <h3>${iconInfo} About</h3>
      <p>${detail.whatItIs}</p>
    </div>

    <div class="source-detail-block source-block-weight">
      <h3>${iconWeight} Why ${weight.toFixed(1)}×</h3>
      <p>${detail.whyWeight}</p>
    </div>

    <div class="source-detail-block source-block-method">
      <h3>${iconList} ${usesHeading}</h3>
      <ul>${usesHtml}</ul>
    </div>

    <a href="${src.url}" target="_blank" rel="noopener noreferrer" class="source-detail-link">
      View source ${iconArrow}
    </a>
  `;

  sourceDetailOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => trapFocus(sourceDetailOverlay));
}

function closeSourceDetail() {
  sourceDetailOverlay.classList.remove('active');
  releaseFocus(sourceDetailOverlay);
  if (!overlay.classList.contains('active') && !srcPopupOverlay.classList.contains('active')) {
    document.body.style.overflow = '';
  }
}

function openSourcesPopup() {
  srcPopupOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => trapFocus(srcPopupOverlay));
}

function closeSourcesPopup() {
  srcPopupOverlay.classList.remove('active');
  releaseFocus(srcPopupOverlay);
  if (!overlay.classList.contains('active') && !sourceDetailOverlay.classList.contains('active')) {
    document.body.style.overflow = '';
  }
}

srcPopupClose.addEventListener('click', closeSourcesPopup);
srcPopupOverlay.addEventListener('click', (e) => {
  if (e.target === srcPopupOverlay) closeSourcesPopup();
});
sourceDetailClose.addEventListener('click', closeSourceDetail);
sourceDetailOverlay.addEventListener('click', (e) => {
  if (e.target === sourceDetailOverlay) closeSourceDetail();
});


function openBrawlerFromHash() {
  if (!location.hash) return;

  const name = decodeURIComponent(location.hash.slice(1));
  const exactMatch = brawlerMap[name];
  const matchingName = Object.keys(brawlerMap).find((key) => key.toLowerCase() === name.toLowerCase());
  const brawler = exactMatch || (matchingName ? brawlerMap[matchingName] : null);

  if (brawler) {
    openModal(brawler);
  }
}

async function initApp() {
  try {
    const tierData = await loadTierData();
    TIER_DATA = tierData;
    syncDataMetadata();
    rebuildDerivedState();
    renderTierList();
    renderSources();
    renderSourcesPopup();
    openBrawlerFromHash();
  } catch (error) {
    console.error(error);
    renderDataLoadError();
  }
}

// ===== EXPORT FUNCTIONALITY =====
const exportBtn = document.getElementById('exportBtn');
const exportDropdown = document.getElementById('exportDropdown');

if (exportBtn && exportDropdown) {
  exportBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    exportDropdown.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!exportDropdown.contains(e.target) && e.target !== exportBtn) {
      exportDropdown.classList.remove('open');
    }
  });

  exportDropdown.querySelectorAll('.export-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      const format = btn.dataset.format;
      exportDropdown.classList.remove('open');
      exportTierList(format);
    });
  });
}

function getExportRows() {
  if (!TIER_DATA || !TIER_DATA.brawlers) return [];
  const sorted = [...TIER_DATA.brawlers].sort((a, b) => b.score - a.score);
  return sorted.map((b) => ({
    Brawler: b.name,
    Tier: b.tier,
    Score: b.score.toFixed(2),
    Sources: b.num_sources
  }));
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportCSV() {
  const rows = getExportRows();
  if (!rows.length) return;
  const header = 'Brawler,Tier,Score,Sources';
  const lines = rows.map((r) => `${r.Brawler},${r.Tier},${r.Score},${r.Sources}`);
  const csv = [header, ...lines].join('\n');
  downloadBlob(new Blob([csv], { type: 'text/csv' }), 'BrawlRank_TierList.csv');
  showToast('CSV exported');
}

function exportXLSX() {
  if (typeof XLSX === 'undefined') { showToast('Excel library not loaded'); return; }
  const rows = getExportRows();
  if (!rows.length) return;
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{ wch: 20 }, { wch: 6 }, { wch: 8 }, { wch: 8 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Tier List');
  XLSX.writeFile(wb, 'BrawlRank_TierList.xlsx');
  showToast('Excel file exported');
}

function exportPDF() {
  if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') { showToast('PDF library not loaded'); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  if (!TIER_DATA || !TIER_DATA.brawlers) return;

  const W = 210;
  const M = 14; // margin
  const CW = W - M * 2; // content width
  const tierColors = { S: [255,45,85], A: [255,149,0], B: [255,204,0], C: [52,199,89], D: [90,200,250], F: [142,142,147] };
  const tierColorsDim = { S: [255,45,85,0.12], A: [255,149,0,0.10], B: [255,204,0,0.08], C: [52,199,89,0.08], D: [90,200,250,0.08], F: [142,142,147,0.08] };
  const tierOrder = ['S', 'A', 'B', 'C', 'D', 'F'];
  const BG = [10, 10, 15];
  const CARD = [18, 18, 26];
  const BORDER = [42, 42, 58];
  const TEXT = [234, 234, 240];
  const TEXT2 = [152, 152, 170];
  const TEXT3 = [102, 102, 122];
  const ACCENT = [0, 229, 255];

  // Group brawlers by tier
  const sorted = [...TIER_DATA.brawlers].sort((a, b) => b.score - a.score);
  const tierGroups = {};
  tierOrder.forEach((t) => { tierGroups[t] = []; });
  sorted.forEach((b) => { if (tierGroups[b.tier]) tierGroups[b.tier].push(b); });

  function drawPageBg() {
    doc.setFillColor(BG[0], BG[1], BG[2]);
    doc.rect(0, 0, W, 297, 'F');
  }

  function drawFooter(pageNum, totalPages) {
    doc.setFillColor(CARD[0], CARD[1], CARD[2]);
    doc.rect(0, 285, W, 12, 'F');
    doc.setFontSize(7);
    doc.setTextColor(TEXT3[0], TEXT3[1], TEXT3[2]);
    doc.text('brawlrank.com', M, 291);
    doc.text('Page ' + pageNum + ' of ' + totalPages, W - M, 291, { align: 'right' });
  }

  function checkPageBreak(needed) {
    if (y + needed > 278) {
      doc.addPage();
      drawPageBg();
      y = M;
      return true;
    }
    return false;
  }

  // === PAGE 1: Header ===
  drawPageBg();
  let y = M;

  // Title block
  doc.setFillColor(CARD[0], CARD[1], CARD[2]);
  doc.roundedRect(M, y, CW, 32, 3, 3, 'F');
  doc.setFontSize(18);
  doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  doc.setFont(undefined, 'bold');
  doc.text('BrawlRank', M + 10, y + 14);
  doc.setFontSize(11);
  doc.setTextColor(TEXT2[0], TEXT2[1], TEXT2[2]);
  doc.setFont(undefined, 'normal');
  doc.text('The Meta, Averaged', M + 58, y + 14);
  doc.setFontSize(8);
  doc.setTextColor(TEXT3[0], TEXT3[1], TEXT3[2]);
  doc.text('Aggregated from 9 sources \u2014 Updated ' + (TIER_DATA.last_updated || '') + ' \u2014 ' + TIER_DATA.total_brawlers + ' brawlers', M + 10, y + 25);
  y += 40;

  // === Tier sections ===
  tierOrder.forEach((tier) => {
    const brawlers = tierGroups[tier];
    if (!brawlers.length && tier !== 'F') return;

    const tc = tierColors[tier];
    const ROW_H = 7;
    const HEADER_H = 10;
    const sectionH = HEADER_H + 1 + (brawlers.length * ROW_H) + 4;

    checkPageBreak(Math.min(sectionH, HEADER_H + ROW_H * 3 + 10));

    // Tier section header
    doc.setFillColor(tc[0], tc[1], tc[2]);
    doc.roundedRect(M, y, CW, HEADER_H, 2, 2, 'F');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text(tier + ' Tier', M + 6, y + 7.2);
    // Brawler count
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(brawlers.length + ' brawler' + (brawlers.length !== 1 ? 's' : ''), W - M - 6, y + 7, { align: 'right' });
    y += HEADER_H + 1;

    if (brawlers.length === 0) {
      doc.setFillColor(CARD[0], CARD[1], CARD[2]);
      doc.roundedRect(M, y, CW, ROW_H + 2, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setTextColor(TEXT3[0], TEXT3[1], TEXT3[2]);
      doc.setFont(undefined, 'italic');
      doc.text('No brawlers in this tier', M + 6, y + 5.5);
      doc.setFont(undefined, 'normal');
      y += ROW_H + 6;
      return;
    }

    // Column headers
    doc.setFillColor(CARD[0], CARD[1], CARD[2]);
    doc.rect(M, y, CW, ROW_H, 'F');
    doc.setFontSize(7);
    doc.setTextColor(TEXT3[0], TEXT3[1], TEXT3[2]);
    doc.setFont(undefined, 'bold');
    doc.text('#', M + 4, y + 5);
    doc.text('BRAWLER', M + 14, y + 5);
    doc.text('SCORE', M + 80, y + 5);
    doc.text('BAR', M + 100, y + 5);
    doc.text('SOURCES', W - M - 6, y + 5, { align: 'right' });
    doc.setFont(undefined, 'normal');
    y += ROW_H;

    // Brawler rows
    let globalRank = sorted.indexOf(brawlers[0]) + 1;
    brawlers.forEach((b, i) => {
      checkPageBreak(ROW_H + 2);

      // Alternating row bg
      if (i % 2 === 0) {
        doc.setFillColor(14, 14, 20);
      } else {
        doc.setFillColor(CARD[0], CARD[1], CARD[2]);
      }
      doc.rect(M, y, CW, ROW_H, 'F');

      // Left accent stripe
      doc.setFillColor(tc[0], tc[1], tc[2]);
      doc.rect(M, y, 1.5, ROW_H, 'F');

      // Rank
      doc.setFontSize(7.5);
      doc.setTextColor(TEXT3[0], TEXT3[1], TEXT3[2]);
      doc.text(String(globalRank + i), M + 4, y + 5);

      // Name
      doc.setFontSize(8.5);
      doc.setTextColor(TEXT[0], TEXT[1], TEXT[2]);
      doc.setFont(undefined, 'bold');
      doc.text(b.name, M + 14, y + 5);
      doc.setFont(undefined, 'normal');

      // Score
      doc.setFontSize(8.5);
      doc.setTextColor(tc[0], tc[1], tc[2]);
      doc.text(b.score.toFixed(2), M + 80, y + 5);

      // Score bar
      const barW = 60;
      const barH = 3;
      const barY = y + 3;
      const barX = M + 100;
      const pct = Math.min(b.score / 6, 1);
      doc.setFillColor(30, 30, 42);
      doc.roundedRect(barX, barY, barW, barH, 1.5, 1.5, 'F');
      if (pct > 0) {
        doc.setFillColor(tc[0], tc[1], tc[2]);
        doc.roundedRect(barX, barY, barW * pct, barH, 1.5, 1.5, 'F');
      }

      // Sources count
      doc.setFontSize(7.5);
      doc.setTextColor(TEXT2[0], TEXT2[1], TEXT2[2]);
      doc.text(String(b.num_sources), W - M - 6, y + 5, { align: 'right' });

      y += ROW_H;
    });

    y += 4; // gap between tier sections
  });

  // Add footers to all pages
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    drawFooter(p, pageCount);
  }

  doc.save('BrawlRank_TierList.pdf');
  showToast('PDF exported');
}

function exportImage(format) {
  showToast('Generating image...');
  const SCALE = 2;
  const LABEL_W = 80;
  const ICON_SIZE = 52;
  const NAME_H = 14;          // space reserved for name text below icon
  const CELL_H = ICON_SIZE + NAME_H; // total height per icon cell
  const ICON_GAP_X = 6;       // horizontal gap between cells
  const ICON_GAP_Y = 8;       // vertical gap between rows of icons
  const PAD = 14;
  const HEADER_H = 60;
  const FOOTER_H = 36;
  const CANVAS_W = 1200;

  const tierOrder = ['S', 'A', 'B', 'C', 'D', 'F'];
  const tierBg = { S: '#ff2d55', A: '#ff9500', B: '#ffcc00', C: '#34c759', D: '#5ac8fa', F: '#8e8e93' };
  const rows = [];
  tierOrder.forEach((t) => {
    const names = DISPLAY_TIERS[t];
    if (!names || (names.length === 0 && t !== 'F')) return;
    const iconsPerRow = Math.floor((CANVAS_W - LABEL_W - PAD * 2) / (ICON_SIZE + ICON_GAP_X));
    const rowCount = Math.max(1, Math.ceil(names.length / iconsPerRow));
    rows.push({ tier: t, names, rowCount, iconsPerRow });
  });

  // Total height: each tier row = padding + (rowCount * CELL_H) + ((rowCount-1) * ICON_GAP_Y) + padding
  const totalH = HEADER_H + rows.reduce((s, r) => {
    return s + PAD + r.rowCount * CELL_H + Math.max(0, r.rowCount - 1) * ICON_GAP_Y + PAD;
  }, 0) + FOOTER_H;

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W * SCALE;
  canvas.height = totalH * SCALE;
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);

  // Background
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, CANVAS_W, totalH);

  // Header
  ctx.fillStyle = '#00e5ff';
  ctx.font = 'bold 22px Satoshi, system-ui, sans-serif';
  ctx.fillText('BrawlRank Tier List', PAD, 32);
  ctx.fillStyle = '#66667a';
  ctx.font = '13px Satoshi, system-ui, sans-serif';
  ctx.fillText('Aggregated from 9 sources \u2014 ' + (TIER_DATA.last_updated || '') + ' \u2014 brawlrank.com', PAD, 50);

  let y = HEADER_H;

  // Load all portrait images first, then draw
  const imgPromises = [];
  const imgCache = {};
  rows.forEach((row) => {
    row.names.forEach((name) => {
      const b = brawlerMap[name];
      if (!b) return;
      const src = b.portrait || b.icon;
      if (!imgCache[name]) {
        const p = new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => { imgCache[name] = img; resolve(); };
          img.onerror = () => { imgCache[name] = null; resolve(); };
          img.src = src;
        });
        imgPromises.push(p);
        imgCache[name] = 'loading';
      }
    });
  });

  Promise.all(imgPromises).then(() => {
    rows.forEach((row) => {
      const rowH = PAD + row.rowCount * CELL_H + Math.max(0, row.rowCount - 1) * ICON_GAP_Y + PAD;

      // Row background
      ctx.fillStyle = '#12121a';
      ctx.fillRect(0, y, CANVAS_W, rowH);
      ctx.strokeStyle = '#2a2a3a';
      ctx.strokeRect(0, y, CANVAS_W, rowH);

      // Tier label
      ctx.fillStyle = tierBg[row.tier];
      ctx.fillRect(0, y, LABEL_W, rowH);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 32px Clash Display, Satoshi, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(row.tier, LABEL_W / 2, y + rowH / 2);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      // Brawler icons
      let ix = LABEL_W + PAD;
      let iy = y + PAD;
      row.names.forEach((name, idx) => {
        const img = imgCache[name];
        if (img && img.naturalWidth) {
          // Draw with aspect ratio preserved (cover-fit into square)
          const sw = img.naturalWidth;
          const sh = img.naturalHeight;
          const ratio = Math.max(ICON_SIZE / sw, ICON_SIZE / sh);
          const drawW = sw * ratio;
          const drawH = sh * ratio;
          const ox = (ICON_SIZE - drawW) / 2;
          const oy = (ICON_SIZE - drawH) / 2;
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(ix, iy, ICON_SIZE, ICON_SIZE, 6);
          ctx.clip();
          ctx.drawImage(img, ix + ox, iy + oy, drawW, drawH);
          ctx.restore();
        } else {
          ctx.fillStyle = '#1e1e2a';
          ctx.beginPath();
          ctx.roundRect(ix, iy, ICON_SIZE, ICON_SIZE, 6);
          ctx.fill();
          ctx.fillStyle = '#66667a';
          ctx.font = 'bold 18px Satoshi, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(name.charAt(0), ix + ICON_SIZE / 2, iy + ICON_SIZE / 2);
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
        }

        // Name below icon (within the NAME_H space)
        ctx.fillStyle = '#9898aa';
        ctx.font = '9px Satoshi, system-ui, sans-serif';
        ctx.textAlign = 'center';
        const displayName = name.length > 8 ? name.slice(0, 7) + '\u2026' : name;
        ctx.fillText(displayName, ix + ICON_SIZE / 2, iy + ICON_SIZE + 11);
        ctx.textAlign = 'left';

        ix += ICON_SIZE + ICON_GAP_X;
        if ((idx + 1) % row.iconsPerRow === 0 && idx < row.names.length - 1) {
          ix = LABEL_W + PAD;
          iy += CELL_H + ICON_GAP_Y; // advance by full cell height + gap
        }
      });

      y += rowH;
    });

    // Footer
    ctx.fillStyle = '#66667a';
    ctx.font = '11px Satoshi, system-ui, sans-serif';
    ctx.fillText('brawlrank.com \u2014 The Meta, Averaged', PAD, y + 22);

    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const ext = format === 'jpg' ? 'jpg' : 'png';
    canvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, 'BrawlRank_TierList.' + ext);
        showToast(ext.toUpperCase() + ' exported');
      } else {
        showToast('Image export failed');
      }
    }, mimeType, 0.95);
  }).catch(() => showToast('Image export failed'));
}

function exportTierList(format) {
  switch (format) {
    case 'csv': exportCSV(); break;
    case 'xlsx': exportXLSX(); break;
    case 'pdf': exportPDF(); break;
    case 'png': exportImage('png'); break;
    case 'jpg': exportImage('jpg'); break;
    default: showToast('Unknown format');
  }
}

initAnalyticsConsent();
initApp();

