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
    whatItIs: 'A data-driven tier list combining Top 200 leaderboard performance and Ranked Mode statistics into a single empirical view of the meta.',
    whyWeight: 'Weighted at 1.5x — the highest in BrawlRank — because empirical performance data from the best players is the most objective measure of brawler strength available.',
    uses: ['Top 200 global leaderboard win/pick rates', 'Ranked Mode performance data across skill tiers', 'Automated, regularly refreshed statistical snapshots']
  },
  MmonsteR: {
    whatItIs: 'An independent data-driven meta analysis focused on upper-skill performance, providing a second empirical perspective alongside Noff.gg.',
    whyWeight: 'Weighted at 1.3x as an independent data source. Two independent data pipelines agreeing on a brawler\'s strength increases confidence.',
    uses: ['Top 200 player performance modeling', 'Usage rates and success metrics across patches', 'Patch-cycle trend tracking']
  },
  SpenLC: {
    whatItIs: 'An active professional Brawl Stars player competing at the championship level, offering first-hand competitive insight.',
    whyWeight: 'Weighted at 1.0x — expert opinion is valuable but inherently subjective. Pro players can have blind spots or biases toward their own playstyle.',
    uses: ['SpenLC (active pro player)', 'First-hand scrim and tournament experience', 'Draft and matchup priority from direct gameplay']
  },
  KairosTime: {
    whatItIs: 'A long-running Brawl Stars content creator whose tier lists are built in collaboration with top competitive players.',
    whyWeight: 'Weighted at 1.0x — benefits from pro consultation and transparent methodology, but is still an opinion-based assessment filtered through a content creator.',
    uses: ['KairosTime + competitive collaborators', 'Scrim and high-level ranked context', 'Patch-adjusted matchup analysis']
  },
  BobbyBS: {
    whatItIs: 'A creator tier list informed by direct input from roughly 10 professional players, providing a crowd-sourced competitive perspective.',
    whyWeight: 'Weighted at 0.8x — pro input adds credibility, but editorial synthesis of that input adds a subjective layer between raw pro opinion and the final list.',
    uses: ['BobbyBS + around 10 pro players', 'Pro feedback consensus', 'High-level mode and map discussions']
  },
  HMBLE: {
    whatItIs: 'A professional Brawl Stars esports team whose tier list reflects coordinated 3v3 team play from scrims and competition.',
    whyWeight: 'Weighted at 0.8x — genuine competitive authority, but evaluates through the lens of coordinated team play which differs from solo queue.',
    uses: ['HMBLE pro team members', 'Team scrim and composition testing', 'Coordinated play viability assessment']
  },
  Ash: {
    whatItIs: 'A well-known Brawl Stars content creator producing tier lists focused on practical ranked and ladder play.',
    whyWeight: 'Weighted at 0.7x — reliable single-analyst perspective but lacks competitive tournament pedigree and data-driven objectivity.',
    uses: ['Ash (single analyst)', 'Current patch experience and testing', 'Ranked ladder viability focus']
  },
  Driffle: {
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
      <p class="version-modal-text">BrawlRank is maintained as an open-source project by Tech-Savvies. Explore the codebase, suggest features, or report bugs directly on GitHub.</p>
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
        <a class="version-modal-link" href="https://tech-savvies.com/" target="_blank" rel="noopener noreferrer">
          <span class="v-link-left">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
            Tech-Savvies Website
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
      wrap.onclick = () => openModal(b);

      const img = document.createElement('img');
      img.className = 'brawler-icon';
      img.src = b.portrait || b.icon;
      img.alt = name;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.setAttribute('role', 'img');

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
      <img class="modal-icon" src="${b.portrait || b.icon}" alt="${b.name}" loading="eager" decoding="sync">
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

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const bar = modalContent.querySelector('.modal-score-bar');
      if (bar) bar.style.width = pct + '%';
    });
  });
}

function closeModal() {
  overlay.classList.remove('active');
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
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

function renderSources() {
  sourcesGrid.innerHTML = '';
  TIER_DATA.sources.forEach((src) => {
    const weight = SOURCE_WEIGHTS[src.name] || 1.0;
    const card = document.createElement('div');
    card.className = 'source-card';
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
    card.querySelector('.source-weight-btn').addEventListener('click', () => openSourceDetail(src.name));
    sourcesGrid.appendChild(card);
  });
}

function renderSourcesPopup() {
  srcPopupList.innerHTML = '';
  TIER_DATA.sources.forEach((src) => {
    const weight = SOURCE_WEIGHTS[src.name] || 1.0;
    const item = document.createElement('div');
    item.className = 'src-list-item';
    item.innerHTML = `
      <div class="src-list-left">
        <div class="src-list-name"><a href="${src.url}" target="_blank" rel="noopener noreferrer">${src.name}</a></div>
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
    item.querySelector('.source-weight-btn').addEventListener('click', () => openSourceDetail(src.name));
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

  sourceDetailContent.innerHTML = `
    <div class="source-detail-head">
      <div>
        <div class="source-detail-name">${src.name}</div>
        <div class="source-detail-type">${src.type}</div>
      </div>
      <div class="source-detail-weight">${weight.toFixed(1)}x</div>
    </div>
    <div class="source-detail-date">Latest source date: ${src.date}</div>

    <div class="source-detail-block">
      <h3>What this source is</h3>
      <p>${detail.whatItIs}</p>
    </div>

    <div class="source-detail-block">
      <h3>Why this weight</h3>
      <p>${detail.whyWeight}</p>
    </div>

    <div class="source-detail-block">
      <h3>What data or people it uses</h3>
      <ul>${usesHtml}</ul>
    </div>

    <a href="${src.url}" target="_blank" rel="noopener noreferrer" class="source-detail-link">Open original source</a>
  `;

  sourceDetailOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeSourceDetail() {
  sourceDetailOverlay.classList.remove('active');
  if (!overlay.classList.contains('active') && !srcPopupOverlay.classList.contains('active')) {
    document.body.style.overflow = '';
  }
}

function openSourcesPopup() {
  srcPopupOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeSourcesPopup() {
  srcPopupOverlay.classList.remove('active');
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
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && srcPopupOverlay.classList.contains('active')) closeSourcesPopup();
  if (e.key === 'Escape' && sourceDetailOverlay.classList.contains('active')) closeSourceDetail();
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