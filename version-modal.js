(function () {
  'use strict';

  const REPO_URL = 'https://github.com/PeterPari/brawlrank';
  const ISSUES_URL = 'https://github.com/PeterPari/brawlrank/issues';

  let versionText = '';
  let versionDate = '';

  // Self-contained overlay — works on every page regardless of which JS is loaded
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'versionModalOverlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Version information');

  const box = document.createElement('div');
  box.className = 'modal';

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  function buildContent() {
    const dateMarkup = versionDate
      ? `<div class="version-modal-meta">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
           Released ${versionDate}
         </div>`
      : '<div class="version-modal-meta">Release date unavailable</div>';

    return `
      <button class="modal-close" id="versionModalClose" aria-label="Close">✕</button>
      <div class="version-modal-header">
        <div class="version-modal-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
        </div>
        <div>
          <h2 class="version-modal-title">BrawlRank Open Source</h2>
          <div class="version-modal-badge">v${versionText}</div>
        </div>
      </div>
      ${dateMarkup}
      <div class="version-modal-body">
        <p class="version-modal-text">BrawlRank is an open-source project. Explore the codebase, suggest features, or report bugs directly on GitHub.</p>
        <div class="version-modal-links">
          <a class="version-modal-link" href="${REPO_URL}" target="_blank" rel="noopener noreferrer">
            <span class="v-link-left">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
              GitHub Repository
            </span>
          </a>
          <a class="version-modal-link" href="${ISSUES_URL}" target="_blank" rel="noopener noreferrer">
            <span class="v-link-left">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              Report an Issue
            </span>
          </a>
          <a class="version-modal-link" href="/changelog.html">
            <span class="v-link-left">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"></path><rect x="9" y="3" width="6" height="4" rx="1"></rect><line x1="9" y1="12" x2="15" y2="12"></line><line x1="9" y1="16" x2="12" y2="16"></line></svg>
              Changelog
            </span>
          </a>
        </div>
      </div>
    `;
  }

  function openModal() {
    if (!versionText) return;
    box.innerHTML = buildContent();
    document.getElementById('versionModalClose').addEventListener('click', closeModal);
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) closeModal();
  });

  async function init() {
    const btn = document.getElementById('siteVersion');
    if (!btn) return;

    try {
      const [vRes, dRes] = await Promise.all([
        fetch('/version', { cache: 'no-cache' }),
        fetch('/version-date', { cache: 'no-cache' })
      ]);
      versionText = vRes.ok ? (await vRes.text()).trim() : '';
      versionDate = dRes.ok ? (await dRes.text()).trim() : '';
    } catch { /* silent — version display is non-critical */ }

    if (versionText) {
      btn.textContent = `Version ${versionText}`;
      btn.disabled = false;
    } else {
      btn.textContent = 'Version unavailable';
      btn.disabled = true;
    }

    btn.addEventListener('click', openModal);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
