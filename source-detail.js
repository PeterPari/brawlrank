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

const RECENCY_THRESHOLD_DAYS = 15;
const RECENCY_DECAY_RATE = 0.5;

const SOURCE_DETAILS = {
  'Noff.gg': {
    whatItIs: 'A fully automated data pipeline that tracks performance statistics for the top 200 players globally and across Ranked Mode. No human analyst is involved — tiers are derived directly from win rates, pick rates, and usage trends at the highest levels of play. BrawlRank merges both Noff data slices (Top 200 + Ranked) into a single averaged rating per brawler.',
    whyWeight: 'Weighted at 1.5x — the highest in BrawlRank — because automated performance data is free from personal bias or content incentives. It measures what the best players are actually winning with, not what anyone thinks is strong.',
    uses: ['Win rate and pick rate data from the global Top 200 leaderboard', 'Ranked Mode performance data across multiple skill tiers', 'Brawler usage trends tracked across game modes', 'Two independent data slices averaged into one merged rating']
  },
  MmonsteR: {
    whatItIs: 'An independent data-driven meta analysis focused on upper-skill player performance, built on a separate data pipeline from Noff.gg. It produces tier assessments based on how brawlers perform among high-level players.',
    whyWeight: 'Weighted at 1.3x as an independent data source — slightly below Noff\'s 1.5x because it covers only Top 200 (no Ranked Mode slice). When two independent data pipelines agree on a placement, that corroboration increases confidence significantly.',
    uses: ['Independent Top 200 performance modeling', 'Brawler usage rates and win metrics across patches', 'Separate data pipeline from Noff.gg — no shared methodology']
  },
  SpenLC: {
    whatItIs: 'An active professional Brawl Stars player competing at the championship level. His tier list is built from first-hand competitive experience — scrims, tournament drafts, and top-ladder play.',
    whyWeight: 'Weighted at 1.0x — pro expertise is highly valuable, but opinion is inherently subjective. No source gets a weight bonus for being a high-profile personality.',
    uses: ['First-hand scrim and tournament gameplay at championship level', 'Draft priority and ban-rate intuition from actual competitive matches', 'Awareness of which brawlers are practiced vs. avoided in pro circles']
  },
  KairosTime: {
    whatItIs: 'One of the longest-running Brawl Stars content creators, producing tier lists in direct collaboration with competitive players and coaches. His methodology is notably transparent — he publicly explains individual tier placements with matchup reasoning.',
    whyWeight: 'Weighted at 1.0x — benefits from pro consultation and years of meta tracking, but remains an opinion-based assessment with an editorial layer between the competitive input and the final list.',
    uses: ['Direct collaboration with competitive players and coaches', 'Patch-adjusted matchup and team composition analysis', 'Per-brawler reasoning with mode-specific justifications']
  },
  BobbyBS: {
    whatItIs: 'A creator-curated tier list built with direct input from roughly 10 professional players. Rather than one person\'s opinion, BobbyBS gathers feedback from a range of pros and synthesizes it into placements.',
    whyWeight: 'Weighted at 0.8x — below direct pro sources at 1.0x. The pro input adds credibility, but BobbyBS acts as the curator, introducing an editorial layer between the pro opinions and the final placement.',
    uses: ['Aggregated input from ~10 professional players', 'Consensus-driven placement rather than single-analyst opinion', 'Cross-pro perspective on draft priority and matchups']
  },
  HMBLE: {
    whatItIs: 'A professional Brawl Stars esports team whose tier list reflects their internal competitive perspective, shaped by coordinated scrims and team composition testing.',
    whyWeight: 'Weighted at 0.8x — genuine competitive authority, but with a key caveat: pro teams evaluate brawlers through the lens of coordinated play, which can diverge from general ladder performance.',
    uses: ['Internal team scrim results and composition testing', 'Input from multiple HMBLE pro team members', 'Coordinated 3v3 team play viability as the primary lens']
  },
  Ash: {
    whatItIs: 'A well-known Brawl Stars content creator who produces regular tier lists grounded in extensive personal gameplay experience. His lists focus on practical ranked and ladder viability.',
    whyWeight: 'Weighted at 0.7x — reliable and well-informed, but as a single analyst without competitive tournament involvement or access to statistical data, carries less evidentiary weight than data-driven or pro-sourced inputs.',
    uses: ['Single-analyst perspective with deep game knowledge', 'Current patch testing and personal match review', 'Ranked ladder viability focus across a range of trophy levels']
  },
  Driffle: {
    whatItIs: 'An editorial tier list published for a broad general audience, synthesizing publicly available meta information — other tier lists, community discussion, patch notes — into an accessible guide format.',
    whyWeight: 'Weighted at 0.4x — editorial lists provide a useful mainstream-meta snapshot, but tend to lag the competitive meta and prioritize accessibility over precision.',
    uses: ['Synthesis of publicly available tier lists and meta discussion', 'General/mainstream player framing rather than competitive specialist focus', 'Secondary source aggregation — no original data or gameplay input']
  },
  'BrawlTime Votes': {
    whatItIs: 'A community voting system hosted by BrawlTime Ninja where any player can rate brawlers. With 312,000+ votes, it is the largest sample size of any source in BrawlRank by a wide margin.',
    whyWeight: 'Weighted at 0.3x — the lowest in BrawlRank. Large sample makes it reliable for measuring player sentiment, but community perception and competitive reality frequently diverge.',
    uses: ['312,000+ individual community votes — largest sample of any source', 'Open participation from all skill levels, not just top players', 'Reflects broad player sentiment and perceived meta strength']
  }
};

function parseDate(str) {
  if (!str) return null;
  const full = new Date(str);
  if (!isNaN(full.getTime())) return full;
  const m = str.match(/^(\w+)\s+(\d{4})$/);
  if (m) {
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const mi = months.indexOf(m[1]);
    if (mi !== -1) return new Date(parseInt(m[2]), mi + 1, 0);
  }
  return null;
}

function getEffectiveWeight(sourceName, dateStr) {
  const base = SOURCE_WEIGHTS[sourceName] || 1.0;
  const sourceDate = parseDate(dateStr);
  if (!sourceDate) return { base, effective: base, decayPct: 0, daysOld: 0 };
  const refDate = new Date();
  const daysOld = Math.max(0, Math.floor((refDate - sourceDate) / 86400000));
  if (daysOld <= RECENCY_THRESHOLD_DAYS) return { base, effective: base, decayPct: 0, daysOld };
  const factor = Math.pow(2, -(daysOld - RECENCY_THRESHOLD_DAYS) / RECENCY_DECAY_RATE);
  return { base, effective: Math.round(base * factor * 100) / 100, decayPct: Math.round((1 - factor) * 100), daysOld };
}

function createModal() {
  const overlay = document.createElement('div');
  overlay.id = 'sdOverlay';
  overlay.className = 'source-detail-overlay';
  overlay.innerHTML = `
    <div class="source-detail-popup" id="sdPopup">
      <button class="source-detail-close" id="sdClose" aria-label="Close">✕</button>
      <div id="sdContent"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const close = () => {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  document.getElementById('sdClose').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.classList.contains('active')) close(); });

  return overlay;
}

let sdOverlay = null;

function openSourceModal(name, dateStr, url, type) {
  if (!sdOverlay) sdOverlay = createModal();

  const weight = getEffectiveWeight(name, dateStr);
  const detail = SOURCE_DETAILS[name] || {
    whatItIs: `${type} source included in the blended BrawlRank model.`,
    whyWeight: `Weighted at ${weight.base.toFixed(1)}x to keep this source in balance with other inputs.`,
    uses: ['Source publication data', 'Recent patch interpretation']
  };

  const typeLC = (type || '').toLowerCase();
  const catLabel = typeLC.includes('data') ? 'Data Source'
    : typeLC.includes('community') ? 'Community'
    : typeLC.includes('editorial') ? 'Editorial'
    : typeLC.includes('pro player') ? 'Pro Player'
    : typeLC.includes('pro tier') ? 'Pro Creator'
    : 'Creator';
  const catClass = typeLC.includes('data') ? 'cat-data'
    : typeLC.includes('community') ? 'cat-community'
    : typeLC.includes('editorial') ? 'cat-editorial'
    : 'cat-pro';
  const weightRank = weight.base >= 1.4 ? 'Highest weight'
    : weight.base >= 1.2 ? 'High weight'
    : weight.base >= 0.9 ? 'Standard weight'
    : weight.base >= 0.65 ? 'Reduced weight'
    : 'Lowest weight';

  const decayHtml = weight.decayPct > 0
    ? `<span class="source-detail-decay-badge" data-decay-pct="${weight.decayPct}" data-decay-days="${weight.daysOld}">−${weight.decayPct}% aged</span>`
    : '';

  const usesHtml = detail.uses.map((u) => `<li>${u}</li>`).join('');

  const iconInfo = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`;
  const iconWeight = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="10" cy="6" r="2" fill="currentColor" stroke="none"/><circle cx="16" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="8" cy="18" r="2" fill="currentColor" stroke="none"/></svg>`;
  const iconList = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="5" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="5" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>`;
  const iconArrow = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;

  document.getElementById('sdContent').innerHTML = `
    <div class="source-detail-head">
      <div class="source-detail-head-left">
        <div class="source-detail-name">${name}</div>
        <div class="source-detail-meta">
          <span class="source-cat-pill ${catClass}">${catLabel}</span>
          <span class="source-detail-date-inline">Updated ${dateStr}</span>
        </div>
      </div>
      <div class="source-detail-weight-wrap">
        <div class="source-detail-weight">${weight.decayPct > 0 ? weight.effective.toFixed(2) + '×' : weight.base.toFixed(1) + '×'}</div>
        <div class="source-detail-weight-rank">${weightRank}</div>
        ${decayHtml}
      </div>
    </div>
    ${weight.decayPct > 0 ? `
    <div class="source-detail-block source-block-decay">
      <h3><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Source Aging</h3>
      <p>This source is <strong>${weight.daysOld} days old</strong> — ${Math.max(0, weight.daysOld - 15)} days past the 15-day threshold. Its base weight of ${weight.base.toFixed(1)}× has been reduced to <strong>${weight.effective.toFixed(2)}×</strong> (−${weight.decayPct}%). Weight halves every 12 hours past the threshold.</p>
    </div>
    ` : ''}
    <div class="source-detail-block source-block-about">
      <h3>${iconInfo} About</h3>
      <p>${detail.whatItIs}</p>
    </div>
    <div class="source-detail-block source-block-weight">
      <h3>${iconWeight} Why ${weight.base.toFixed(1)}×</h3>
      <p>${detail.whyWeight}</p>
    </div>
    <div class="source-detail-block source-block-method">
      <h3>${iconList} ${typeLC.includes('data') ? 'Data inputs' : typeLC.includes('community') ? 'How it works' : 'Behind the list'}</h3>
      <ul>${usesHtml}</ul>
    </div>
    <a href="${url}" target="_blank" rel="noopener noreferrer" class="source-detail-link">
      View source ${iconArrow}
    </a>
  `;

  sdOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-source-name]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openSourceModal(
        btn.dataset.sourceName,
        btn.dataset.sourceDate,
        btn.dataset.sourceUrl,
        btn.dataset.sourceType
      );
    });
  });

  const copyBtn = document.getElementById('brawlerCopyBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(location.href).then(() => {
        const origHTML = copyBtn.innerHTML;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.innerHTML = origHTML; }, 1500);
      });
    });
  }
});
