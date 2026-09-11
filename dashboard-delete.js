/* Dashboard delete controls for Examon Academic Planner */
(function () {
  function getRoute() {
    return (location.hash || '#/dashboard').replace(/^#\/?/, '').split('/')[0] || 'dashboard';
  }

  function cloudSave() {
    try { if (typeof window.save === 'function') window.save(); } catch (_) {}
    try { if (typeof window.examonCloudSyncNow === 'function') window.examonCloudSyncNow(); } catch (_) {}
  }

  function deleteStudyPlan(planId) {
    if (!window.state || !Array.isArray(window.state.plans)) return;
    const plan = window.state.plans.find(p => p.id === planId);
    if (!plan) return;
    const ok = window.confirm(`Delete "${plan.batchName || plan.examName || 'this study plan'}"?\n\nThis will remove the batch and all its sessions from Dashboard and Calendar.`);
    if (!ok) return;
    window.state.plans = window.state.plans.filter(p => p.id !== planId);
    cloudSave();
    if (typeof window.render === 'function') window.render();
  }

  window.examonDeleteStudyPlan = deleteStudyPlan;

  function addDashboardDeleteButtons() {
    if (!window.state || !Array.isArray(window.state.plans)) return;
    if (getRoute() !== 'dashboard' && getRoute() !== '') return;

    const links = Array.from(document.querySelectorAll('a[href^="#/plans/"]'));
    links.forEach(link => {
      const match = link.getAttribute('href').match(/#\/plans\/([^"'?#]+)/);
      if (!match) return;
      const planId = decodeURIComponent(match[1]);
      const plan = window.state.plans.find(p => p.id === planId);
      if (!plan) return;

      const container = link.closest('.plan-card, .recent-plan, .row, .card, li, tr') || link.parentElement;
      if (!container || container.querySelector(`[data-dashboard-delete="${CSS.escape(planId)}"]`)) return;

      const actions = document.createElement('div');
      actions.className = 'dashboard-plan-actions';
      actions.style.cssText = 'display:flex;gap:8px;align-items:center;justify-content:flex-end;margin-top:10px;flex-wrap:wrap;';

      const openBtn = document.createElement('a');
      openBtn.className = 'btn small';
      openBtn.href = `#/plans/${planId}`;
      openBtn.textContent = 'Open';

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn small red';
      delBtn.dataset.dashboardDelete = planId;
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        deleteStudyPlan(planId);
      });

      actions.appendChild(openBtn);
      actions.appendChild(delBtn);
      container.appendChild(actions);
    });
  }

  function installRenderHook() {
    if (window.__examonDashboardDeleteHook) return;
    window.__examonDashboardDeleteHook = true;
    const originalRender = window.render;
    if (typeof originalRender === 'function') {
      window.render = function () {
        const result = originalRender.apply(this, arguments);
        setTimeout(addDashboardDeleteButtons, 50);
        return result;
      };
    }
    window.addEventListener('hashchange', () => setTimeout(addDashboardDeleteButtons, 100));
    document.addEventListener('DOMContentLoaded', () => setTimeout(addDashboardDeleteButtons, 200));
    setInterval(addDashboardDeleteButtons, 1200);
  }

  function boot() {
    if (typeof window.render === 'function' && window.state) {
      installRenderHook();
      addDashboardDeleteButtons();
      return;
    }
    setTimeout(boot, 250);
  }

  boot();
})();
