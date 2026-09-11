// Adds delete controls for saved study plans / batches.
// This patch is intentionally separate from the bundled app so it can be updated quickly.
(function () {
  const STORAGE_KEY = 'examonAcademicPlannerV1';

  function saveAndSync() {
    try {
      if (typeof window.save === 'function') {
        window.save();
      } else if (window.state) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(window.state));
      }
      if (typeof window.examonCloudSyncNow === 'function') window.examonCloudSyncNow();
    } catch (error) {
      console.error('Delete save failed', error);
    }
  }

  function toast(message) {
    if (typeof window.toast === 'function') return window.toast(message);
    const el = document.createElement('div');
    el.textContent = message;
    el.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:99999;background:#062033;color:white;padding:12px 16px;border-radius:12px;font-family:Arial,sans-serif;box-shadow:0 12px 30px rgba(0,0,0,.22)';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2400);
  }

  window.examonDeleteStudyPlan = function examonDeleteStudyPlan(planId) {
    if (!window.state || !Array.isArray(window.state.plans)) return;
    const plan = window.state.plans.find(p => p.id === planId);
    if (!plan) return toast('Study plan not found');

    const ok = window.confirm(`Delete this study plan permanently?\n\n${plan.batchName || 'Unnamed Study Plan'}\n\nThis will remove its generated sessions from calendar also.`);
    if (!ok) return;

    window.state.plans = window.state.plans.filter(p => p.id !== planId);
    saveAndSync();

    if (location.hash.includes(`/plans/${planId}`)) location.hash = '#/plans';
    if (typeof window.render === 'function') window.render();
    else window.dispatchEvent(new HashChangeEvent('hashchange'));

    setTimeout(() => addDeleteButtons(), 50);
    toast('Study plan deleted');
  };

  function styleOnce() {
    if (document.querySelector('style[data-delete-patch]')) return;
    const style = document.createElement('style');
    style.setAttribute('data-delete-patch', 'true');
    style.textContent = `
      .delete-plan-btn {
        border: 1px solid #ffb3b8 !important;
        background: #fff1f2 !important;
        color: #b4232d !important;
        border-radius: 10px !important;
        padding: 8px 12px !important;
        font-weight: 800 !important;
        cursor: pointer !important;
      }
      .delete-plan-btn:hover { background:#ffe2e5 !important; }
      .delete-plan-inline { margin-left: 10px !important; }
      .delete-plan-detail { margin-left: 8px !important; }
    `;
    document.head.appendChild(style);
  }

  function planIdFromHref(href) {
    const match = String(href || '').match(/#\/plans\/([^\s?#]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function addDeleteButtons() {
    if (!window.state || !Array.isArray(window.state.plans)) return;
    styleOnce();

    document.querySelectorAll('a[href^="#/plans/"]').forEach(link => {
      const planId = planIdFromHref(link.getAttribute('href'));
      if (!planId || !window.state.plans.some(p => p.id === planId)) return;

      const row = link.closest('tr');
      if (row && !row.querySelector(`[data-delete-plan-id="${CSS.escape(planId)}"]`)) {
        const cell = row.lastElementChild || row.appendChild(document.createElement('td'));
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'delete-plan-btn delete-plan-inline';
        btn.dataset.deletePlanId = planId;
        btn.textContent = 'Delete';
        btn.addEventListener('click', event => {
          event.preventDefault();
          event.stopPropagation();
          window.examonDeleteStudyPlan(planId);
        });
        cell.appendChild(btn);
      }
    });

    const detailMatch = location.hash.match(/^#\/plans\/([^\s?#]+)/);
    if (detailMatch) {
      const planId = decodeURIComponent(detailMatch[1]);
      const topActions = document.querySelector('.top-actions');
      if (topActions && !topActions.querySelector(`[data-delete-plan-id="${CSS.escape(planId)}"]`) && window.state.plans.some(p => p.id === planId)) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'delete-plan-btn delete-plan-detail';
        btn.dataset.deletePlanId = planId;
        btn.textContent = 'Delete Plan';
        btn.addEventListener('click', event => {
          event.preventDefault();
          event.stopPropagation();
          window.examonDeleteStudyPlan(planId);
        });
        topActions.insertBefore(btn, topActions.firstChild);
      }
    }
  }

  const observer = new MutationObserver(() => addDeleteButtons());
  function boot() {
    styleOnce();
    addDeleteButtons();
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('hashchange', () => setTimeout(addDeleteButtons, 80));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
