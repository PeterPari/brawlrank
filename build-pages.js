#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Constants (must match app.js exactly)
// ---------------------------------------------------------------------------

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

const TIER_VALUES = { S: 6, A: 5, B: 4, C: 3, D: 2, F: 1 };

const TIER_THRESHOLDS = { S: 5.5, A: 4.5, B: 3.5, C: 2.5, D: 1.5 };

const TIER_ORDER = ['S', 'A', 'B', 'C', 'D', 'F'];

const TIER_COLORS = {
  S: '#ff2d55',
  A: '#ff9500',
  B: '#ffcc00',
  C: '#34c759',
  D: '#5ac8fa',
  F: '#8e8e93'
};

const BASE_URL = 'https://brawlrank.com';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
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

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJsonLd(str) {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/** Parse "March 16, 2026" → { month, year, isoDate } */
function parseLastUpdated(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return { month: 'March', year: '2026', isoDate: '2026-03-16' };
  }
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return {
    month: months[d.getMonth()],
    year: String(d.getFullYear()),
    isoDate: d.toISOString().split('T')[0]
  };
}

// ---------------------------------------------------------------------------
// Scoring (mirrors app.js calculateAllScores + buildTiersFromScores)
// ---------------------------------------------------------------------------

function calculateAllScores(brawlers) {
  brawlers.forEach((b) => {
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
      const mean = ratings.reduce((s, v) => s + v, 0) / ratings.length;
      const variance = ratings.reduce((s, v) => s + (v - mean) ** 2, 0) / ratings.length;
      b.disagreement = Math.round(Math.sqrt(variance) * 100) / 100;
    } else {
      b.disagreement = 0;
    }
  });

  brawlers.sort((a, b) => b.score - a.score);
}

function buildTiers(brawlers) {
  const tiers = { S: [], A: [], B: [], C: [], D: [], F: [] };
  const brawlerMap = {};
  brawlers.forEach((b) => { brawlerMap[b.name] = b; });

  brawlers.forEach((b) => {
    b.tier = getTierFromScore(b.score);
    tiers[b.tier].push(b.name);
  });

  TIER_ORDER.forEach((tier) => {
    tiers[tier].sort((a, b) => brawlerMap[b].score - brawlerMap[a].score);
  });

  return tiers;
}

function addPortraitPaths(brawlers) {
  brawlers.forEach((b) => {
    const match = b.icon.match(/(\d+)\.png$/);
    if (match) {
      b.portraitId = match[1];
      b.portrait = `portraits/${match[1]}.png`;
    }
  });
}

// ---------------------------------------------------------------------------
// Consensus helpers
// ---------------------------------------------------------------------------

function getConsensus(disagreement) {
  if (disagreement < 0.8) return { label: 'Strong', detail: 'most sources agree on this placement' };
  if (disagreement < 1.5) return { label: 'Moderate', detail: 'some disagreement between sources' };
  return { label: 'Weak', detail: 'sources disagree significantly on this placement' };
}

// ---------------------------------------------------------------------------
// "What This Means" content
// ---------------------------------------------------------------------------

function getWhatThisMeans(name, tier) {
  switch (tier) {
    case 'S':
      return `${name} is one of the strongest brawlers in the current Brawl Stars meta. Ranked S Tier by the majority of sources, ${name} dominates across most game modes and is a top pick in competitive play. If you\u2019re looking to climb trophies or win in Power League, ${name} is an excellent choice right now.`;
    case 'A':
      return `${name} is a strong contender in the current meta, sitting in A Tier. While not quite at the peak of S Tier, ${name} performs reliably across multiple game modes and is frequently seen in high-level play. A solid pick for competitive players.`;
    case 'B':
      return `${name} is a solid mid-tier brawler, rated B Tier. ${name} is viable in most game modes but faces tough competition from higher-tier picks. Good map and mode selection can make ${name} very effective.`;
    case 'C':
      return `${name} sits in C Tier, meaning ${name} is below average in the current meta. While ${name} can work in specific game modes or maps, there are generally better alternatives. Consider using ${name} in niche situations where the matchup favors them.`;
    case 'D':
      return `${name} is struggling in the current meta at D Tier. Most sources agree that ${name} underperforms compared to the majority of the roster. Unless you have strong personal skill with ${name}, consider other brawlers for competitive play.`;
    case 'F':
      return `${name} is at the bottom of the meta rankings in F Tier. Across 9 sources, ${name} consistently receives the lowest ratings. Balance changes may improve ${name}\u2019s standing in future updates.`;
    default:
      return '';
  }
}

// ---------------------------------------------------------------------------
// Source breakdown for brawler page
// ---------------------------------------------------------------------------

function buildSourceBreakdown(brawler) {
  const rows = [];

  // Noff.gg merged
  const noffTop = brawler.sources['Noff.gg'];
  const noffRanked = brawler.sources['Noff Ranked'];
  if (noffTop || noffRanked) {
    const displayTier = brawler.noffMergedTier || noffTop || noffRanked;
    let detail = '';
    if (noffTop && noffRanked) {
      detail = ` <span class="source-merge-detail">(Top 200: ${noffTop}, Ranked: ${noffRanked})</span>`;
    }
    rows.push({ sourceName: 'Noff.gg', tier: displayTier, weight: 1.5, detail });
  }

  for (const [sourceName, weight] of Object.entries(SOURCE_WEIGHTS)) {
    if (sourceName === 'Noff.gg') continue;
    const tier = brawler.sources[sourceName];
    if (!tier) continue;
    rows.push({ sourceName, tier, weight, detail: '' });
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Brawler page HTML
// ---------------------------------------------------------------------------

function generateBrawlerPage(brawler, allBrawlers, tiers, dateInfo) {
  const { name, score, tier, disagreement, portrait, portraitId, num_sources } = brawler;
  const slug = slugify(name);
  const consensus = getConsensus(disagreement);
  const canonicalUrl = `${BASE_URL}/brawlers/${slug}/`;
  const cdnImage = brawler.icon;
  const monthYear = `${dateInfo.month} ${dateInfo.year}`;
  const scoreStr = score.toFixed(2);
  const scorePct = ((score / 6) * 100).toFixed(1);
  const tierColor = TIER_COLORS[tier];

  const rank = allBrawlers.indexOf(brawler) + 1;
  const prevBrawler = rank > 1 ? allBrawlers[rank - 2] : null;
  const nextBrawler = rank < allBrawlers.length ? allBrawlers[rank] : null;

  const sameTier = allBrawlers.filter(b => b.tier === tier && b.name !== name);

  const sourceRows = buildSourceBreakdown(brawler);
  const sourceRowsHtml = sourceRows.map(r => {
    const tc = TIER_COLORS[r.tier] || '#8e8e93';
    return `<li class="source-row">
      <span class="source-tier-badge" style="background:${tc};">${escapeHtml(r.tier)}</span>
      <span class="source-name">${escapeHtml(r.sourceName)}</span>
      <span class="source-weight">${r.weight.toFixed(1)}\u00D7</span>
      ${r.detail}
    </li>`;
  }).join('\n          ');

  const sameTierLinks = sameTier.map(b =>
    `<a href="/brawlers/${slugify(b.name)}/" class="same-tier-link">${escapeHtml(b.name)}</a>`
  ).join('\n            ');

  const prevLink = prevBrawler
    ? `<a href="/brawlers/${slugify(prevBrawler.name)}/" class="adj-link adj-prev">\u2190 ${escapeHtml(prevBrawler.name)} (ranked #${allBrawlers.indexOf(prevBrawler) + 1})</a>`
    : '<span class="adj-link adj-prev"></span>';
  const nextLink = nextBrawler
    ? `<a href="/brawlers/${slugify(nextBrawler.name)}/" class="adj-link adj-next">${escapeHtml(nextBrawler.name)} (ranked #${allBrawlers.indexOf(nextBrawler) + 1}) \u2192</a>`
    : '<span class="adj-link adj-next"></span>';

  const metaDesc = `${name} is ${tier} Tier in Brawl Stars (${scoreStr}/6.00). Ranked by ${num_sources} sources including Noff.gg, SpenLC, and KairosTime. ${consensus.label} consensus \u2014 ${consensus.detail}. Updated ${dateInfo.month} ${dateInfo.year}.`;

  const articleJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${name} Meta Ranking \u2014 Brawl Stars Tier List`,
    description: `${name} is currently rated ${tier} Tier with a score of ${scoreStr}/6.00 across ${num_sources} sources.`,
    author: { '@type': 'Organization', name: 'BrawlRank' },
    dateModified: dateInfo.isoDate,
    about: { '@type': 'Thing', name, description: 'A Brawl Stars brawler' },
    isPartOf: { '@type': 'WebSite', name: 'BrawlRank', url: `${BASE_URL}/` }
  }, null, 2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(name)} Tier &amp; Meta Ranking \u2014 BrawlRank (${monthYear})</title>
<meta name="description" content="${escapeHtml(metaDesc)}">
<meta name="author" content="BrawlRank">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<link rel="canonical" href="${canonicalUrl}">
<meta property="article:modified_time" content="${dateInfo.isoDate}T00:00:00Z">
<meta name="theme-color" content="#00e5ff">
<link rel="icon" type="image/svg+xml" href="../../BRlogo.svg" sizes="any">
<link rel="icon" type="image/png" sizes="64x64" href="../../favicon.png">
<link rel="icon" type="image/png" sizes="32x32" href="../../favicon-32.png">

<!-- Open Graph -->
<meta property="og:type" content="article">
<meta property="og:url" content="${canonicalUrl}">
<meta property="og:title" content="${escapeHtml(name)} Tier &amp; Meta Ranking \u2014 BrawlRank (${monthYear})">
<meta property="og:description" content="${escapeHtml(metaDesc)}">
<meta property="og:image" content="${cdnImage}">
<meta property="og:site_name" content="BrawlRank">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(name)} Tier &amp; Meta Ranking \u2014 BrawlRank (${monthYear})">
<meta name="twitter:description" content="${escapeHtml(metaDesc)}">
<meta name="twitter:image" content="${cdnImage}">

<script type="application/ld+json">
${articleJsonLd}
</script>

<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1616218690402516"
     crossorigin="anonymous"></script>

<link rel="preconnect" href="https://fonts.cdnfonts.com" crossorigin>
<link href="https://fonts.cdnfonts.com/css/clash-display" rel="stylesheet">
<link href="https://fonts.cdnfonts.com/css/satoshi" rel="stylesheet">
<link rel="stylesheet" href="../../styles.css">

<style>
  /* Brawler page specific styles */
  .brawler-page-header { display:flex; align-items:center; gap:12px; padding:18px 0 8px; }
  .brawler-page-header .back-link { color:var(--accent); text-decoration:none; font-size:15px; font-weight:600; }
  .brawler-page-header .back-link:hover { text-decoration:underline; }

  .hero-section { text-align:center; padding:32px 0 24px; }
  .hero-portrait { width:120px; height:120px; border-radius:20px; border:3px solid ${tierColor}; box-shadow:0 0 24px ${tierColor}44; }
  .hero-title { font-family:'Clash Display',sans-serif; font-size:clamp(1.6rem,4vw,2.2rem); color:#fff; margin:16px 0 8px; }
  .hero-tier-badge { display:inline-block; padding:4px 18px; border-radius:8px; font-weight:700; font-size:18px; color:#fff; background:${tierColor}; }

  .score-section { text-align:center; padding:16px 0; }
  .score-big { font-family:'Clash Display',sans-serif; font-size:clamp(2rem,5vw,3rem); color:#fff; }
  .score-big span { color:var(--text-muted); font-size:0.5em; }
  .score-bar-wrap { max-width:360px; margin:12px auto 0; height:10px; border-radius:5px; background:rgba(255,255,255,0.06); overflow:hidden; }
  .score-bar-fill { height:100%; border-radius:5px; background:${tierColor}; width:${scorePct}%; }

  .consensus-section { text-align:center; padding:8px 0 20px; color:var(--text-muted); font-size:15px; }
  .consensus-label { font-weight:700; color:#fff; }

  .detail-card { background:var(--card-bg,#181822); border:1px solid rgba(255,255,255,0.06); border-radius:18px; padding:24px; margin-bottom:20px; }
  .detail-card h2 { font-family:'Clash Display',sans-serif; font-size:1.15rem; color:#fff; margin:0 0 14px; }
  .detail-card p { color:var(--text-muted,#9898a6); line-height:1.7; margin:0; }

  .source-list { list-style:none; padding:0; margin:0; }
  .source-row { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.04); font-size:14px; color:#ccc; }
  .source-row:last-child { border-bottom:none; }
  .source-tier-badge { display:inline-block; width:28px; height:28px; line-height:28px; text-align:center; border-radius:6px; font-weight:700; font-size:13px; color:#fff; flex-shrink:0; }
  .source-name { flex:1; }
  .source-weight { color:var(--text-muted,#9898a6); font-size:13px; }
  .source-merge-detail { color:var(--text-muted,#9898a6); font-size:12px; }

  .same-tier-list { display:flex; flex-wrap:wrap; gap:8px; }
  .same-tier-link { display:inline-block; padding:6px 14px; border-radius:10px; background:rgba(255,255,255,0.04); color:#ccc; text-decoration:none; font-size:13px; font-weight:500; border:1px solid rgba(255,255,255,0.06); transition:background .15s; }
  .same-tier-link:hover { background:rgba(255,255,255,0.08); color:#fff; }

  .adj-nav { display:flex; justify-content:space-between; padding:20px 0 32px; gap:12px; flex-wrap:wrap; }
  .adj-link { color:var(--accent,#00e5ff); text-decoration:none; font-size:14px; font-weight:600; }
  .adj-link:hover { text-decoration:underline; }
  .adj-prev { text-align:left; }
  .adj-next { text-align:right; margin-left:auto; }
</style>
</head>
<body>

<!-- HEADER -->
<header class="header">
  <div class="container">
    <div class="brawler-page-header">
      <a href="/" class="hero-brand" style="display:flex;align-items:center;gap:10px;text-decoration:none;">
        <img class="logo-img" src="../../BRlogo.svg" alt="BrawlRank" draggable="false" style="width:36px;height:36px;">
        <span style="font-family:'Clash Display',sans-serif;font-size:1.1rem;color:#fff;font-weight:700;">BrawlRank</span>
      </a>
      <a href="/" class="back-link">\u2190 Back to Tier List</a>
    </div>
  </div>
</header>

<main>
  <div class="container">

    <!-- HERO -->
    <section class="hero-section">
      <img class="hero-portrait" src="../../${portrait}" alt="${escapeHtml(name)} portrait" width="120" height="120">
      <h1 class="hero-title">${escapeHtml(name)} \u2014 ${tier} Tier</h1>
      <div class="hero-tier-badge">${tier} Tier</div>
    </section>

    <!-- SCORE -->
    <section class="score-section">
      <div class="score-big">${scoreStr} <span>/ 6.00</span></div>
      <div class="score-bar-wrap"><div class="score-bar-fill"></div></div>
    </section>

    <!-- CONSENSUS -->
    <section class="consensus-section">
      Source agreement: <span class="consensus-label">${consensus.label} consensus</span> (\u03C3 = ${brawler.disagreement.toFixed(2)}) \u2014 ${consensus.detail}
    </section>

    <!-- SOURCE BREAKDOWN -->
    <div class="detail-card">
      <h2>Source Breakdown</h2>
      <ul class="source-list">
          ${sourceRowsHtml}
      </ul>
    </div>

    <!-- WHAT THIS MEANS -->
    <div class="detail-card">
      <h2>What This Means</h2>
      <p>${escapeHtml(getWhatThisMeans(name, tier))}</p>
    </div>

    <!-- METHODOLOGY -->
    <div class="detail-card">
      <h2>Methodology</h2>
      <p><strong>BrawlRank</strong> aggregates tier lists from <strong>9 independent sources</strong> including data platforms, pro players, content creators, and community votes. Each source rates brawlers from S (best) to F (worst). Scores are weighted and averaged to produce an objective meta ranking. <a href="/" style="color:var(--accent,#00e5ff);">View the full tier list \u2192</a></p>
    </div>

    <!-- SAME TIER BRAWLERS -->
    ${sameTier.length > 0 ? `<div class="detail-card">
      <h2>Other ${tier} Tier Brawlers</h2>
      <div class="same-tier-list">
            ${sameTierLinks}
      </div>
    </div>` : ''}

    <!-- ADJACENT NAV -->
    <nav class="adj-nav">
      ${prevLink}
      ${nextLink}
    </nav>

  </div>
</main>

<!-- FOOTER -->
<footer class="footer">
  <div class="container">
    <div class="footer-links">
      <a href="https://tech-savvies.com/" target="_blank" rel="noopener noreferrer">Created by Tech-savvies</a>
      <a href="https://brawlify.com" target="_blank" rel="noopener noreferrer">Data sourced from Brawlify</a>
    </div>
    <p class="footer-tm">Brawl Stars is a trademark of Supercell</p>
  </div>
</footer>

<div id="consent" class="consent-bar" hidden>
  <span>We use analytics to improve BrawlRank.</span>
  <button id="acceptBtn" type="button">Accept</button>
</div>

<script>
(function(){
  var CONSENT_KEY='consent',CLARITY_ID='vwyrtsgbq7';
  var bar=document.getElementById('consent'),btn=document.getElementById('acceptBtn');
  if(!bar||!btn)return;
  function load(){
    if(document.querySelector('script[data-clarity]'))return;
    window.clarity=window.clarity||function(){(window.clarity.q=window.clarity.q||[]).push(arguments)};
    var s=document.createElement('script');s.async=true;s.src='https://www.clarity.ms/tag/'+CLARITY_ID;s.dataset.clarity='true';document.head.appendChild(s);
  }
  try{if(localStorage.getItem(CONSENT_KEY)==='1'){bar.hidden=true;load();return;}}catch(e){}
  bar.hidden=false;document.body.classList.add('consent-visible');
  btn.addEventListener('click',function(){try{localStorage.setItem(CONSENT_KEY,'1')}catch(e){}bar.hidden=true;document.body.classList.remove('consent-visible');load()},{once:true});
})();
</script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Pre-rendered tier list HTML for index.html
// ---------------------------------------------------------------------------

function buildPreRenderedTierList(brawlers, tiers, brawlerMap) {
  const rows = [];

  TIER_ORDER.forEach((tier) => {
    const names = tiers[tier];
    let brawlersHtml = '';

    if (names.length === 0 && tier === 'F') {
      brawlersHtml = '<span style="font-size:13px;color:var(--text-muted);font-style:italic;padding:4px 8px;">No brawlers in this tier</span>';
    }

    names.forEach((name) => {
      const b = brawlerMap[name];
      if (!b) return;
      const slug = slugify(name);
      const imgSrc = b.portrait || b.icon;
      brawlersHtml += `
      <a href="/brawlers/${slug}/" class="brawler-icon-wrap" data-name="${escapeHtml(name.toLowerCase())}">
        <img class="brawler-icon" src="${imgSrc}" alt="${escapeHtml(name)} \u2014 ${tier} Tier Brawl Stars brawler" width="58" height="58" loading="lazy" decoding="async">
        <div class="brawler-tooltip"><span class="tt-name">${escapeHtml(name)}</span><span class="tt-score">${b.score.toFixed(2)}</span></div>
        <div class="brawler-name-label">${escapeHtml(name)}</div>
      </a>`;
    });

    rows.push(`<div class="tier-row tier-${tier.toLowerCase()}">
    <div class="tier-label">${tier}</div>
    <div class="tier-brawlers">${brawlersHtml}
    </div>
  </div>`);
  });

  return rows.join('\n  ');
}

// ---------------------------------------------------------------------------
// ItemList JSON-LD
// ---------------------------------------------------------------------------

function buildItemListJsonLd(brawlers, dateInfo) {
  const monthYear = `${dateInfo.month} ${dateInfo.year}`;
  const items = brawlers.map((b, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: b.name,
    url: `${BASE_URL}/brawlers/${slugify(b.name)}/`
  }));

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Brawl Stars Meta Tier List \u2014 ${monthYear}`,
    description: `${brawlers.length} brawlers ranked by aggregating 9 pro, data, and community sources`,
    numberOfItems: brawlers.length,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    itemListElement: items
  }, null, 2);
}

// ---------------------------------------------------------------------------
// Sitemap
// ---------------------------------------------------------------------------

function buildSitemap(brawlers, dateInfo) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${dateInfo.isoDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`;

  brawlers.forEach((b) => {
    xml += `
  <url>
    <loc>${BASE_URL}/brawlers/${slugify(b.name)}/</loc>
    <lastmod>${dateInfo.isoDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  });

  xml += '\n</urlset>\n';
  return xml;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const rootDir = __dirname;

  // Load data
  const data = JSON.parse(fs.readFileSync(path.join(rootDir, 'data.json'), 'utf8'));
  const dateInfo = parseLastUpdated(data.last_updated);
  console.log(`[build] Loaded data.json — ${data.brawlers.length} brawlers, last updated ${data.last_updated}`);

  // Compute scores (mirrors app.js)
  const brawlers = data.brawlers;
  addPortraitPaths(brawlers);
  calculateAllScores(brawlers);

  const brawlerMap = {};
  brawlers.forEach((b) => { brawlerMap[b.name] = b; });

  const tiers = buildTiers(brawlers);

  // --------------------------------------------------
  // 1. Generate individual brawler pages
  // --------------------------------------------------
  const brawlersDir = path.join(rootDir, 'brawlers');
  if (!fs.existsSync(brawlersDir)) fs.mkdirSync(brawlersDir);

  let pageCount = 0;
  brawlers.forEach((b) => {
    const slug = slugify(b.name);
    const dir = path.join(brawlersDir, slug);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const html = generateBrawlerPage(b, brawlers, tiers, dateInfo);
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
    pageCount++;
  });
  console.log(`[build] Generated ${pageCount} brawler pages in brawlers/`);

  // --------------------------------------------------
  // 2. Generate sitemap.xml
  // --------------------------------------------------
  const sitemap = buildSitemap(brawlers, dateInfo);
  fs.writeFileSync(path.join(rootDir, 'sitemap.xml'), sitemap, 'utf8');
  console.log(`[build] Wrote sitemap.xml (${1 + brawlers.length} URLs)`);

  // --------------------------------------------------
  // 3 & 4. Inject ItemList JSON-LD and pre-rendered tier list into index.html
  // --------------------------------------------------
  let indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');

  // Inject ItemList JSON-LD after the existing WebApplication JSON-LD block
  const itemListJsonLd = buildItemListJsonLd(brawlers, dateInfo);
  const itemListScript = `<script type="application/ld+json">\n${itemListJsonLd}\n</script>`;

  // Remove any previously injected ItemList block (idempotency)
  indexHtml = indexHtml.replace(/\n<script type="application\/ld\+json">\n\{[^}]*"@type":\s*"ItemList"[\s\S]*?\}\n<\/script>/g, '');

  // Insert after the closing </script> of the WebApplication block
  const webAppClosing = '</script>\n<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
  if (indexHtml.includes(webAppClosing)) {
    indexHtml = indexHtml.replace(
      webAppClosing,
      `</script>\n${itemListScript}\n<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js`
    );
  } else {
    // Fallback: insert before </head>
    indexHtml = indexHtml.replace('</head>', `${itemListScript}\n</head>`);
  }
  console.log('[build] Injected ItemList JSON-LD into index.html');

  // Inject pre-rendered tier list into #tierContainer
  const preRendered = buildPreRenderedTierList(brawlers, tiers, brawlerMap);
  // Match the tier container div (with or without existing content)
  indexHtml = indexHtml.replace(
    /<div class="container" id="tierContainer">[\s\S]*?<\/div>\n<\/section>/,
    `<div class="container" id="tierContainer">\n  ${preRendered}\n  </div>\n</section>`
  );
  console.log('[build] Injected pre-rendered tier list into index.html #tierContainer');

  fs.writeFileSync(path.join(rootDir, 'index.html'), indexHtml, 'utf8');
  console.log('[build] Wrote index.html');

  console.log('[build] Done!');
}

main();
