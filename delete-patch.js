// Adds clearly visible delete controls for saved study plans / batches.
// Separate quick patch so it can be updated without rebuilding the bundled app.
(function () {
  const STORAGE_KEY = 'examonAcademicPlannerV1';

  function saveAndSync() {
    try {
      if (typeof window.save === 'function') window.save();
      else if (window.state) localStorage.setItem(STORAGE_KEY, JSON.stringify(window.state));
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

  function planExists(planId) {
    return !!(window.state && Array.isArray(window.state.plans) && window.state.plans.some(p => p.id === planId));
  }

  function planIdFromHref(href) {
    const match = String(href || '').match(/#\/plans\/([^\s?#]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  window.examonDeleteStudyPlan = function examonDeleteStudyPlan(planId) {
    if (!window.state || !Array.isArray(window.state.plans)) return;
    const plan = window.state.plans.find(p => p.id === planId);
    if (!plan) return toast('Study plan not found');

    const ok = window.confirm(`Delete this study plan permanently?\n\n${plan.batchName || 'Unnamed Study Plan'}\n\nThis will remove its generated sessions from dashboard and calendar also.`);
    if (!ok) return;

    window.state.plans = window.state.plans.filter(p => p.id !== planId);
    saveAndSync();

    if (location.hash.includes(`/plans/${planId}`)) location.hash = '#/plans';
    if (typeof window.render === 'function') window.render();
    else window.dispatchEvent(new HashChangeEvent('hashchange'));

    setTimeout(addDeleteButtons, 80);
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
        font-weight: 900 !important;
        cursor: pointer !important;
        line-height: 1 !important;
        white-space: nowrap !important;
      }
      .delete-plan-btn:hover { background:#ffe2e5 !important; }
      .delete-plan-inline { margin-left: 10px !important; }
      .delete-plan-detail { margin-left: 8px !important; }
      .dashboard-delete-bar {
        display: inline-flex !important;
        gap: 8px !important;
        align-items: center !important;
        margin-top: 8px !important;
        margin-left: 0 !important;
      }
      .dashboard-delete-wrap {
        display: flex !important;
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 6px !important;
        min-width: 260px !important;
      }
      .dashboard-delete-wrap a { max-width: 100% !important; white-space: normal !important; }
      .dashboard-recent-action-row {
        display: flex !important;
        gap: 8px !important;
        align-items: center !important;
        flex-wrap: wrap !important;
        margin-top: 8px !important;
      }
      .dashboard-recent-action-row .btn,
      .dashboard-recent-action-row a {
        border-radius: 10px !important;
        padding: 8px 12px !important;
        font-weight: 800 !important;
        text-decoration: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function makeDeleteButton(planId, label = 'Delete') {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'delete-plan-btn';
    btn.dataset.deletePlanId = planId;
    btn.textContent = label;
    btn.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      window.examonDeleteStudyPlan(planId);
    });
    return btn;
  }

  function isDashboard() {
    return location.hash === '' || location.hash === '#' || location.hash === '#/' || location.hash.startsWith('#/dashboard');
  }

  function addButtonsBesidePlanLinks() {
    document.querySelectorAll('a[href^="#/plans/"]').forEach(link => {
      const planId = planIdFromHref(link.getAttribute('href'));
      if (!planId || !planExists(planId)) return;

      // Dashboard: put Delete directly under/beside the batch title so it is visible without horizontal scrolling.
      if (isDashboard()) {
        const cell = link.closest('td') || link.parentElement;
        if (cell && !cell.querySelector(`[data-dashboard-delete-id="${CSS.escape(planId)}"]`)) {
          const wrap = document.createElement('div');
          wrap.className = 'dashboard-delete-wrap';
          link.parentNode.insertBefore(wrap, link);
          wrap.appendChild(link);

          const actions = document.createElement('div');
          actions.className = 'dashboard-recent-action-row';
          actions.dataset.dashboardDeleteId = planId;

          const open = document.createElement('a');
          open.href = `#/plans/${encodeURIComponent(planId)}`;
          open.className = 'btn small';
          open.textContent = 'Open';
          actions.appendChild(open);
          actions.appendChild(makeDeleteButton(planId, 'Delete'));
          wrap.appendChild(actions);
        }
        return;
      }

      // Study Plans page: keep Delete in the row, but also attach it near the title to avoid hidden horizontal scroll.
      const row = link.closest('tr');
      const titleCell = link.closest('td') || link.parentElement;
      if (titleCell && !titleCell.querySelector(`[data-delete-plan-id="${CSS.escape(planId)}"]`)) {
        const bar = document.createElement('div');
        bar.className = 'dashboard-delete-bar';
        bar.dataset.deletePlanId = planId;
        bar.appendChild(makeDeleteButton(planId, 'Delete'));
        titleCell.appendChild(bar);
      }
      if (row && !row.querySelector(`[data-row-delete-plan-id="${CSS.escape(planId)}"]`)) {
        const cell = row.lastElementChild || row.appendChild(document.createElement('td'));
        const btn = makeDeleteButton(planId, 'Delete');
        btn.classList.add('delete-plan-inline');
        btn.dataset.rowDeletePlanId = planId;
        cell.appendChild(btn);
      }
    });
  }

  function addDetailButton() {
    const detailMatch = location.hash.match(/^#\/plans\/([^\s?#]+)/);
    if (!detailMatch) return;
    const planId = decodeURIComponent(detailMatch[1]);
    if (!planExists(planId)) return;
    const topActions = document.querySelector('.top-actions');
    if (topActions && !topActions.querySelector(`[data-delete-plan-id="${CSS.escape(planId)}"]`)) {
      const btn = makeDeleteButton(planId, 'Delete Plan');
      btn.classList.add('delete-plan-detail');
      topActions.insertBefore(btn, topActions.firstChild);
    }
  }

  function addDashboardFallback() {
    if (!isDashboard() || !window.state || !Array.isArray(window.state.plans)) return;
    const recentHeading = [...document.querySelectorAll('h1,h2,h3,b')].find(el => /recent study plans/i.test(el.textContent || ''));
    const card = recentHeading && recentHeading.closest('.card');
    if (!card) return;
    window.state.plans.slice(0, 5).forEach(plan => {
      if (card.querySelector(`[data-dashboard-fallback-id="${CSS.escape(plan.id)}"]`)) return;
      const existingLink = card.querySelector(`a[href="#/plans/${CSS.escape(plan.id)}"]`);
      if (existingLink) return;
      const row = document.createElement('div');
      row.dataset.dashboardFallbackId = plan.id;
      row.style.cssText = 'display:flex;justify-content:space-between;gap:14px;align-items:center;padding:12px 0;border-top:1px solid #e6edf3';
      row.innerHTML = `<div><b>${String(plan.batchName || 'Unnamed Study Plan').replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]))}</b><div style="color:#6b7c90;font-size:13px">${String(plan.examName || '').replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]))} · ${(plan.sessions || []).length} sessions</div></div>`;
      const actions = document.createElement('div');
      actions.className = 'dashboard-recent-action-row';
      const open = document.createElement('a');
      open.href = `#/plans/${encodeURIComponent(plan.id)}`;
      open.className = 'btn small';
      open.textContent = 'Open';
      actions.appendChild(open);
      actions.appendChild(makeDeleteButton(plan.id, 'Delete'));
      row.appendChild(actions);
      card.appendChild(row);
    });
  }

  function addDeleteButtons() {
    if (!window.state || !Array.isArray(window.state.plans)) return;
    styleOnce();
    addButtonsBesidePlanLinks();
    addDetailButton();
    addDashboardFallback();
  }

  const observer = new MutationObserver(() => addDeleteButtons());
  function boot() {
    styleOnce();
    addDeleteButtons();
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('hashchange', () => setTimeout(addDeleteButtons, 120));
    setTimeout(addDeleteButtons, 300);
    setTimeout(addDeleteButtons, 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
