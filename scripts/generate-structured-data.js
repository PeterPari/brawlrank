const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const indexPath = path.join(rootDir, 'index.html');
const dataPath = path.join(rootDir, 'data.json');
const sitemapPath = path.join(rootDir, 'sitemap.xml');
const brawlersDir = path.join(rootDir, 'brawlers');
const blogDir = path.join(rootDir, 'blog');
const socialDir = path.join(rootDir, 'social');

const SITE_URL = 'https://brawlrank.com/';
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
const TIER_THRESHOLDS = {
  S: 5.5,
  A: 4.5,
  B: 3.5,
  C: 2.5,
  D: 1.5
};
const TIER_ORDER = ['S', 'A', 'B', 'C', 'D', 'F'];
const TIER_COLORS = {
  S: '#ff2d55',
  A: '#ff9500',
  B: '#ffcc00',
  C: '#34c759',
  D: '#5ac8fa',
  F: '#8e8e93'
};
const STATIC_PAGE_CONFIG = [
  { fileName: 'about.html', label: 'About', page: 'about' },
  { fileName: 'contact.html', label: 'Contact', page: 'contact' },
  { fileName: 'privacy.html', label: 'Privacy', page: 'privacy' }
];

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

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeXml(value) {
  return escapeHtml(value).replaceAll('\n', ' ').replaceAll('\r', ' ');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseLastUpdated(rawValue) {
  const parsed = new Date(`${rawValue} UTC`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Unable to parse last_updated value: ${rawValue}`);
  }

  return parsed;
}

function formatMonthYear(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function toIsoDateTime(date) {
  return `${toIsoDate(date)}T00:00:00Z`;
}

function getBrawlerUrl(slug) {
  return `${SITE_URL}brawlers/${slug}/`;
}

function getPortraitPath(iconUrl) {
  const match = String(iconUrl).match(/(\d+)\.png$/);
  if (!match) {
    return iconUrl;
  }

  return `portraits/${match[1]}.png`;
}

function getConsensusMeta(disagreement) {
  if (disagreement < 0.8) {
    return {
      label: 'Strong consensus',
      className: 'consensus-strong',
      description: 'Most sources are tightly aligned on this placement.'
    };
  }

  if (disagreement < 1.5) {
    return {
      label: 'Moderate consensus',
      className: 'consensus-moderate',
      description: 'There is some variation, but the overall placement is still reasonably stable.'
    };
  }

  return {
    label: 'Weak consensus',
    className: 'consensus-weak',
    description: 'Sources disagree meaningfully, so this placement is more volatile than usual.'
  };
}

function getTierDescription(tier) {
  const descriptions = {
    S: 'S Tier brawlers are meta-defining picks. They consistently show up as top options across the strongest data and pro sources, and they usually need either direct nerfs or meaningful meta shifts to fall out of the top group.',
    A: 'A Tier brawlers are strong, reliable picks that fit many maps and drafts. They may not warp the meta on their own, but they are still among the safest high-value choices in competitive play.',
    B: 'B Tier brawlers are solid, usable options that usually need the right map, comp, or matchup to outperform the top tiers. They are viable, but not the default answer in most drafts.',
    C: 'C Tier brawlers can work, but they are more situational and harder to justify over stronger alternatives. They often require a favorable matchup, a narrow role, or player mastery to outperform the field.',
    D: 'D Tier brawlers currently sit on the weaker end of the meta. They can still have niche uses, but most players will get more value from higher-tier alternatives in the same role.',
    F: 'F Tier brawlers are currently non-factors in the live BrawlRank model. They need a major balance patch, a mode-specific niche, or a substantial meta shift before they become practical picks again.'
  };

  return descriptions[tier] || descriptions.F;
}

function getIndefiniteArticle(word) {
  return /^[aeiou]/i.test(word) ? 'an' : 'a';
}

function wrapText(text, maxChars) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = '';

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length <= maxChars || !currentLine) {
      currentLine = candidate;
      return;
    }

    lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function getExistingStaticPages() {
  return STATIC_PAGE_CONFIG.filter((page) => fs.existsSync(path.join(rootDir, page.fileName))).map((page) => ({
    ...page,
    href: `${SITE_URL}${page.fileName}`
  }));
}

function buildOgSvg({ eyebrow, title, subtitle, accent = '#00e5ff', portraitUrl = '', score = '', tier = '' }) {
  const titleLines = wrapText(title, 18).slice(0, 3);
  const subtitleLines = wrapText(subtitle, 44).slice(0, 3);
  const titleMarkup = titleLines.map((line, index) => `<tspan x="84" dy="${index === 0 ? 0 : 72}">${escapeXml(line)}</tspan>`).join('');
  const subtitleMarkup = subtitleLines.map((line, index) => `<tspan x="84" dy="${index === 0 ? 0 : 30}">${escapeXml(line)}</tspan>`).join('');
  const badgeMarkup = tier
    ? `<g><rect x="84" y="490" width="118" height="46" rx="23" fill="${escapeXml(accent)}"/><text x="143" y="520" fill="#041018" font-size="24" font-weight="700" text-anchor="middle">${escapeXml(`${tier} Tier`)}</text></g>`
    : '';
  const scoreMarkup = score
    ? `<text x="232" y="520" fill="#f5fbff" font-size="28" font-weight="700">${escapeXml(score)}</text>`
    : '';
  const portraitMarkup = portraitUrl
    ? [
        '<g>',
        '  <rect x="878" y="126" width="242" height="378" rx="38" fill="#0d1720" stroke="#233648" stroke-width="2"/>',
        '  <rect x="902" y="150" width="194" height="194" rx="32" fill="#091118"/>',
        `  <image href="${escapeXml(portraitUrl)}" x="912" y="160" width="174" height="174" preserveAspectRatio="xMidYMid meet"/>`,
        '  <rect x="902" y="370" width="194" height="108" rx="24" fill="#101d28"/>',
        `  <text x="999" y="414" fill="#f5fbff" font-size="34" font-weight="700" text-anchor="middle">${escapeXml(tier || 'Meta')}</text>`,
        `  <text x="999" y="452" fill="#9eb5c6" font-size="22" font-weight="500" text-anchor="middle">${escapeXml(score || 'BrawlRank')}</text>`,
        '</g>'
      ].join('\n')
    : [
        '<g>',
        '  <circle cx="1002" cy="268" r="132" fill="#102030"/>',
        '  <circle cx="1002" cy="268" r="104" fill="#0d1720" stroke="#233648" stroke-width="2"/>',
        '  <text x="1002" y="254" fill="#f5fbff" font-size="40" font-weight="700" text-anchor="middle">Brawl</text>',
        '  <text x="1002" y="304" fill="#f5fbff" font-size="40" font-weight="700" text-anchor="middle">Rank</text>',
        '</g>'
      ].join('\n');

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" fill="none">',
    '  <defs>',
    '    <linearGradient id="bg" x1="84" y1="72" x2="1138" y2="558" gradientUnits="userSpaceOnUse">',
    '      <stop stop-color="#081018"/>',
    '      <stop offset="1" stop-color="#102030"/>',
    '    </linearGradient>',
    '  </defs>',
    '  <rect width="1200" height="630" fill="#050b11"/>',
    '  <rect x="42" y="42" width="1116" height="546" rx="40" fill="url(#bg)" stroke="#173042" stroke-width="2"/>',
    '  <circle cx="1130" cy="110" r="168" fill="#103548" opacity="0.22"/>',
    '  <circle cx="100" cy="558" r="196" fill="#0b202c" opacity="0.45"/>',
    `  <rect x="84" y="84" width="8" height="462" rx="4" fill="${escapeXml(accent)}"/>`,
    `  <text x="116" y="132" fill="${escapeXml(accent)}" font-size="24" font-weight="700" letter-spacing="0.12em">${escapeXml(eyebrow.toUpperCase())}</text>`,
    `  <text x="84" y="226" fill="#f5fbff" font-size="62" font-weight="800">${titleMarkup}</text>`,
    `  <text x="84" y="394" fill="#9eb5c6" font-size="26" font-weight="500">${subtitleMarkup}</text>`,
    badgeMarkup,
    scoreMarkup,
    '  <text x="84" y="580" fill="#7f98aa" font-size="18" font-weight="600">brawlrank.com</text>',
    portraitMarkup,
    '</svg>',
    ''
  ].join('\n');
}

function getSocialUrl(relativePath) {
  return `${SITE_URL}${relativePath}`;
}

function buildHomeOgSvg({ lastUpdated, sourceCount }) {
  const subtitle = `Aggregated from ${sourceCount} sources — data, pros, and community`;
  const dateLine = `Last updated: ${lastUpdated}`;
  const logoSvgPath = path.join(rootDir, 'BRlogo.svg');
  const rawLogo = fs.readFileSync(logoSvgPath, 'utf8');
  const logoInner = rawLogo
    .replace(/<\?xml[^>]*\?>\s*/, '')
    .replace(/<!DOCTYPE[^>]*>\s*/i, '')
    .replace(/<svg[^>]*>/i, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="843 185 1135 1159" x="80" y="115" width="400" height="408" preserveAspectRatio="xMidYMid meet">');

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" fill="none">',
    '  <defs>',
    '    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">',
    '      <stop stop-color="#0a0a0f"/>',
    '      <stop offset="1" stop-color="#12121a"/>',
    '    </linearGradient>',
    '    <radialGradient id="glow" cx="600" cy="120" r="520" gradientUnits="userSpaceOnUse">',
    '      <stop stop-color="#00e5ff" stop-opacity="0.18"/>',
    '      <stop offset="0.45" stop-color="#00e5ff" stop-opacity="0.05"/>',
    '      <stop offset="1" stop-color="#00e5ff" stop-opacity="0"/>',
    '    </radialGradient>',
    '  </defs>',
    '  <rect width="1200" height="630" fill="url(#bg)"/>',
    '  <rect width="1200" height="630" fill="url(#glow)"/>',
    `  ${logoInner}`,
    `  <text x="540" y="245" fill="#00e5ff" font-family="'Satoshi','Inter',system-ui,sans-serif" font-size="48" font-weight="700" letter-spacing="3.5"><tspan x="540" dy="0">BRAWLRANK: A BRAWL</tspan><tspan x="540" dy="64">STARS TIER LIST</tspan></text>`,
    `  <text x="540" y="410" fill="#9898aa" font-family="'Satoshi','Inter',system-ui,sans-serif" font-size="24" font-weight="400">${escapeXml(subtitle)}</text>`,
    `  <text x="540" y="455" fill="#66667a" font-family="'Satoshi','Inter',system-ui,sans-serif" font-size="24" font-weight="400">${escapeXml(dateLine)}</text>`,
    `  <text x="540" y="555" fill="#3a3a4a" font-family="'Satoshi','Inter',system-ui,sans-serif" font-size="18" font-weight="600" letter-spacing="2">brawlrank.com</text>`,
    '</svg>',
    ''
  ].join('\n');
}

function computeRankedBrawlers(data) {
  return data.brawlers
    .map((brawler) => {
      let weightedSum = 0;
      let totalWeight = 0;
      const ratings = [];

      const noffTop = brawler.sources['Noff.gg'];
      const noffRanked = brawler.sources['Noff Ranked'];
      let mergedNoffValue = null;

      if (noffTop || noffRanked) {
        mergedNoffValue = noffTop && noffRanked
          ? (TIER_VALUES[noffTop] + TIER_VALUES[noffRanked]) / 2
          : TIER_VALUES[noffTop || noffRanked];

        weightedSum += mergedNoffValue * SOURCE_WEIGHTS['Noff.gg'];
        totalWeight += SOURCE_WEIGHTS['Noff.gg'];
        ratings.push(mergedNoffValue);
      }

      for (const [sourceName, weight] of Object.entries(SOURCE_WEIGHTS)) {
        if (sourceName === 'Noff.gg') {
          continue;
        }

        const tier = brawler.sources[sourceName];
        if (!tier) {
          continue;
        }

        const value = TIER_VALUES[tier];
        weightedSum += value * weight;
        totalWeight += weight;
        ratings.push(value);
      }

      const score = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : 0;
      const tier = getTierFromScore(score);

      let disagreement = 0;
      if (ratings.length > 0) {
        const mean = ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
        const variance = ratings.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / ratings.length;
        disagreement = Math.round(Math.sqrt(variance) * 100) / 100;
      }

      const slug = slugify(brawler.name);

      return {
        ...brawler,
        slug,
        portrait: getPortraitPath(brawler.icon),
        noffMergedTier: mergedNoffValue !== null ? valueToTier(mergedNoffValue) : null,
        score,
        tier,
        num_sources: ratings.length,
        disagreement,
        url: getBrawlerUrl(slug),
        ogImage: getSocialUrl('social/og-home.svg')
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.name.localeCompare(right.name);
    })
    .map((brawler, index) => ({
      ...brawler,
      rank: index + 1
    }));
}

function groupBrawlersByTier(rankedBrawlers) {
  return TIER_ORDER.reduce((groups, tier) => {
    groups[tier] = rankedBrawlers.filter((brawler) => brawler.tier === tier);
    return groups;
  }, {});
}

function buildFaqEntries(data, rankedBrawlers) {
  const updatedDate = parseLastUpdated(data.last_updated);
  const sTierNames = rankedBrawlers.filter((brawler) => brawler.tier === 'S').map((brawler) => brawler.name);
  const bestNames = sTierNames.slice(0, 6).join(', ');
  const sourceNames = data.sources.map((source) => source.name).join(', ');

  return [
    {
      question: 'What is the best brawler in Brawl Stars right now?',
      answer: `As of ${data.last_updated}, the current S Tier brawlers on BrawlRank are ${bestNames}. These brawlers scored at least 5.50 out of 6.00 across ${data.total_sources} independent sources, so they represent the strongest overall picks in the current meta.`
    },
    {
      question: 'How does BrawlRank calculate tier rankings?',
      answer: 'BrawlRank collects tier lists from data platforms, pro players, creator roundups, and community voting. Each rating is converted from a letter tier into a numeric score from 6 to 1, source-specific weights are applied, and the final weighted average determines each brawler\'s tier placement.'
    },
    {
      question: 'How often is BrawlRank updated?',
      answer: `BrawlRank is updated weekly and usually refreshed within a few days of a major balance patch or clear meta shift. The current published dataset is marked ${data.last_updated}.`
    },
    {
      question: 'What sources does BrawlRank use?',
      answer: `The current model blends ${data.total_sources} sources: ${sourceNames}. Data-heavy sources receive the most weight, while editorial and community signals are included at lower weight so the ranking stays grounded in competitive performance.`
    },
    {
      question: 'What do the tiers mean on BrawlRank?',
      answer: 'S Tier marks the strongest meta-defining brawlers. A Tier covers strong picks that fit many maps and drafts. B and C Tier represent playable but more situational choices, while D and F Tier indicate weaker options that need favorable maps, comps, or balance changes to stand out.'
    },
    {
      question: 'Why do some brawlers show weak consensus across sources?',
      answer: 'Weak consensus means the sources disagree more than usual about a brawler. That usually happens when a brawler is highly map-dependent, has a steep skill ceiling, or performs differently in pro play versus ranked ladder games.'
    },
    {
      question: 'Is BrawlRank the same as any single pro player tier list?',
      answer: `No. BrawlRank is an aggregate model for ${formatMonthYear(updatedDate)}, not a copy of any one opinion. It uses pro lists as inputs, but combines them with data sources and community sentiment to produce one blended ranking.`
    }
  ];
}

function buildStructuredDataMarkup(data, rankedBrawlers, faqEntries) {
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Brawl Stars Meta Tier List',
    description: `Aggregated brawler rankings from ${data.total_sources} sources`,
    numberOfItems: rankedBrawlers.length,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    itemListElement: rankedBrawlers.map((brawler, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: brawler.name,
      url: brawler.url
    }))
  };

  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqEntries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: entry.answer
      }
    }))
  };

  return [
    '<script type="application/ld+json">',
    JSON.stringify(itemList, null, 2),
    '</script>',
    '<script type="application/ld+json">',
    JSON.stringify(faqPage, null, 2),
    '</script>'
  ].join('\n');
}

function buildFaqSectionMarkup(faqEntries) {
  const itemsMarkup = faqEntries.map((entry, index) => {
    const openAttribute = index === 0 ? ' open' : '';
    return [
      `      <details class="faq-item"${openAttribute}>`,
      `        <summary>${escapeHtml(entry.question)}</summary>`,
      '        <div class="faq-answer">',
      `          <p>${escapeHtml(entry.answer)}</p>`,
      '        </div>',
      '      </details>'
    ].join('\n');
  }).join('\n');

  return [
    '<section class="faq-section">',
    '  <div class="container">',
    '    <h2 class="section-heading">Frequently Asked Questions</h2>',
    '    <p class="section-sub">Quick answers about how BrawlRank works, how often the rankings update, and what the current Brawl Stars meta means.</p>',
    '    <div class="faq-list">',
    itemsMarkup,
    '    </div>',
    '  </div>',
    '</section>'
  ].join('\n');
}

function buildMetaSummaryMarkup(data, rankedBrawlers, updatedDate) {
  const sTier = rankedBrawlers.filter((brawler) => brawler.tier === 'S').slice(0, 6).map((brawler) => brawler.name);
  const strongestAgreement = [...rankedBrawlers]
    .sort((left, right) => left.disagreement - right.disagreement)
    .slice(0, 3)
    .map((brawler) => brawler.name)
    .join(', ');
  const mostContested = [...rankedBrawlers]
    .sort((left, right) => right.disagreement - left.disagreement)
    .slice(0, 3)
    .map((brawler) => brawler.name)
    .join(', ');
  const lowerTier = rankedBrawlers.filter((brawler) => brawler.tier === 'D' || brawler.tier === 'F').slice(0, 4).map((brawler) => brawler.name).join(', ');

  return [
    '<section class="meta-summary-section">',
    '  <div class="container">',
    '    <div class="meta-summary-card">',
    `      <h2 class="section-heading">Brawl Stars Meta Summary — ${escapeHtml(formatMonthYear(updatedDate))}</h2>`,
    `      <p>The ${escapeHtml(formatMonthYear(updatedDate))} BrawlRank update currently puts ${escapeHtml(sTier.join(', '))} at the front of the Brawl Stars meta. This homepage ranks ${rankedBrawlers.length} brawlers by blending ${data.total_sources} data, pro, creator, and community inputs into one weighted list.</p>`,
    `      <p>The clearest cross-source agreement right now is on ${escapeHtml(strongestAgreement)}, while the most debated placements currently include ${escapeHtml(mostContested)}. That disagreement signal matters because it highlights which brawlers are stable meta picks and which are more map-, comp-, or skill-dependent.</p>`,
    `      <p>The lowest end of the current model includes ${escapeHtml(lowerTier)}. For deeper analysis, every brawler below links to its own static page with rank, score, consensus level, and source breakdown, and you can browse the full hub at <a href="brawlers/">/brawlers/</a>.</p>`,
    '    </div>',
    '  </div>',
    '</section>'
  ].join('\n');
}

function buildTierListMarkup(groupedBrawlers) {
  return TIER_ORDER.map((tier) => {
    const brawlers = groupedBrawlers[tier] || [];
    const brawlerMarkup = brawlers.length === 0
      ? '<span style="font-size:13px;color:var(--text-muted);font-style:italic;padding:4px 8px;">No brawlers in this tier</span>'
      : brawlers.map((brawler, index) => [
          `    <a class="brawler-icon-wrap" href="/brawlers/${brawler.slug}/" data-name="${escapeHtml(brawler.name.toLowerCase())}">`,
          `      <img class="brawler-icon" src="${escapeHtml(brawler.portrait)}" alt="${escapeHtml(`${brawler.name} - ${brawler.tier} Tier Brawl Stars brawler`)}" loading="lazy" decoding="async" width="58" height="58"${brawler.rank <= 6 && index < 6 ? ' fetchpriority="high"' : ''}>`,
          `      <div class="brawler-tooltip"><span class="tt-name">${escapeHtml(brawler.name)}</span><span class="tt-score">${brawler.score.toFixed(2)}</span></div>`,
          `      <div class="brawler-name-label">${escapeHtml(brawler.name)}</div>`,
          '    </a>'
        ].join('\n')).join('\n');

    return [
      `<div class="tier-row tier-${tier.toLowerCase()}">`,
      `  <div class="tier-label">${tier}</div>`,
      '  <div class="tier-brawlers">',
      brawlerMarkup,
      '  </div>',
      '</div>'
    ].join('\n');
  }).join('\n');
}

function replaceGeneratedBlock(contents, startMarker, endMarker, replacement) {
  const startIndex = contents.indexOf(startMarker);
  const endIndex = contents.indexOf(endMarker);
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error(`Unable to find marker block: ${startMarker}`);
  }

  const blockStart = startIndex + startMarker.length;
  return `${contents.slice(0, blockStart)}\n${replacement}\n${contents.slice(endIndex)}`;
}

function replaceTag(contents, pattern, replacement, description) {
  if (!pattern.test(contents)) {
    throw new Error(`Unable to replace ${description}`);
  }

  return contents.replace(pattern, replacement);
}

function replaceMetaContent(contents, attribute, name, newValue) {
  const pattern = new RegExp(`<meta\\s+${attribute}="${escapeRegExp(name)}"\\s+content="[^"]*">`);
  return replaceTag(
    contents,
    pattern,
    `<meta ${attribute}="${name}" content="${escapeHtml(newValue)}">`,
    `${attribute} meta tag ${name}`
  );
}

function updateHomepage(indexHtml, data, rankedBrawlers, groupedBrawlers, faqEntries, updatedDate) {
  const monthYear = formatMonthYear(updatedDate);
  const homepageTitle = `Brawl Stars Tier List (${monthYear}) | BrawlRank Meta Rankings`;
  const homepageDescription = `Brawl Stars tier list for ${monthYear} — ${rankedBrawlers.length} brawlers ranked by aggregating ${data.total_sources} pro, data, and community sources. See which brawlers are S Tier right now. Updated weekly.`;
  const homepageOgImage = getSocialUrl('social/og-home.svg');

  let updatedHtml = indexHtml;
  updatedHtml = replaceTag(updatedHtml, /<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(homepageTitle)}</title>`, 'homepage title');
  updatedHtml = replaceMetaContent(updatedHtml, 'name', 'description', homepageDescription);
  updatedHtml = replaceMetaContent(updatedHtml, 'property', 'og:title', homepageTitle);
  updatedHtml = replaceMetaContent(updatedHtml, 'property', 'og:description', homepageDescription);
  updatedHtml = replaceMetaContent(updatedHtml, 'name', 'twitter:title', homepageTitle);
  updatedHtml = replaceMetaContent(updatedHtml, 'name', 'twitter:description', homepageDescription);
  updatedHtml = replaceMetaContent(updatedHtml, 'property', 'og:image', homepageOgImage);
  updatedHtml = replaceMetaContent(updatedHtml, 'name', 'twitter:image', homepageOgImage);
  updatedHtml = replaceMetaContent(updatedHtml, 'property', 'article:modified_time', toIsoDateTime(updatedDate));
  updatedHtml = replaceTag(
    updatedHtml,
    /<p class="header-date" id="lastUpdated">[\s\S]*?<\/p>/,
    `<p class="header-date" id="lastUpdated">Last updated: ${escapeHtml(data.last_updated)}</p>`,
    'homepage last-updated label'
  );
  updatedHtml = replaceGeneratedBlock(
    updatedHtml,
    '<!-- GENERATED_STRUCTURED_DATA_START -->',
    '<!-- GENERATED_STRUCTURED_DATA_END -->',
    buildStructuredDataMarkup(data, rankedBrawlers, faqEntries)
  );
  updatedHtml = replaceGeneratedBlock(
    updatedHtml,
    '<!-- GENERATED_FAQ_SECTION_START -->',
    '<!-- GENERATED_FAQ_SECTION_END -->',
    buildFaqSectionMarkup(faqEntries)
  );
  updatedHtml = replaceGeneratedBlock(
    updatedHtml,
    '<!-- GENERATED_META_SUMMARY_START -->',
    '<!-- GENERATED_META_SUMMARY_END -->',
    buildMetaSummaryMarkup(data, rankedBrawlers, updatedDate)
  );
  updatedHtml = replaceGeneratedBlock(
    updatedHtml,
    '<!-- GENERATED_TIER_LIST_START -->',
    '<!-- GENERATED_TIER_LIST_END -->',
    buildTierListMarkup(groupedBrawlers)
  );

  return updatedHtml;
}

function buildNav(relativePrefix, currentPage, staticPages) {
  const staticLinks = staticPages.map((page) => `      <a href="${relativePrefix}${page.fileName}"${currentPage === page.page ? ' aria-current="page"' : ''}>${page.label}</a>`);
  return [
    '<nav class="site-nav" aria-label="Primary">',
    '  <div class="container">',
    `    <a href="${relativePrefix}" class="nav-home">`,
    `      <img src="${relativePrefix}BRlogo.svg" alt="BrawlRank logo" draggable="false">`,
    '      <span>BrawlRank</span>',
    '    </a>',
    '    <div class="nav-links">',
    `      <a href="${relativePrefix}"${currentPage === 'home' ? ' aria-current="page"' : ''}>Tier List</a>`,
    `      <a href="${relativePrefix}brawlers/"${currentPage === 'brawlers' ? ' aria-current="page"' : ''}>Brawlers</a>`,
    `      <a href="${relativePrefix}blog/"${currentPage === 'blog' ? ' aria-current="page"' : ''}>Blog</a>`,
    ...staticLinks,
    '    </div>',
    '  </div>',
    '</nav>'
  ].join('\n');
}

function buildFooter(relativePrefix, staticPages) {
  const staticLinks = staticPages.map((page) => `      <a href="${relativePrefix}${page.fileName}">${page.page === 'privacy' ? 'Privacy Policy' : page.label}</a>`);
  return [
    '<footer class="footer">',
    '  <div class="container">',
    '    <div class="footer-links">',
    `      <a href="${relativePrefix}">Tier List</a>`,
    `      <a href="${relativePrefix}brawlers/">All Brawlers</a>`,
    `      <a href="${relativePrefix}blog/">Blog</a>`,
    ...staticLinks,
    '      <a href="https://tech-savvies.com/" target="_blank" rel="noopener noreferrer">Built by Tech-savvies</a>',
    '      <a href="https://brawlify.com" target="_blank" rel="noopener noreferrer">Data: Brawlify</a>',
    '    </div>',
    '    <p class="footer-disclaimer">BrawlRank is an independent fan site and is not affiliated with, endorsed by, or connected to Supercell. Brawl Stars is a trademark of Supercell.</p>',
    '    <p class="footer-copyright">© 2026 BrawlRank. All rights reserved.</p>',
    '  </div>',
    '</footer>'
  ].join('\n');
}

function buildHead({ title, description, canonical, ogTitle, ogDescription, ogImage, relativePrefix, articleModifiedTime, jsonLdMarkup = '' }) {
  return [
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}">`,
    '<meta name="author" content="BrawlRank">',
    '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">',
    `<link rel="canonical" href="${escapeHtml(canonical)}">`,
    `<meta property="article:modified_time" content="${escapeHtml(articleModifiedTime)}">`,
    `<link rel="icon" type="image/svg+xml" href="${relativePrefix}BRlogo.svg" sizes="any">`,
    '<meta name="theme-color" content="#00e5ff">',
    '<meta property="og:type" content="website">',
    `<meta property="og:url" content="${escapeHtml(canonical)}">`,
    `<meta property="og:title" content="${escapeHtml(ogTitle)}">`,
    `<meta property="og:description" content="${escapeHtml(ogDescription)}">`,
    `<meta property="og:image" content="${escapeHtml(ogImage)}">`,
    '<meta property="og:site_name" content="BrawlRank">',
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${escapeHtml(ogTitle)}">`,
    `<meta name="twitter:description" content="${escapeHtml(ogDescription)}">`,
    `<meta name="twitter:image" content="${escapeHtml(ogImage)}">`,
    '<link rel="preconnect" href="https://fonts.cdnfonts.com" crossorigin>',
    '<link rel="dns-prefetch" href="https://fonts.cdnfonts.com">',
    '<link href="https://fonts.cdnfonts.com/css/clash-display" rel="stylesheet">',
    '<link href="https://fonts.cdnfonts.com/css/satoshi" rel="stylesheet">',
    `<link rel="stylesheet" href="${relativePrefix}styles.css">`,
    jsonLdMarkup,
    '</head>'
  ].filter(Boolean).join('\n');
}

function buildBrawlersIndexPage(data, rankedBrawlers, groupedBrawlers, updatedDate, staticPages) {
  const title = `Brawl Stars Brawler Pages (${formatMonthYear(updatedDate)}) | BrawlRank`;
  const description = `Browse ${rankedBrawlers.length} Brawl Stars brawler pages with current rank, tier, score, consensus level, and source breakdowns from ${data.total_sources} weighted inputs.`;
  const canonical = `${SITE_URL}brawlers/`;
  const jsonLdMarkup = [
    '<script type="application/ld+json">',
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: title,
      url: canonical,
      description,
      isPartOf: {
        '@type': 'WebSite',
        name: 'BrawlRank',
        url: SITE_URL
      }
    }, null, 2),
    '</script>'
  ].join('\n');

  const tierCards = TIER_ORDER.map((tier) => {
    const brawlers = groupedBrawlers[tier] || [];
    const tierItems = brawlers.slice(0, 10).map((brawler) => `            <li><a href="${escapeHtml(brawler.slug)}/">${escapeHtml(brawler.name)}</a> <span class="rank-pill">#${brawler.rank}</span></li>`).join('\n');
    const countLabel = `${brawlers.length} brawler${brawlers.length === 1 ? '' : 's'} currently ${brawlers.length === 1 ? 'sits' : 'sit'} in ${tier} Tier.`;
    return [
      '            <article class="tier-index-card">',
      `              <h2>${tier} Tier</h2>`,
      `              <p>${countLabel}</p>`,
      '              <ul>',
      tierItems || '                <li>No brawlers currently in this tier.</li>',
      '              </ul>',
      '            </article>'
    ].join('\n');
  }).join('\n');

  const alphabeticalLinks = [...rankedBrawlers]
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((brawler) => `<a class="brawler-index-link" href="${escapeHtml(brawler.slug)}/">${escapeHtml(brawler.name)} <span class="tier-chip-score">${brawler.tier}</span></a>`)
    .join('\n            ');

  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    buildHead({
      title,
      description,
      canonical,
      ogTitle: title,
      ogDescription: description,
      ogImage: getSocialUrl('social/og-home.svg'),
      relativePrefix: '../',
      articleModifiedTime: toIsoDateTime(updatedDate),
      jsonLdMarkup
    }),
    '<body>',
    buildNav('../', 'brawlers', staticPages),
    '<main class="page-main">',
    '  <section class="page-hero">',
    '    <div class="container">',
    '      <span class="eyebrow">Brawler Pages</span>',
    `      <h1 class="page-title">${rankedBrawlers.length} Brawl Stars brawler pages, each with a live meta score.</h1>`,
    `      <p class="page-lead">Browse every BrawlRank brawler page to see the current tier, exact weighted score, consensus level, and source breakdown behind the placement. Each page is updated from the same ${data.total_sources}-source model that powers the main tier list.</p>`,
    `      <p class="page-meta">Updated ${escapeHtml(data.last_updated)}. Start with the current top picks, or browse alphabetically below.</p>`,
    '    </div>',
    '  </section>',
    '  <section>',
    '    <div class="container page-grid">',
    '      <div class="content-stack">',
    '        <article class="content-card brawler-index-section">',
    '          <h2>Browse by current tier</h2>',
    '          <p>These groups reflect the current live BrawlRank model and link directly to each brawler page.</p>',
    '          <div class="tier-index-grid">',
    tierCards,
    '          </div>',
    '        </article>',
    '        <article class="content-card brawler-index-section">',
    '          <h2>All brawlers A–Z</h2>',
    '          <p>Use this alphabetical index if you already know the brawler you want to check.</p>',
    '          <div class="alphabetical-brawler-list">',
    `            ${alphabeticalLinks}`,
    '          </div>',
    '        </article>',
    '      </div>',
    '      <aside class="sidebar-stack">',
    '        <section class="sidebar-card">',
    '          <h2>At a glance</h2>',
    '          <div class="stat-list">',
    `            <div class="stat-item"><span class="stat-label">Coverage</span><span class="stat-value">${rankedBrawlers.length} tracked brawlers</span></div>`,
    `            <div class="stat-item"><span class="stat-label">Source Model</span><span class="stat-value">${data.total_sources} weighted data, pro, creator, and community inputs</span></div>`,
    `            <div class="stat-item"><span class="stat-label">Top Tier Count</span><span class="stat-value">${(groupedBrawlers.S || []).length} brawlers currently in S Tier</span></div>`,
    '          </div>',
    '        </section>',
    '        <section class="sidebar-card">',
    '          <h2>Use these pages for</h2>',
    '          <p>Quick checks like “Is Shelly good in Brawl Stars right now?”, rank comparisons between similar picks, and source-by-source breakdowns when a brawler looks more contested than expected.</p>',
    '        </section>',
    '      </aside>',
    '    </div>',
    '  </section>',
    '</main>',
    buildFooter('../', staticPages),
    '</body>',
    '</html>',
    ''
  ].join('\n');
}

function buildBrawlerPage(data, rankedBrawlers, groupedBrawlers, brawler, updatedDate, staticPages) {
  const previous = rankedBrawlers[brawler.rank - 2] || null;
  const next = rankedBrawlers[brawler.rank] || null;
  const sameTier = (groupedBrawlers[brawler.tier] || []).filter((entry) => entry.slug !== brawler.slug);
  const consensus = getConsensusMeta(brawler.disagreement);
  const title = `${brawler.name} Tier & Meta Ranking (${formatMonthYear(updatedDate)}) | BrawlRank`;
  const description = `${brawler.name} is ${brawler.tier} Tier in Brawl Stars with a BrawlRank score of ${brawler.score.toFixed(2)} out of 6.00. See rank, consensus strength, and the ${data.total_sources}-source breakdown.`;
  const canonical = brawler.url;
  const articleJsonLd = [
    '<script type="application/ld+json">',
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: `${brawler.name} Meta Ranking — Brawl Stars Tier List`,
      description,
      author: {
        '@type': 'Organization',
        name: 'BrawlRank'
      },
      dateModified: toIsoDate(updatedDate),
      about: {
        '@type': 'Thing',
        name: brawler.name,
        description: 'A Brawl Stars brawler'
      },
      isPartOf: {
        '@type': 'WebSite',
        name: 'BrawlRank',
        url: SITE_URL
      },
      mainEntityOfPage: canonical,
      image: brawler.ogImage
    }, null, 2),
    '</script>',
    '<script type="application/ld+json">',
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'BrawlRank', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Brawlers', item: `${SITE_URL}brawlers/` },
        { '@type': 'ListItem', position: 3, name: brawler.name, item: canonical }
      ]
    }, null, 2),
    '</script>'
  ].join('\n');

  const sourceRows = data.sources.map((source) => {
    const rating = source.name === 'Noff.gg' ? brawler.noffMergedTier : brawler.sources[source.name];
    if (!rating) {
      return '';
    }

    const weight = SOURCE_WEIGHTS[source.name] || 1;
    return [
      '                <tr>',
      `                  <td><a class="source-link-inline" href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.name)}</a></td>`,
      `                  <td><span class="table-tier-pill" style="background:${TIER_COLORS[rating] || '#8e8e93'}">${rating}</span></td>`,
      `                  <td>${weight.toFixed(1)}×</td>`,
      `                  <td>${escapeHtml(source.date)}</td>`,
      '                </tr>'
    ].join('\n');
  }).filter(Boolean).join('\n');

  const adjacentLinks = [previous, next]
    .filter(Boolean)
    .map((entry) => `<a class="adjacent-link" href="../${escapeHtml(entry.slug)}/">#${entry.rank} ${escapeHtml(entry.name)} <span class="tier-chip-score">${entry.tier}</span></a>`)
    .join('\n            ');

  const sameTierLinks = sameTier
    .map((entry) => `<a class="same-tier-link" href="../${escapeHtml(entry.slug)}/">${escapeHtml(entry.name)} <span class="rank-pill">#${entry.rank}</span></a>`)
    .join('\n            ');

  const heroLead = `${brawler.name} is currently rated ${brawler.tier} Tier in Brawl Stars with a weighted BrawlRank score of ${brawler.score.toFixed(2)} out of 6.00. The live placement is based on ${data.total_sources} weighted sources and currently sits at rank #${brawler.rank} overall.`;
  const tierArticle = getIndefiniteArticle(brawler.tier);

  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    buildHead({
      title,
      description,
      canonical,
      ogTitle: `${brawler.name} is ${brawler.tier} Tier | BrawlRank`,
      ogDescription: `${brawler.name} scored ${brawler.score.toFixed(2)} out of 6.00 across ${data.total_sources} weighted Brawl Stars meta sources.`,
      ogImage: brawler.ogImage,
      relativePrefix: '../../',
      articleModifiedTime: toIsoDateTime(updatedDate),
      jsonLdMarkup: articleJsonLd
    }),
    '<body>',
    buildNav('../../', 'brawlers', staticPages),
    '<main class="page-main">',
    '  <section class="page-hero">',
    '    <div class="container brawler-hero-layout">',
    `      <img class="brawler-hero-portrait" src="../../${escapeHtml(brawler.portrait)}" alt="${escapeHtml(`${brawler.name} portrait - rated ${brawler.tier} Tier (${brawler.score.toFixed(2)}/6.00) in the Brawl Stars meta`)}" width="126" height="126">`,
    '      <div class="brawler-hero-copy">',
    '        <span class="eyebrow">Brawler Page</span>',
    `        <h1 class="page-title">${escapeHtml(brawler.name)} — ${brawler.tier} Tier</h1>`,
    `        <p class="page-lead">${escapeHtml(heroLead)}</p>`,
    `        <div class="brawler-hero-badges"><span class="tier-badge-large" style="background:${TIER_COLORS[brawler.tier]}">${brawler.tier} Tier</span><span class="score-pill">${brawler.score.toFixed(2)} / 6.00</span><span class="rank-pill">Rank #${brawler.rank}</span><span class="consensus-pill ${consensus.className}">${consensus.label}</span></div>`,
    `        <p class="page-meta">Updated ${escapeHtml(data.last_updated)}. Consensus spread: σ = ${brawler.disagreement.toFixed(2)}.</p>`,
    '      </div>',
    '    </div>',
    '  </section>',
    '  <section>',
    '    <div class="container page-grid">',
    '      <div class="content-stack">',
    '        <article class="content-card">',
    '          <h2>Current snapshot</h2>',
    '          <div class="brawler-stat-grid">',
    `            <div class="brawler-stat-card"><h3>Rank</h3><p>#${brawler.rank} of ${rankedBrawlers.length} total brawlers in the current BrawlRank model.</p></div>`,
    `            <div class="brawler-stat-card"><h3>Consensus</h3><p>${escapeHtml(consensus.description)}</p></div>`,
    `            <div class="brawler-stat-card"><h3>Coverage</h3><p>${brawler.num_sources} weighted source inputs currently contribute to this score.</p></div>`,
    '          </div>',
    '        </article>',
    '        <article class="content-card">',
    '          <h2>Source breakdown</h2>',
    '          <p>These are the live source inputs behind the current BrawlRank placement for this brawler.</p>',
    '          <div class="page-table-wrap">',
    '            <table class="page-table">',
    '              <thead>',
    '                <tr>',
    '                  <th>Source</th>',
    '                  <th>Rating</th>',
    '                  <th>Weight</th>',
    '                  <th>Updated</th>',
    '                </tr>',
    '              </thead>',
    '              <tbody>',
    sourceRows,
    '              </tbody>',
    '            </table>',
    '          </div>',
    '        </article>',
    '        <article class="content-card">',
    '          <h2>What this tier means</h2>',
    `          <p>${escapeHtml(getTierDescription(brawler.tier))}</p>`,
    `          <p>For players searching terms like “${escapeHtml(brawler.name.toLowerCase())} Brawl Stars tier” or “is ${escapeHtml(brawler.name.toLowerCase())} good in Brawl Stars,” the short answer is that ${escapeHtml(brawler.name)} is currently ${tierArticle} ${brawler.tier} Tier option according to BrawlRank's blended model.</p>`,
    '        </article>',
    '        <article class="content-card">',
    '          <h2>How BrawlRank calculates this page</h2>',
    `          <p>BrawlRank aggregates ${data.total_sources} independent sources, converts each tier rating into a numeric value from 6 to 1, applies source-specific weights that prioritize empirical data, and then calculates a weighted average. This page updates from the same live dataset that powers the homepage tier list.</p>`,
    '        </article>',
    '      </div>',
    '      <aside class="sidebar-stack">',
    '        <section class="sidebar-card">',
    '          <h2>Navigation</h2>',
    '          <div class="adjacent-links">',
    '            <a class="adjacent-link" href="../../">Back to full tier list</a>',
    '            <a class="adjacent-link" href="../">Browse all brawlers</a>',
    `            ${adjacentLinks}`,
    '          </div>',
    '        </section>',
    '        <section class="sidebar-card">',
    `          <h2>Other ${brawler.tier} Tier brawlers</h2>`,
    `          <div class="same-tier-links">${sameTierLinks || '<span class="stat-value">No other brawlers currently share this tier.</span>'}</div>`,
    '        </section>',
    '      </aside>',
    '    </div>',
    '  </section>',
    '</main>',
    buildFooter('../../', staticPages),
    '</body>',
    '</html>',
    ''
  ].join('\n');
}

function buildBlogPosts(data, rankedBrawlers, groupedBrawlers, updatedDate) {
  const monthYear = formatMonthYear(updatedDate);
  const slug = `${slugify(monthYear)}-meta-report`;
  const topTier = (groupedBrawlers.S || []).slice(0, 5);
  const strongestConsensus = [...rankedBrawlers].sort((left, right) => left.disagreement - right.disagreement).slice(0, 4);
  const contested = [...rankedBrawlers].sort((left, right) => right.disagreement - left.disagreement).slice(0, 4);
  const pressureTier = [...(groupedBrawlers.D || []), ...(groupedBrawlers.F || [])].slice(0, 6);
  const tierCounts = TIER_ORDER.map((tier) => ({ tier, count: (groupedBrawlers[tier] || []).length }));

  return [{
    slug,
    title: `Brawl Stars Meta Report — ${monthYear}`,
    description: `${monthYear} Brawl Stars meta report covering the strongest S Tier picks, the most contested placements, and the current pressure points in the live BrawlRank model.`,
    canonical: `${SITE_URL}blog/${slug}/`,
    publishedDate: toIsoDate(updatedDate),
    updatedLabel: data.last_updated,
    topTier,
    strongestConsensus,
    contested,
    pressureTier,
    tierCounts,
    ogImage: getSocialUrl('social/og-home.svg')
  }];
}

function buildBlogIndexPage(posts, updatedDate, staticPages) {
  const title = `Brawl Stars Meta Blog (${formatMonthYear(updatedDate)}) | BrawlRank`;
  const description = 'Monthly meta reports, methodology breakdowns, and crawlable Brawl Stars analysis generated from the live BrawlRank ranking model.';
  const canonical = `${SITE_URL}blog/`;
  const postsMarkup = posts.map((post) => [
    '        <article class="content-card">',
    '          <span class="eyebrow">Meta Report</span>',
    `          <h2><a href="${escapeHtml(post.slug)}/">${escapeHtml(post.title)}</a></h2>`,
    `          <p>${escapeHtml(post.description)}</p>`,
    `          <p class="page-meta">Published ${escapeHtml(post.updatedLabel)}</p>`,
    `          <p><a href="${escapeHtml(post.slug)}/">Read the full report</a></p>`,
    '        </article>'
  ].join('\n')).join('\n');
  const jsonLdMarkup = [
    '<script type="application/ld+json">',
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: title,
      url: canonical,
      description
    }, null, 2),
    '</script>'
  ].join('\n');

  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    buildHead({
      title,
      description,
      canonical,
      ogTitle: title,
      ogDescription: description,
      ogImage: getSocialUrl('social/og-home.svg'),
      relativePrefix: '../',
      articleModifiedTime: toIsoDateTime(updatedDate),
      jsonLdMarkup
    }),
    '<body>',
    buildNav('../', 'blog', staticPages),
    '<main class="page-main">',
    '  <section class="page-hero">',
    '    <div class="container">',
    '      <span class="eyebrow">BrawlRank Blog</span>',
    '      <h1 class="page-title">Monthly Brawl Stars meta reports built from the live ranking model.</h1>',
    '      <p class="page-lead">This section turns the live BrawlRank dataset into crawlable editorial pages that summarize the strongest picks, the most contested brawlers, and the overall shape of the current Brawl Stars meta.</p>',
    `      <p class="page-meta">Latest publishing cycle: ${escapeHtml(formatMonthYear(updatedDate))}</p>`,
    '    </div>',
    '  </section>',
    '  <section>',
    '    <div class="container page-grid">',
    '      <div class="content-stack">',
    postsMarkup,
    '      </div>',
    '      <aside class="sidebar-stack">',
    '        <section class="sidebar-card">',
    '          <h2>What to expect</h2>',
    '          <p>Each report is generated from the current BrawlRank snapshot and focuses on meta leaders, cross-source agreement, and practical draft implications for the active patch cycle.</p>',
    '        </section>',
    '        <section class="sidebar-card">',
    '          <h2>Internal links</h2>',
    '          <p>Reports link directly to the main tier list and the individual brawler pages so the editorial layer supports the core rankings instead of fragmenting them.</p>',
    '        </section>',
    '      </aside>',
    '    </div>',
    '  </section>',
    '</main>',
    buildFooter('../', staticPages),
    '</body>',
    '</html>',
    ''
  ].join('\n');
}

function buildBlogPostPage(post, updatedDate, staticPages) {
  const title = `${post.title} | BrawlRank`;
  const relativePrefix = '../../';
  const topTierLinks = post.topTier.map((brawler) => `<a class="same-tier-link" href="../../brawlers/${escapeHtml(brawler.slug)}/">${escapeHtml(brawler.name)} <span class="rank-pill">#${brawler.rank}</span></a>`).join('\n            ');
  const strongConsensusLinks = post.strongestConsensus.map((brawler) => `<a class="same-tier-link" href="../../brawlers/${escapeHtml(brawler.slug)}/">${escapeHtml(brawler.name)} <span class="rank-pill">σ ${brawler.disagreement.toFixed(2)}</span></a>`).join('\n            ');
  const contestedLinks = post.contested.map((brawler) => `<a class="same-tier-link" href="../../brawlers/${escapeHtml(brawler.slug)}/">${escapeHtml(brawler.name)} <span class="rank-pill">σ ${brawler.disagreement.toFixed(2)}</span></a>`).join('\n            ');
  const pressureLinks = post.pressureTier.map((brawler) => `<a class="same-tier-link" href="../../brawlers/${escapeHtml(brawler.slug)}/">${escapeHtml(brawler.name)} <span class="rank-pill">${brawler.tier} Tier</span></a>`).join('\n            ');
  const tierCountMarkup = post.tierCounts.map((entry) => `<div class="stat-item"><span class="stat-label">${entry.tier} Tier</span><span class="stat-value">${entry.count} brawlers</span></div>`).join('');
  const jsonLdMarkup = [
    '<script type="application/ld+json">',
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.description,
      datePublished: post.publishedDate,
      dateModified: post.publishedDate,
      image: post.ogImage,
      author: {
        '@type': 'Organization',
        name: 'BrawlRank'
      },
      publisher: {
        '@type': 'Organization',
        name: 'BrawlRank',
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}BRlogo.svg`
        }
      },
      mainEntityOfPage: post.canonical
    }, null, 2),
    '</script>',
    '<script type="application/ld+json">',
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'BrawlRank', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}blog/` },
        { '@type': 'ListItem', position: 3, name: post.title, item: post.canonical }
      ]
    }, null, 2),
    '</script>'
  ].join('\n');

  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    buildHead({
      title,
      description: post.description,
      canonical: post.canonical,
      ogTitle: post.title,
      ogDescription: post.description,
      ogImage: post.ogImage,
      relativePrefix,
      articleModifiedTime: toIsoDateTime(updatedDate),
      jsonLdMarkup
    }),
    '<body>',
    buildNav(relativePrefix, 'blog', staticPages),
    '<main class="page-main">',
    '  <section class="page-hero">',
    '    <div class="container">',
    '      <span class="eyebrow">Meta Report</span>',
    `      <h1 class="page-title">${escapeHtml(post.title)}</h1>`,
    `      <p class="page-lead">${escapeHtml(post.description)}</p>`,
    `      <p class="page-meta">Published ${escapeHtml(post.updatedLabel)}. Built from the live BrawlRank dataset and linked directly to the current tier pages.</p>`,
    '    </div>',
    '  </section>',
    '  <section>',
    '    <div class="container page-grid">',
    '      <div class="content-stack">',
    '        <article class="content-card">',
    '          <h2>The top of the current Brawl Stars meta</h2>',
    '          <p>The current BrawlRank model shows a clear high-end cluster rather than a flat field. The brawlers below currently anchor the meta because they keep showing up at the top of data-heavy sources and creator lists at the same time.</p>',
    `          <div class="same-tier-links">${topTierLinks}</div>`,
    '        </article>',
    '        <article class="content-card">',
    '          <h2>Where the model is most stable</h2>',
    '          <p>Low-disagreement brawlers matter because they are the placements you can trust across different source perspectives. These are the names with the tightest spread in the current snapshot.</p>',
    `          <div class="same-tier-links">${strongConsensusLinks}</div>`,
    '        </article>',
    '        <article class="content-card">',
    '          <h2>The most contested placements</h2>',
    '          <p>When sources disagree heavily, that usually signals map dependence, role overlap, or a wider gap between ranked ladder performance and coordinated competitive play. These brawlers currently have the widest spread in the model.</p>',
    `          <div class="same-tier-links">${contestedLinks}</div>`,
    '        </article>',
    '        <article class="content-card">',
    '          <h2>Lower-tier pressure points</h2>',
    '          <p>These are the brawlers currently feeling the most pressure in the live model. They are still playable in niches, but they need draft support, favorable maps, or balance help before they become broadly attractive picks again.</p>',
    `          <div class="same-tier-links">${pressureLinks}</div>`,
    '        </article>',
    '      </div>',
    '      <aside class="sidebar-stack">',
    '        <section class="sidebar-card">',
    '          <h2>Tier distribution</h2>',
    `          <div class="stat-list">${tierCountMarkup}</div>`,
    '        </section>',
    '        <section class="sidebar-card">',
    '          <h2>Continue exploring</h2>',
    '          <div class="adjacent-links">',
    '            <a class="adjacent-link" href="../../">Back to full tier list</a>',
    '            <a class="adjacent-link" href="../../brawlers/">Browse all brawler pages</a>',
    '            <a class="adjacent-link" href="../">View all blog posts</a>',
    '          </div>',
    '        </section>',
    '      </aside>',
    '    </div>',
    '  </section>',
    '</main>',
    buildFooter(relativePrefix, staticPages),
    '</body>',
    '</html>',
    ''
  ].join('\n');
}

function buildSitemapXml(updatedDate, rankedBrawlers, blogPosts, staticPages) {
  const lastmod = toIsoDate(updatedDate);
  const urls = [
    { loc: SITE_URL, priority: '1.0', changefreq: 'weekly' },
    { loc: `${SITE_URL}brawlers/`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${SITE_URL}blog/`, priority: '0.8', changefreq: 'monthly' },
    ...staticPages.map((page) => ({ loc: page.href, priority: '0.5', changefreq: 'monthly' })),
    ...blogPosts.map((post) => ({ loc: post.canonical, priority: '0.7', changefreq: 'monthly' })),
    ...rankedBrawlers.map((brawler) => ({ loc: brawler.url, priority: '0.7', changefreq: 'weekly' }))
  ];

  const urlMarkup = urls.map(({ loc, priority, changefreq }) => [
    '  <url>',
    `    <loc>${escapeHtml(loc)}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>'
  ].join('\n')).join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlMarkup,
    '</urlset>',
    ''
  ].join('\n');
}

function writeBrawlerPages(data, rankedBrawlers, groupedBrawlers, updatedDate, staticPages) {
  ensureDir(brawlersDir);
  fs.writeFileSync(path.join(brawlersDir, 'index.html'), buildBrawlersIndexPage(data, rankedBrawlers, groupedBrawlers, updatedDate, staticPages));

  rankedBrawlers.forEach((brawler) => {
    const targetDir = path.join(brawlersDir, brawler.slug);
    ensureDir(targetDir);
    fs.writeFileSync(path.join(targetDir, 'index.html'), buildBrawlerPage(data, rankedBrawlers, groupedBrawlers, brawler, updatedDate, staticPages));
  });
}

function writeBlogPages(blogPosts, updatedDate, staticPages) {
  ensureDir(blogDir);
  fs.writeFileSync(path.join(blogDir, 'index.html'), buildBlogIndexPage(blogPosts, updatedDate, staticPages));

  blogPosts.forEach((post) => {
    const targetDir = path.join(blogDir, post.slug);
    ensureDir(targetDir);
    fs.writeFileSync(path.join(targetDir, 'index.html'), buildBlogPostPage(post, updatedDate, staticPages));
  });
}

function writeSocialAssets(rankedBrawlers, blogPosts, updatedDate, data) {
  ensureDir(socialDir);

  fs.writeFileSync(path.join(socialDir, 'og-home.svg'), buildHomeOgSvg({
    lastUpdated: data.last_updated,
    sourceCount: data.total_sources
  }));
}

function main() {
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const updatedDate = parseLastUpdated(data.last_updated);
  const staticPages = getExistingStaticPages();
  const rankedBrawlers = computeRankedBrawlers(data);
  const groupedBrawlers = groupBrawlersByTier(rankedBrawlers);
  const faqEntries = buildFaqEntries(data, rankedBrawlers);
  const blogPosts = buildBlogPosts(data, rankedBrawlers, groupedBrawlers, updatedDate);

  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  const updatedHomepage = updateHomepage(indexHtml, data, rankedBrawlers, groupedBrawlers, faqEntries, updatedDate);

  fs.writeFileSync(indexPath, updatedHomepage);
  writeSocialAssets(rankedBrawlers, blogPosts, updatedDate, data);
  writeBrawlerPages(data, rankedBrawlers, groupedBrawlers, updatedDate, staticPages);
  writeBlogPages(blogPosts, updatedDate, staticPages);
  fs.writeFileSync(sitemapPath, buildSitemapXml(updatedDate, rankedBrawlers, blogPosts, staticPages));

  process.stdout.write(`Generated homepage SEO blocks, ${rankedBrawlers.length} brawler pages, ${blogPosts.length} blog pages, social share assets, and sitemap entries.\n`);
}

main();