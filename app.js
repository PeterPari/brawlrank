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
const sourcesBtn = document.getElementById('sourcesBtn');
const sourceDetailOverlay = document.getElementById('sourceDetailOverlay');
const sourceDetailClose = document.getElementById('sourceDetailClose');
const sourceDetailContent = document.getElementById('sourceDetailContent');
const siteVersion = document.getElementById('siteVersion');
const consentBanner = document.getElementById('consent');
const acceptBtn = document.getElementById('acceptBtn');
const SITE_REPO_URL = 'https://github.com/PeterPari/brawlrank';
const SITE_ISSUES_URL = 'https://github.com/PeterPari/brawlrank/issues';
const CONSENT_STORAGE_KEY = 'consent';
const CLARITY_PROJECT_ID = 'vwyrtsgbq7';

let siteVersionValue = '';
let siteVersionDateValue = '';
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

function hasAnalyticsConsent() {
  try {
    return window.localStorage.getItem(CONSENT_STORAGE_KEY) === '1';
  } catch (error) {
    console.warn('Unable to read analytics consent state.', error);
    return false;
  }
}

function setAnalyticsConsent() {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, '1');
  } catch (error) {
    console.warn('Unable to persist analytics consent state.', error);
  }
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

async function loadSiteVersion() {
  const response = await fetch('version', { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(`Unable to load site version (${response.status})`);
  }

  return response.text();
}

async function loadSiteVersionDate() {
  const response = await fetch('version-date', { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(`Unable to load site version date (${response.status})`);
  }

  return response.text();
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

function valueToTier(value) {
  const rounded = Math.round(value);
  const map = { 6: 'S', 5: 'A', 4: 'B', 3: 'C', 2: 'D', 1: 'F' };
  return map[Math.max(1, Math.min(6, rounded))] || 'F';
}

function calculateAllScores() {
  TIER_DATA.brawlers.forEach((b) => {
    let weightedSum = 0;
    let totalWeight = 0;
    const ratings = [];

    const noffTop = b.sources['Noff.gg'];
    const noffRanked = b.sources['Noff Ranked'];
    let mergedNoffValue = null;

    if (noffTop || noffRanked) {
      if (noffTop && noffRanked) {
        mergedNoffValue = (TIER_VALUES[noffTop] + TIER_VALUES[noffRanked]) / 2;
      } else {
        mergedNoffValue = TIER_VALUES[noffTop || noffRanked];
      }

      const weight = SOURCE_WEIGHTS['Noff.gg'];
      weightedSum += mergedNoffValue * weight;
      totalWeight += weight;
      ratings.push(mergedNoffValue);
    }

    b.noffMergedTier = mergedNoffValue !== null ? valueToTier(mergedNoffValue) : null;

    for (const [sourceName, weight] of Object.entries(SOURCE_WEIGHTS)) {
      if (sourceName === 'Noff.gg') continue;

      const tier = b.sources[sourceName];
      if (!tier) continue;

      const value = TIER_VALUES[tier];
      weightedSum += value * weight;
      totalWeight += weight;
      ratings.push(value);
    }

    b.score = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : 0;
    b.num_sources = ratings.length;

    if (ratings.length > 0) {
      const mean = ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
      const variance = ratings.reduce((sum, value) => sum + (value - mean) ** 2, 0) / ratings.length;
      b.disagreement = Math.round(Math.sqrt(variance) * 100) / 100;
    } else {
      b.disagreement = 0;
    }
  });

  TIER_DATA.brawlers.sort((a, b) => b.score - a.score);
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
  calculateAllScores();

  Object.keys(brawlerMap).forEach((name) => delete brawlerMap[name]);
  TIER_DATA.brawlers.forEach((b) => {
    brawlerMap[b.name] = b;
  });

  DISPLAY_TIERS = buildTiersFromScores();
}

function syncDataMetadata() {
  const headerDate = siteVersionDateValue || TIER_DATA.last_updated;
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

function syncSiteVersion(versionText) {
  if (!siteVersion) return;

  const cleanedVersion = versionText.trim();
  siteVersionValue = cleanedVersion;
  siteVersion.textContent = cleanedVersion ? `Version ${cleanedVersion}` : 'Version unavailable';
  siteVersion.disabled = !cleanedVersion;
}

function syncSiteVersionDate(versionDateText) {
  siteVersionDateValue = versionDateText.trim();
}

function openVersionModal() {
  if (!siteVersionValue) return;

  const versionDateMarkup = siteVersionDateValue
    ? `<div class="version-modal-meta">
         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
         Released ${siteVersionDateValue}
       </div>`
    : '<div class="version-modal-meta">Release date unavailable</div>';

  modalContent.innerHTML = `
    <div class="version-modal-header">
      <div class="version-modal-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
      </div>
      <div>
        <h2 class="version-modal-title">BrawlRank Open Source</h2>
        <div class="version-modal-badge">v${siteVersionValue}</div>
      </div>
    </div>
    ${versionDateMarkup}
    <div class="version-modal-body">
      <p class="version-modal-text">BrawlRank is an open-source project. Explore the codebase, suggest features, or report bugs directly on GitHub.</p>
      <div class="version-modal-links">
        <a class="version-modal-link" href="${SITE_REPO_URL}" target="_blank" rel="noopener noreferrer">
          <span class="v-link-left">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
            GitHub Repository
          </span>
        </a>
        <a class="version-modal-link" href="${SITE_ISSUES_URL}" target="_blank" rel="noopener noreferrer">
          <span class="v-link-left">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            Report an Issue
          </span>
        </a>

      </div>
    </div>
  `;

  activeModalMode = 'version';
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
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

      const wrap = document.createElement('div');
      wrap.className = 'brawler-icon-wrap';
      wrap.dataset.name = name.toLowerCase();
      wrap.setAttribute('tabindex', '0');
      wrap.setAttribute('role', 'button');
      wrap.setAttribute('aria-label', name + ', ' + b.tier + ' tier, score ' + b.score.toFixed(2));
      wrap.onclick = () => openModal(b);
      wrap.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(b); } };

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
      sourcesHTML += `
        <div class="modal-source-row">
          <button class="modal-source-name modal-source-name-btn" type="button" data-source-name="${src.name}" aria-label="Open source details for ${src.name}">${src.name}</button>
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
  sourcesGrid.innerHTML = '';
  TIER_DATA.sources.forEach((src) => {
    const weight = SOURCE_WEIGHTS[src.name] || 1.0;
    const card = document.createElement('div');
    card.className = 'source-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Open source details for ${src.name}`);
    card.innerHTML = `
      <div class="source-card-name">${src.name}</div>
      <div class="source-card-type">${src.type}</div>
      <div class="source-card-meta">
        <span>${src.date}</span>
        <button class="source-weight-btn" type="button" aria-label="Weight details">
          ${weight.toFixed(1)}× weight
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
        </button>
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
  srcPopupList.innerHTML = '';
  TIER_DATA.sources.forEach((src) => {
    const weight = SOURCE_WEIGHTS[src.name] || 1.0;
    const item = document.createElement('div');
    item.className = 'src-list-item';
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `Open source details for ${src.name}`);
    item.innerHTML = `
      <div class="src-list-left">
        <div class="src-list-name">${src.name}</div>
        <div class="src-list-type">${src.type}</div>
      </div>
      <div class="src-list-right">
        <div class="src-list-date">${src.date}</div>
        <button class="source-weight-btn" type="button" aria-label="Weight details">
          ${weight.toFixed(1)}× weight
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
        </button>
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

  const weight = SOURCE_WEIGHTS[src.name] || 1.0;
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
        <div class="source-detail-weight">${weight.toFixed(1)}×</div>
        <div class="source-detail-weight-rank">${weightRank}</div>
      </div>
    </div>

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

sourcesBtn.addEventListener('click', openSourcesPopup);
if (siteVersion) {
  siteVersion.addEventListener('click', openVersionModal);
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
    const [tierData, versionText, versionDateText] = await Promise.all([
      loadTierData(),
      loadSiteVersion().catch(() => ''),
      loadSiteVersionDate().catch(() => '')
    ]);

    TIER_DATA = tierData;
    syncSiteVersion(versionText);
    syncSiteVersionDate(versionDateText);
    syncDataMetadata();
    rebuildDerivedState();
    renderTierList();
    renderSources();
    renderSourcesPopup();
    openBrawlerFromHash();
  } catch (error) {
    console.error(error);
    syncSiteVersion('');
    syncSiteVersionDate('');
    renderDataLoadError();
  }
}

initAnalyticsConsent();
initApp();