# BrawlRank Implementation Plan

## Phase 1: Data Architecture & Cleanup

**Foundation: Centralize data and remove deprecated features**

1. **Centralize brawler scores**

   - Create a centralized scoring system/service
   - Refactor all components to pull from single source of truth
   - Ensure consistent score access patterns across the app
2. **Remove /brawlers page**

   - Delete the /brawlers route and associated components
   - Set up redirect to homepage (/
   - Clean up any navigation links pointing to old route

---

## Phase 2: Individual Brawler Pages

**Core feature: Build out brawler detail pages**

3. **Create individual brawler pages**

   - Set up dynamic routing (e.g., /shelly or /bull)
   - Design page layout with good visual hierarchy
   - Implement all sources as clickable elements
   - Add centralized source modals (reusable component)
4. **Connect tier list icons to brawler pages**

   - Make brawler icons in tier list clickable links
   - Wire up navigation to individual brawler pages
   - Ensure proper URL parameters/slugs

---

## Phase 3: Navigation & Layout

**UX: Consistent navigation and page structure**

5. **Create universal footer**

   - Extract footer from homepage into reusable component
   - Apply to all pages (homepage + individual brawler pages)
   - Ensure consistent styling
6. **Add "Back to tier list" button**

   - Remove any current nav on brawler pages and replace with back to tier list button
   - Place in top nav of individual brawler pages
   - Use consistent styling with existing nav
   - Ensure mobile-responsive positioning

---

## Phase 4: Data Quality Indicators

**Trust signals: Help users assess ranking reliability**

7. **Add decay hover information card**

   - Create hover state for decay information
   - Display contextual explanation on hover
8. **Make decay cards look better**

   - Improve visual design of existing decay cards
   - Better typography, spacing, color treatment
9. **Add source count warning**

   - Detect brawlers with <3 sources
   - Display warning indicator on brawler page
   - Message: "Limited data — ranking may be less reliable"
10. **Ensure modal content parity**

    - Audit brawler modal content
    - Verify every element exists on individual brawler page
    - Migrate any missing information

---

## Phase 5: Polish & Interactions

**Refinement: Modal behavior and navigation fixes**

11. **Implement modal gap behavior**

    - Add 150px margin from screen edge on open
    - Set breakpoint where behavior disappears (e.g., tablet/desktop width)
    - Use media queries for responsive behavior
12. **Fix top sources button**

    - Change from modal trigger to anchor link
    - Link to #sources section on page
    - Smooth scroll behavior

---

## Dependencies

- Phase 1 must complete before Phase 2 (data layer needed for pages)
- Phase 2 should complete before Phase 3 (pages exist before adding navigation)
- Phase 4 can run parallel to Phase 3 after Phase 2 starts
- Phase 5 depends on modals existing (Phase 2) and navigation (Phase 3)
