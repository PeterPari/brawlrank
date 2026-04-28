function main() {
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const updatedDate = parseLastUpdated(data.last_updated);
  const rankedBrawlers = computeRankedBrawlers(data);
  const groupedBrawlers = groupBrawlersByTier(rankedBrawlers);
  const faqEntries = buildFaqEntries(data, rankedBrawlers);

  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  const updatedHomepage = updateHomepage(indexHtml, data, rankedBrawlers, groupedBrawlers, faqEntries, updatedDate);

  fs.writeFileSync(indexPath, updatedHomepage);
  writeBrawlerPages(data, rankedBrawlers, groupedBrawlers, updatedDate);
  fs.writeFileSync(sitemapPath, buildSitemapXml(updatedDate, rankedBrawlers));

  process.stdout.write(`Generated homepage SEO blocks, ${rankedBrawlers.length} brawler pages, and sitemap entries.\n`);
}
const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const indexPath = path.join(rootDir, 'index.html');
const dataPath = path.join(rootDir, 'data.json');

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

function getTierFromScore(score) {
  if (score >= TIER_THRESHOLDS.S) return 'S';
  if (score >= TIER_THRESHOLDS.A) return 'A';
  if (score >= TIER_THRESHOLDS.B) return 'B';
  if (score >= TIER_THRESHOLDS.C) return 'C';
  if (score >= TIER_THRESHOLDS.D) return 'D';
  return 'F';
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function computeRankedBrawlers(data) {
  return data.brawlers
    .map((brawler) => {
      let weightedSum = 0;
      let totalWeight = 0;
      let sourceCount = 0;

      const noffTop = brawler.sources['Noff.gg'];
      const noffRanked = brawler.sources['Noff Ranked'];
      if (noffTop || noffRanked) {
        const mergedValue = noffTop && noffRanked
          ? (TIER_VALUES[noffTop] + TIER_VALUES[noffRanked]) / 2
          : TIER_VALUES[noffTop || noffRanked];

        weightedSum += mergedValue * SOURCE_WEIGHTS['Noff.gg'];
        totalWeight += SOURCE_WEIGHTS['Noff.gg'];
        sourceCount += 1;
      }

      for (const [sourceName, weight] of Object.entries(SOURCE_WEIGHTS)) {
        if (sourceName === 'Noff.gg') {
          continue;
        }

        const tier = brawler.sources[sourceName];
        if (!tier) {
          continue;
        }

        weightedSum += TIER_VALUES[tier] * weight;
        totalWeight += weight;
        sourceCount += 1;
      }

      const score = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : 0;
      return {
        ...brawler,
        score,
        tier: getTierFromScore(score),
        num_sources: sourceCount,
        url: `${SITE_URL}#${encodeURIComponent(brawler.name)}`
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.name.localeCompare(right.name);
    });
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

function replaceGeneratedBlock(contents, startMarker, endMarker, replacement) {
  const startIndex = contents.indexOf(startMarker);
  const endIndex = contents.indexOf(endMarker);
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error(`Unable to find marker block: ${startMarker}`);
  }

  const blockStart = startIndex + startMarker.length;
  return `${contents.slice(0, blockStart)}\n${replacement}\n${contents.slice(endIndex)}`;
}

function main() {
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const rankedBrawlers = computeRankedBrawlers(data);
  const faqEntries = buildFaqEntries(data, rankedBrawlers);
  const structuredDataMarkup = buildStructuredDataMarkup(data, rankedBrawlers, faqEntries);
  const faqSectionMarkup = buildFaqSectionMarkup(faqEntries);

  let indexHtml = fs.readFileSync(indexPath, 'utf8');
  indexHtml = replaceGeneratedBlock(
    indexHtml,
    '<!-- GENERATED_STRUCTURED_DATA_START -->',
    '<!-- GENERATED_STRUCTURED_DATA_END -->',
    structuredDataMarkup
  );
  indexHtml = replaceGeneratedBlock(
    indexHtml,
    '<!-- GENERATED_FAQ_SECTION_START -->',
    '<!-- GENERATED_FAQ_SECTION_END -->',
    faqSectionMarkup
  );

  fs.writeFileSync(indexPath, indexHtml);
  process.stdout.write(`Generated structured data for ${rankedBrawlers.length} brawlers.\n`);
}

main();