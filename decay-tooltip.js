(function () {
  'use strict';

  const RECENCY_THRESHOLD_DAYS = 15;

  const el = document.createElement('div');
  el.className = 'decay-global-tooltip';
  el.setAttribute('role', 'tooltip');
  el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el);

  function position(badge) {
    const rect = badge.getBoundingClientRect();
    const tw = 230;
    const th = el.offsetHeight;
    let left = rect.left + rect.width / 2 - tw / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
    let top = rect.top - th - 8;
    if (top < 8) top = rect.bottom + 8;
    el.style.left = left + 'px';
    el.style.top = top + 'px';
  }

  document.addEventListener('mouseover', (e) => {
    const badge = e.target.closest('[data-decay-pct]');
    if (!badge) return;
    const daysOld = parseInt(badge.dataset.decayDays, 10) || 0;
    const pct = badge.dataset.decayPct;
    const daysOver = Math.max(0, daysOld - RECENCY_THRESHOLD_DAYS);
    el.innerHTML = `
      <div class="decay-tooltip-title">Source aging</div>
      <p class="decay-tooltip-body">Sources older than ${RECENCY_THRESHOLD_DAYS} days lose influence. Weight halves every 7 days past the threshold.</p>
      <p class="decay-tooltip-detail">This source is ${daysOld} days old — ${daysOver} days past threshold — weight reduced by ${pct}%.</p>
    `;
    el.classList.add('visible');
    position(badge);
  });

  document.addEventListener('mouseout', (e) => {
    const badge = e.target.closest('[data-decay-pct]');
    if (badge && (!e.relatedTarget || !badge.contains(e.relatedTarget))) {
      el.classList.remove('visible');
    }
  });
})();
