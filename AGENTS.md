# BrawlRank - AI Agent Knowledge Base

## Folder Map
- `/` = Root directory. Contains main HTML, CSS, vanilla JS entry points, and `data.json`.
- `brawlers/` = Statically generated individual brawler subpages.
- `scripts/` = Node.js build scripts (e.g., generating structured data and static pages).
- `fonts/` = Local web fonts used in the CSS.
- `portraits/` = Character portrait images used for the brawler icons.
- `social/` = Social sharing images and OG tags assets.
- `blog/` / `improvements/` = Assorted project directories (currently minimal or WIP).

## Key File Locations
- **Entry points**: `index.html` (Main UI), `app.js` (Frontend logic).
- **Static Build**: `scripts/generate-structured-data.js` (Handles SEO and static subpage generation).
- **Data Source**: `data.json` (Acts as the read-only database).
- **Styles**: `styles.css` (Vanilla CSS).
- **Config / DB / Env / Auth**: None. This is a fully static site without a backend framework or live database.

## Stack + Versions
- **Language**: Vanilla JavaScript (ES6+), HTML5, CSS3.
- **Framework**: None (Vanilla Web Stack).
- **Data**: Static JSON (`data.json`).
- **Environment**: Node.js (for build scripts only).
- **Package Manager**: npm/pnpm (no external dependencies, only basic scripts).

## Run/Test Commands
- `npm run build` or `npm run build:seo`: Runs `node scripts/generate-structured-data.js` to rebuild static data and subpages.
- **Local Dev Server**: Use VS Code Live Server (runs on port 5501 per `.vscode/settings.json`) or run `npx serve .` to serve the root directory over HTTP.

## Naming Conventions
- **Files**: kebab-case (`generate-structured-data.js`, `decay-tooltip.js`).
- **CSS Classes**: Component-based lowercase with hyphens (e.g., `.brawler-icon-wrap`, `.tier-row`).
- **Functions**: camelCase (`renderTierList()`, `getTierFromScore()`).
- **Constants/Globals**: UPPER_SNAKE_CASE (`TIER_DATA`, `SOURCE_WEIGHTS`).

## Architecture Rules
- **No Build Tools for Frontend**: The frontend is pure vanilla JS/CSS. Do not introduce bundlers (Webpack, Vite), transpilers (Babel), or frameworks (React, Tailwind) unless explicitly requested.
- **Data Flow**: `data.json` is fetched over HTTP by `app.js` to render the tier list dynamically in the browser.
- **Shared Logic Check**: Logic for calculating scores, recency decay, and tiers currently exists in both `app.js` (browser) and `scripts/generate-structured-data.js` (Node build). Ensure any changes to ranking logic are synchronized across both files or refactored centrally.

## What NOT to Touch
- `data.json`: Unless explicitly asked to modify the data payload.
- `scripts/generate-structured-data.js`: Unless the task involves static page generation or SEO updates.
- `.vscode/` or other system/IDE configuration files.

## Existing Shared Utilities
- **String Formatting**: `slugify(name)` (available in both app.js and build script).
- **Ranking Logic**: `getTierFromScore(score)` and `parseSourceDate(dateStr)`.
- **UI Helpers**: Look to `decay-tooltip.js` and `version-modal.js` for existing modularized frontend behaviors.

## Code Style Non-Defaults
- **No Modules (Frontend)**: Standard `<script src="...">` tags are used. Avoid using `import`/`export` ES modules in frontend scripts unless refactoring to a module setup.
- **Native DOM**: Heavy reliance on `document.createElement` and native DOM APIs over template strings for complex UI updates.

## Current Task / Project State
- Developing and maintaining the BrawlRank static tier list aggregator.
- Recent focus on UI/UX enhancements (modals, styling, responsive layouts) and aligning ranking logic between the static build environment and browser application.
