#!/usr/bin/env node
/**
 * build-pages.js
 *
 * Generates:
 *  1. Pre-rendered HTML content inside index.html (tier list, FAQ, about)
 *  2. Individual brawler pages under /brawlers/<slug>.html
 *  3. Expanded sitemap.xml with all page URLs
 *
 * Run:  node build-pages.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DATA_PATH = path.join(ROOT, 'data.json');
const INDEX_PATH = path.join(ROOT, 'index.html');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');
const BRAWLERS_DIR = path.join(ROOT, 'brawlers');

const SITE_URL = 'https://brawlrank.com';

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
const TIER_LABELS = {
  S: 'S Tier — the strongest brawlers in the current meta',
  A: 'A Tier — very strong picks that perform well across modes',
  B: 'B Tier — solid brawlers with reliable performance',
  C: 'C Tier — average brawlers that work in specific situations',
  D: 'D Tier — below average brawlers that struggle in most modes',
  F: 'F Tier — the weakest brawlers in the current meta'
};

/* ---------- helpers ---------- */

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

function computeBrawlers(data) {
  const brawlers = data.brawlers.map((b) => {
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

    const noffMergedTier = mergedNoffValue !== null ? valueToTier(mergedNoffValue) : null;

    for (const [sourceName, weight] of Object.entries(SOURCE_WEIGHTS)) {
      if (sourceName === 'Noff.gg') continue;
      const tier = b.sources[sourceName];
      if (!tier) continue;
      const value = TIER_VALUES[tier];
      weightedSum += value * weight;
      totalWeight += weight;
      ratings.push(value);
    }

    const score = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : 0;
    const numSources = ratings.length;

    let disagreement = 0;
    if (ratings.length > 0) {
      const mean = ratings.reduce((s, v) => s + v, 0) / ratings.length;
      const variance = ratings.reduce((s, v) => s + (v - mean) ** 2, 0) / ratings.length;
      disagreement = Math.round(Math.sqrt(variance) * 100) / 100;
    }

    const tier = getTierFromScore(score);

    const match = b.icon.match(/(\d+)\.png$/);
    const portraitId = match ? match[1] : null;
    const portrait = portraitId ? `portraits/${portraitId}.png` : null;

    return {
      ...b,
      score,
      tier,
      numSources,
      disagreement,
      noffMergedTier,
      portrait,
      slug: slugify(b.name)
    };
  });

  brawlers.sort((a, b) => b.score - a.score);
  return brawlers;
}

function buildTiers(brawlers) {
  const tiers = { S: [], A: [], B: [], C: [], D: [], F: [] };
  brawlers.forEach((b) => tiers[b.tier].push(b));
  return tiers;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ---------- pre-render tier list HTML ---------- */

function renderPreRenderedTierList(tiers, brawlers) {
  let html = '<!-- PRE-RENDERED TIER LIST (replaced by JS at runtime) -->\n';
  html += '<noscript><style>.prerendered-tiers{display:block!important}</style></noscript>\n';
  html += '<div class="prerendered-tiers" id="prerenderedTiers">\n';

  for (const tier of TIER_ORDER) {
    const items = tiers[tier];
    html += `  <div class="tier-row tier-${tier.toLowerCase()}">\n`;
    html += `    <div class="tier-label">${tier}</div>\n`;
    html += `    <div class="tier-brawlers">\n`;

    if (items.length === 0 && tier === 'F') {
      html += '      <span style="font-size:13px;color:var(--text-muted);font-style:italic;padding:4px 8px;">No brawlers in this tier</span>\n';
    }

    items.forEach((b) => {
      const imgSrc = b.portrait || b.icon;
      html += `      <a class="brawler-icon-wrap" href="brawlers/${b.slug}.html" data-name="${escapeHtml(b.name.toLowerCase())}" title="${escapeHtml(b.name)} — ${b.tier} Tier (${b.score.toFixed(2)})">\n`;
      html += `        <img class="brawler-icon" src="${imgSrc}" alt="${escapeHtml(b.name)}" loading="lazy" decoding="async" width="56" height="56">\n`;
      html += `        <div class="brawler-tooltip"><span class="tt-name">${escapeHtml(b.name)}</span><span class="tt-score">${b.score.toFixed(2)}</span></div>\n`;
      html += `        <div class="brawler-name-label">${escapeHtml(b.name)}</div>\n`;
      html += `      </a>\n`;
    });

    html += '    </div>\n';
    html += '  </div>\n';
  }

  html += '</div>\n';
  return html;
}

/* ---------- pre-render sources grid ---------- */

function renderPreRenderedSourcesGrid(data) {
  let html = '<!-- PRE-RENDERED SOURCES GRID -->\n';
  html += '<div class="prerendered-sources" id="prerenderedSources">\n';

  data.sources.forEach((src) => {
    const weight = SOURCE_WEIGHTS[src.name] || 1.0;
    html += `  <div class="source-card">\n`;
    html += `    <div class="source-card-name">${escapeHtml(src.name)}</div>\n`;
    html += `    <div class="source-card-type">${escapeHtml(src.type)}</div>\n`;
    html += `    <div class="source-card-meta">\n`;
    html += `      <span>${escapeHtml(src.date)}</span>\n`;
    html += `      <span>${weight.toFixed(1)}&times; weight</span>\n`;
    html += `    </div>\n`;
    html += `    <a href="${src.url}" target="_blank" rel="noopener noreferrer" class="source-card-link">View source &rarr;</a>\n`;
    html += `  </div>\n`;
  });

  html += '</div>\n';
  return html;
}

/* ---------- FAQ section ---------- */

function renderFAQSection(data, brawlers, tiers) {
  const sTierNames = tiers.S.map((b) => b.name).join(', ');
  const dTierNames = tiers.D.map((b) => b.name).slice(0, 5).join(', ');
  const totalBrawlers = brawlers.length;

  const faqs = [
    {
      q: `What is BrawlRank?`,
      a: `BrawlRank is a free, community-driven tool that creates an aggregated Brawl Stars tier list by combining rankings from ${data.total_sources} independent sources — including professional players, data-driven platforms, content creators, and community votes. Instead of relying on a single opinion, BrawlRank uses a weighted averaging model to produce a balanced, transparent meta ranking of all ${totalBrawlers} brawlers. The rankings are updated weekly to reflect the latest game balance changes.`
    },
    {
      q: `Which brawlers are S Tier right now?`,
      a: `As of ${data.last_updated}, the current S Tier brawlers are: ${sTierNames}. These brawlers have the highest weighted average scores (5.50 or above out of 6.00) across all ${data.total_sources} sources, meaning both data platforms and professional players agree they are the strongest picks in the current meta.`
    },
    {
      q: `How are the tier rankings calculated?`,
      a: `Each of the ${data.total_sources} sources rates every brawler from S (best) to F (worst). BrawlRank converts these into numerical scores (S=6, A=5, B=4, C=3, D=2, F=1), applies source-specific weights that prioritize empirical data over subjective opinion, and calculates a weighted average. Data sources like Noff.gg (1.5&times;) and MmonsteR (1.3&times;) receive the highest weights, while editorial and community sources receive lower weights. The final tier is determined by score thresholds: S&ge;5.5, A&ge;4.5, B&ge;3.5, C&ge;2.5, D&ge;1.5, F&lt;1.5.`
    },
    {
      q: `How often is BrawlRank updated?`,
      a: `BrawlRank is updated weekly to keep pace with Brawl Stars balance patches, new brawler releases, and shifts in the competitive meta. Each update incorporates the latest tier lists published by all ${data.total_sources} sources. The most recent update was on ${data.last_updated}.`
    },
    {
      q: `What sources does BrawlRank use?`,
      a: `BrawlRank aggregates ${data.total_sources} independent sources: ${data.sources.map((s) => s.name).join(', ')}. These include automated data platforms that track win rates and pick rates of top players, professional esports players with championship-level experience, content creators who collaborate with pros, and community voting platforms with over 300,000 votes. Each source is weighted based on the objectivity and reliability of its methodology.`
    },
    {
      q: `Why do some sources have higher weights than others?`,
      a: `Source weights reflect the objectivity and evidentiary strength of each input. Data platforms like Noff.gg (1.5&times;) measure actual player performance statistics — win rates, pick rates, and usage trends — making them the most objective. Professional players (1.0&times;) provide valuable competitive insight but are subject to personal bias. Content creators (0.7&ndash;0.8&times;) add informed analysis but filter information through an editorial lens. Community votes (0.3&times;) capture player sentiment but often diverge from competitive reality, so they receive the lowest weight.`
    },
    {
      q: `What does "source agreement" mean for a brawler?`,
      a: `Source agreement (displayed as a sigma value) measures how much the ${data.total_sources} sources agree on a brawler's strength. Strong consensus (σ&lt;0.8) means most sources rate the brawler similarly — the placement is reliable. Moderate consensus (0.8&le;σ&lt;1.5) indicates some disagreement. Weak consensus (σ&ge;1.5) means sources strongly disagree, and the brawler's true strength is contested. A brawler with weak consensus may be meta-dependent, meaning it performs very differently across game modes or skill levels.`
    },
    {
      q: `Can I see how each individual source rated a specific brawler?`,
      a: `Yes. Click or tap any brawler in the tier list to open their detail card. The card shows the brawler's overall score, tier placement, and a complete breakdown of how each of the ${data.total_sources} sources rated them. You can also click on any source name within the breakdown to see detailed information about that source, including what it is, why it's weighted the way it is, and what data or methodology it uses.`
    }
  ];

  let html = '<!-- FAQ SECTION -->\n';
  html += '<section class="faq-section">\n';
  html += '  <div class="container">\n';
  html += '    <h2 class="section-heading">Frequently Asked Questions</h2>\n';
  html += '    <p class="section-sub">Common questions about BrawlRank and how the tier list works.</p>\n';
  html += '    <div class="faq-list">\n';

  faqs.forEach((faq) => {
    html += '      <details class="faq-item">\n';
    html += `        <summary class="faq-question">${faq.q}</summary>\n`;
    html += `        <div class="faq-answer"><p>${faq.a}</p></div>\n`;
    html += '      </details>\n';
  });

  html += '    </div>\n';
  html += '  </div>\n';
  html += '</section>\n';

  return { html, faqs };
}

/* ---------- About section ---------- */

function renderAboutSection(data, brawlers) {
  let html = '<!-- ABOUT SECTION -->\n';
  html += '<section class="about-section">\n';
  html += '  <div class="container">\n';
  html += '    <h2 class="section-heading">About BrawlRank</h2>\n';
  html += '    <div class="about-grid">\n';
  html += '      <div class="about-card">\n';
  html += '        <h3>Why an aggregated tier list?</h3>\n';
  html += '        <p>No single tier list tells the whole story. A professional player sees the meta through the lens of tournament play. A data platform tracks what works at the top of the leaderboard. A community vote reflects what the majority of players experience. Each perspective is valuable — but incomplete on its own.</p>\n';
  html += '        <p>BrawlRank solves this by combining all these perspectives into a single, balanced ranking. By aggregating ' + data.total_sources + ' independent sources with carefully calibrated weights, BrawlRank produces a tier list that accounts for competitive performance, statistical evidence, expert opinion, and community sentiment simultaneously.</p>\n';
  html += '      </div>\n';
  html += '      <div class="about-card">\n';
  html += '        <h3>Transparency first</h3>\n';
  html += '        <p>Every ranking on BrawlRank is fully transparent. You can see exactly which sources contributed to each brawler\'s placement, how much weight each source carries, and why. There are no hidden algorithms or undisclosed sponsorships influencing the rankings.</p>\n';
  html += '        <p>BrawlRank is open-source — the complete codebase, methodology, and data are available on <a href="https://github.com/PeterPari/brawlrank" target="_blank" rel="noopener noreferrer">GitHub</a> for anyone to inspect, audit, or contribute to.</p>\n';
  html += '      </div>\n';
  html += '      <div class="about-card">\n';
  html += '        <h3>How to use BrawlRank</h3>\n';
  html += '        <p>Browse the tier list to see which brawlers are strongest in the current meta. Click any brawler to view their detailed score breakdown across all ' + data.total_sources + ' sources. Use the search bar to quickly find a specific brawler. Check the Sources section to understand each data provider and their methodology.</p>\n';
  html += '        <p>BrawlRank ranks all ' + brawlers.length + ' brawlers in Brawl Stars and is updated weekly after each balance patch. Share individual brawler rankings with friends using the copy link or tweet buttons in each brawler card.</p>\n';
  html += '      </div>\n';
  html += '    </div>\n';
  html += '  </div>\n';
  html += '</section>\n';

  return html;
}

/* ---------- structured data ---------- */

function buildFAQSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a.replace(/&times;/g, '×').replace(/&ge;/g, '≥').replace(/&lt;/g, '<').replace(/&ndash;/g, '–')
      }
    }))
  };
}

function buildItemListSchema(brawlers) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Brawl Stars Tier List — All Brawlers Ranked',
    description: 'Aggregated Brawl Stars tier list ranking all brawlers from S Tier to F Tier based on 9 independent data, pro, and community sources.',
    numberOfItems: brawlers.length,
    itemListElement: brawlers.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: `${b.name} — ${b.tier} Tier`,
      url: `${SITE_URL}/brawlers/${b.slug}.html`
    }))
  };
}

/* ---------- individual brawler pages ---------- */

function getConsensusLabel(disagreement) {
  if (disagreement < 0.8) return 'Strong';
  if (disagreement < 1.5) return 'Moderate';
  return 'Weak';
}

function getTierDescription(tier) {
  const map = {
    S: 'the strongest brawlers in the current Brawl Stars meta. S Tier brawlers are dominant picks that perform exceptionally well across most game modes and are frequently seen in competitive play.',
    A: 'very strong brawlers that perform well in competitive and ranked play. A Tier brawlers are excellent picks that slightly fall short of S Tier dominance but remain highly effective.',
    B: 'solid brawlers with reliable performance in many situations. B Tier brawlers are good choices that can hold their own but may be outperformed by higher-tier picks.',
    C: 'average brawlers that work best in specific game modes or team compositions. C Tier brawlers are situational picks that require the right conditions to shine.',
    D: 'below-average brawlers that struggle in the current meta. D Tier brawlers may have niche uses but are generally outclassed by stronger alternatives.',
    F: 'the weakest brawlers in the current meta. F Tier brawlers are at a significant disadvantage and are rarely effective in competitive play.'
  };
  return map[tier] || '';
}

function buildBrawlerPage(b, data, brawlers, tiers) {
  const rank = brawlers.findIndex((x) => x.name === b.name) + 1;
  const tierBrawlers = tiers[b.tier];
  const positionInTier = tierBrawlers.findIndex((x) => x.name === b.name) + 1;
  const consensus = getConsensusLabel(b.disagreement);
  const tierDesc = getTierDescription(b.tier);
  const pct = ((b.score / 6) * 100).toFixed(1);

  // Find neighbors
  const prevBrawler = rank > 1 ? brawlers[rank - 2] : null;
  const nextBrawler = rank < brawlers.length ? brawlers[rank] : null;

  // Build source breakdown text
  const sourceLines = data.sources.map((src) => {
    let rating;
    if (src.name === 'Noff.gg') {
      rating = b.noffMergedTier;
    } else {
      rating = b.sources[src.name];
    }
    return rating ? `${src.name}: ${rating} Tier` : null;
  }).filter(Boolean);

  const sourcesHTML = data.sources.map((src) => {
    let rating;
    if (src.name === 'Noff.gg') {
      rating = b.noffMergedTier;
    } else {
      rating = b.sources[src.name];
    }
    if (!rating) return '';
    return `            <tr><td>${escapeHtml(src.name)}</td><td><span class="bp-tier-pill bp-tier-${rating.toLowerCase()}">${rating}</span></td></tr>`;
  }).filter(Boolean).join('\n');

  // Other brawlers in same tier for internal links
  const sameTierLinks = tierBrawlers
    .filter((x) => x.name !== b.name)
    .slice(0, 8)
    .map((x) => `<a href="${x.slug}.html" class="bp-related-link">${escapeHtml(x.name)}</a>`)
    .join('\n            ');

  const metaDesc = `${b.name} is ${b.tier} Tier in BrawlRank's aggregated Brawl Stars tier list (${b.score.toFixed(2)}/6.00). See how ${b.numSources} sources rate ${b.name}, source agreement analysis, and full breakdown. Updated ${data.last_updated}.`;
  const imgSrc = b.portrait ? `../${b.portrait}` : b.icon;

  const brawlerSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${b.name} — ${b.tier} Tier in Brawl Stars (${data.last_updated})`,
    description: metaDesc,
    dateModified: new Date().toISOString().split('T')[0],
    author: { '@type': 'Organization', name: 'BrawlRank', url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'BrawlRank', url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/brawlers/${b.slug}.html`
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(b.name)} Tier Ranking — BrawlRank Brawl Stars Tier List</title>
<meta name="description" content="${escapeHtml(metaDesc)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${SITE_URL}/brawlers/${b.slug}.html">
<meta property="og:type" content="article">
<meta property="og:url" content="${SITE_URL}/brawlers/${b.slug}.html">
<meta property="og:title" content="${escapeHtml(b.name)} — ${b.tier} Tier in Brawl Stars">
<meta property="og:description" content="${escapeHtml(metaDesc)}">
<meta property="og:site_name" content="BrawlRank">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${escapeHtml(b.name)} — ${b.tier} Tier in Brawl Stars">
<meta name="twitter:description" content="${escapeHtml(metaDesc)}">
<script type="application/ld+json">
${JSON.stringify(brawlerSchema, null, 2)}
</script>
<link rel="icon" type="image/svg+xml" href="../BRlogo.svg" sizes="any">
<meta name="theme-color" content="#00e5ff">
<link href="https://fonts.cdnfonts.com/css/clash-display" rel="stylesheet">
<link href="https://fonts.cdnfonts.com/css/satoshi" rel="stylesheet">
<link rel="stylesheet" href="../styles.css">
</head>
<body>

<header class="header">
  <div class="container">
    <div class="hero-brand">
      <a href="../" class="logo-link"><img class="logo-img" src="../BRlogo.svg" alt="BrawlRank" draggable="false"></a>
      <div class="hero-copy">
        <h1 class="tagline">${escapeHtml(b.name)} — ${b.tier} Tier</h1>
        <p class="header-sub"><a href="../" class="header-home-link">BrawlRank</a>: Brawl Stars Tier List &mdash; Updated ${escapeHtml(data.last_updated)}</p>
      </div>
    </div>
  </div>
</header>

<main id="content">
  <section class="bp-hero">
    <div class="container">
      <div class="bp-card">
        <div class="bp-header">
          <img class="bp-portrait" src="${imgSrc}" alt="${escapeHtml(b.name)} portrait" width="96" height="96">
          <div class="bp-info">
            <h2 class="bp-name">${escapeHtml(b.name)}</h2>
            <span class="bp-tier-badge bp-tier-${b.tier.toLowerCase()}">${b.tier} Tier</span>
            <div class="bp-score">${b.score.toFixed(2)} <span class="bp-score-max">/ 6.00</span></div>
            <div class="bp-rank">Rank #${rank} of ${brawlers.length} brawlers</div>
          </div>
        </div>

        <div class="bp-score-bar-bg">
          <div class="bp-score-bar bp-tier-bg-${b.tier.toLowerCase()}" style="width:${pct}%"></div>
        </div>

        <div class="bp-consensus">
          <span class="bp-consensus-label">${consensus} source consensus</span>
          <span class="bp-consensus-sigma">(&sigma; = ${b.disagreement.toFixed(2)})</span>
        </div>
      </div>
    </div>
  </section>

  <section class="bp-detail">
    <div class="container">
      <div class="bp-content-grid">
        <div class="bp-main-content">
          <h2>About ${escapeHtml(b.name)}'s Tier Placement</h2>
          <p>${escapeHtml(b.name)} is currently ranked <strong>#${rank} out of ${brawlers.length}</strong> brawlers in BrawlRank's aggregated Brawl Stars tier list. With a weighted average score of <strong>${b.score.toFixed(2)} out of 6.00</strong>, ${escapeHtml(b.name)} falls into <strong>${b.tier} Tier</strong> — ${tierDesc}</p>

          <p>${escapeHtml(b.name)} is ranked #${positionInTier} within ${b.tier} Tier (${tierBrawlers.length} brawlers total in this tier). This placement is based on ratings from <strong>${b.numSources} independent sources</strong>, including data platforms tracking win rates and pick rates, professional players, content creators, and community votes.</p>

          <h3>Source Agreement Analysis</h3>
          <p>The sources show <strong>${consensus.toLowerCase()} consensus</strong> on ${escapeHtml(b.name)}'s placement (&sigma;&nbsp;=&nbsp;${b.disagreement.toFixed(2)}). ${consensus === 'Strong' ? `This means most sources agree on ${escapeHtml(b.name)}'s strength, making this a reliable and confident placement.` : consensus === 'Moderate' ? `This indicates some disagreement between sources — ${escapeHtml(b.name)} may perform differently depending on game modes, maps, or team compositions.` : `This means sources strongly disagree on ${escapeHtml(b.name)}'s strength. The brawler's true power level is contested and may be highly dependent on specific game modes, skill levels, or team compositions.`}</p>

          <h3>Source Breakdown</h3>
          <p>Here is how each of the ${b.numSources} sources rated ${escapeHtml(b.name)}:</p>
          <table class="bp-source-table">
            <thead><tr><th>Source</th><th>Rating</th></tr></thead>
            <tbody>
${sourcesHTML}
            </tbody>
          </table>
        </div>

        <aside class="bp-sidebar">
          <div class="bp-sidebar-card">
            <h3>Quick Facts</h3>
            <dl class="bp-facts">
              <dt>Current Tier</dt><dd>${b.tier} Tier</dd>
              <dt>Score</dt><dd>${b.score.toFixed(2)} / 6.00</dd>
              <dt>Overall Rank</dt><dd>#${rank} of ${brawlers.length}</dd>
              <dt>Sources</dt><dd>${b.numSources} sources</dd>
              <dt>Consensus</dt><dd>${consensus} (&sigma;&nbsp;${b.disagreement.toFixed(2)})</dd>
              <dt>Last Updated</dt><dd>${escapeHtml(data.last_updated)}</dd>
            </dl>
          </div>
${prevBrawler || nextBrawler ? `
          <div class="bp-sidebar-card">
            <h3>Nearby Rankings</h3>
            <div class="bp-neighbors">
${prevBrawler ? `              <a href="${prevBrawler.slug}.html" class="bp-neighbor-link"><span class="bp-neighbor-rank">#${rank - 1}</span> ${escapeHtml(prevBrawler.name)} <span class="bp-tier-pill bp-tier-${prevBrawler.tier.toLowerCase()}">${prevBrawler.tier}</span></a>` : ''}
              <span class="bp-neighbor-current"><span class="bp-neighbor-rank">#${rank}</span> ${escapeHtml(b.name)} <span class="bp-tier-pill bp-tier-${b.tier.toLowerCase()}">${b.tier}</span></span>
${nextBrawler ? `              <a href="${nextBrawler.slug}.html" class="bp-neighbor-link"><span class="bp-neighbor-rank">#${rank + 1}</span> ${escapeHtml(nextBrawler.name)} <span class="bp-tier-pill bp-tier-${nextBrawler.tier.toLowerCase()}">${nextBrawler.tier}</span></a>` : ''}
            </div>
          </div>` : ''}

          <div class="bp-sidebar-card">
            <h3>Also in ${b.tier} Tier</h3>
            <div class="bp-related">
            ${sameTierLinks}
            </div>
          </div>

          <div class="bp-sidebar-card">
            <a href="../" class="bp-back-link">&larr; View full tier list</a>
          </div>
        </aside>
      </div>
    </div>
  </section>

  <section class="bp-methodology">
    <div class="container">
      <h2>How BrawlRank Calculates Rankings</h2>
      <p>BrawlRank aggregates tier lists from <strong>${data.total_sources} independent sources</strong> including data platforms, pro players, content creators, and community votes. Each source rates brawlers from S (best) to F (worst). Numerical scores are assigned (S=6, A=5, B=4, C=3, D=2, F=1), source-specific weights are applied, and a weighted average is calculated. Data sources receive the highest weights because they measure actual player performance rather than subjective opinion.</p>
      <p><a href="../">View the full aggregated tier list</a> to see all ${brawlers.length} brawlers ranked, or explore the Sources section to learn about each data provider and their methodology.</p>
    </div>
  </section>
</main>

<footer class="footer">
  <div class="container">
    <div class="footer-links">
      <a href="https://tech-savvies.com/" target="_blank" rel="noopener noreferrer">Created by Tech-savvies</a>
      <a href="https://brawlify.com" target="_blank" rel="noopener noreferrer">Data sourced from Brawlify</a>
    </div>
    <p class="footer-tm">Brawl Stars is a trademark of Supercell</p>
  </div>
</footer>

</body>
</html>`;
}

/* ---------- sitemap ---------- */

function buildSitemap(brawlers) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Homepage
  xml += '  <url>\n';
  xml += `    <loc>${SITE_URL}/</loc>\n`;
  xml += '    <changefreq>weekly</changefreq>\n';
  xml += '    <priority>1.0</priority>\n';
  xml += '  </url>\n';

  // Brawler pages
  brawlers.forEach((b) => {
    xml += '  <url>\n';
    xml += `    <loc>${SITE_URL}/brawlers/${b.slug}.html</loc>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';
  });

  xml += '</urlset>\n';
  return xml;
}

/* ---------- update index.html ---------- */

function updateIndexHtml(data, brawlers, tiers) {
  let html = fs.readFileSync(INDEX_PATH, 'utf8');

  // 1. Inject pre-rendered tier list inside #tierContainer
  const tierContainerMarker = '<div class="container" id="tierContainer"></div>';
  const tierContainerReplacement = `<div class="container" id="tierContainer">\n${renderPreRenderedTierList(tiers, brawlers)}</div>`;
  html = html.replace(tierContainerMarker, tierContainerReplacement);

  // 2. Inject pre-rendered sources grid inside #sourcesGrid
  const sourcesGridMarker = '<div class="sources-grid" id="sourcesGrid"></div>';
  const sourcesGridReplacement = `<div class="sources-grid" id="sourcesGrid">\n${renderPreRenderedSourcesGrid(data)}</div>`;
  html = html.replace(sourcesGridMarker, sourcesGridReplacement);

  // 3. Add FAQ and About sections before </main>
  const { html: faqHTML, faqs } = renderFAQSection(data, brawlers, tiers);
  const aboutHTML = renderAboutSection(data, brawlers);
  const mainCloseTag = '</main>';
  html = html.replace(mainCloseTag, `\n${faqHTML}\n${aboutHTML}${mainCloseTag}`);

  // 4. Add FAQPage and ItemList structured data
  const faqSchema = buildFAQSchema(faqs);
  const itemListSchema = buildItemListSchema(brawlers);
  const schemaInject = `<script type="application/ld+json">\n${JSON.stringify(faqSchema, null, 2)}\n</script>\n<script type="application/ld+json">\n${JSON.stringify(itemListSchema, null, 2)}\n</script>\n`;
  // Insert before the AdSense script
  const adsenseMarker = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
  html = html.replace(adsenseMarker, schemaInject + adsenseMarker);

  // 5. Update the header date with a pre-rendered value
  const headerDateMarker = '<p class="header-date" id="lastUpdated"></p>';
  const headerDateReplacement = `<p class="header-date" id="lastUpdated">Last updated: ${escapeHtml(data.last_updated)}</p>`;
  html = html.replace(headerDateMarker, headerDateReplacement);

  return html;
}

/* ---------- main ---------- */

function main() {
  console.log('Loading data.json...');
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

  console.log('Computing brawler scores...');
  const brawlers = computeBrawlers(data);
  const tiers = buildTiers(brawlers);

  console.log(`Found ${brawlers.length} brawlers across ${TIER_ORDER.length} tiers`);

  // Create brawlers directory
  if (!fs.existsSync(BRAWLERS_DIR)) {
    fs.mkdirSync(BRAWLERS_DIR, { recursive: true });
  }

  // Generate individual brawler pages
  console.log('Generating individual brawler pages...');
  brawlers.forEach((b) => {
    const pageHTML = buildBrawlerPage(b, data, brawlers, tiers);
    const pagePath = path.join(BRAWLERS_DIR, `${b.slug}.html`);
    fs.writeFileSync(pagePath, pageHTML);
  });
  console.log(`Generated ${brawlers.length} brawler pages in /brawlers/`);

  // Update index.html
  console.log('Updating index.html with pre-rendered content...');
  const updatedIndex = updateIndexHtml(data, brawlers, tiers);
  fs.writeFileSync(INDEX_PATH, updatedIndex);
  console.log('Updated index.html');

  // Generate sitemap
  console.log('Generating sitemap.xml...');
  const sitemap = buildSitemap(brawlers);
  fs.writeFileSync(SITEMAP_PATH, sitemap);
  console.log('Updated sitemap.xml');

  console.log('\nBuild complete!');
  console.log(`  - ${brawlers.length} brawler pages`);
  console.log(`  - Pre-rendered tier list in index.html`);
  console.log(`  - Pre-rendered sources grid in index.html`);
  console.log(`  - FAQ section with ${7} questions`);
  console.log(`  - About section`);
  console.log(`  - FAQPage + ItemList structured data`);
  console.log(`  - Sitemap with ${brawlers.length + 1} URLs`);
}

main();
