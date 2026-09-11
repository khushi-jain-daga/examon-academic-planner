/* Dashboard actions + required subject/faculty mapping patch */
(function () {
  const STORAGE_KEY = 'examonAcademicPlannerV1';
  const requiredFacultySubjects = {
    'f-gaurav': ['Engineering Mechanics', 'Production Engineering', 'Theory of Machines', 'Engineering Mathematics', 'Quantitative Aptitude', 'Machine Design', 'Robotics Engineering', 'Heat Transfer', 'Mechanical Technical Practice'],
    'f-shivam': ['Fluid Mechanics', 'Thermodynamics', 'Power Plant Engineering', 'Strength of Materials', 'RAC', 'IC Engine', 'Industrial Engineering', 'Engineering Mathematics', 'Material Science', 'Reasoning', 'Mechanical Technical Practice'],
    'f-joshit': ['Environmental Engineering', 'Hydrology & Irrigation', 'Transportation Engineering', 'BMC', 'Survey', 'Geotechnical Engineering', 'Structure Analysis', 'Steel', 'RCC', 'Civil Technical Practice', 'Physics'],
    'f-amrit': ['History', 'Polity', 'Geography', 'Non-Technical Practice'],
    'f-anjna': ['General Awareness', 'Economy', 'Biology', 'Chemistry', 'Static GK / Current Affairs'],
    'f-rakhi': ['English']
  };
  const requiredSubjectMap = {
    'reasoning': { name: 'Reasoning', facultyIds: ['f-shivam'], branch: 'Non-Tech', category: 'Non-Technical Theory', technical: false },
    'physics': { name: 'Physics', facultyIds: ['f-joshit'], branch: 'Non-Tech', category: 'Non-Technical Theory', technical: false },
    'history': { name: 'History', facultyIds: ['f-amrit'], branch: 'Non-Tech', category: 'Non-Technical Theory', technical: false },
    'polity': { name: 'Polity', facultyIds: ['f-amrit'], branch: 'Non-Tech', category: 'Non-Technical Theory', technical: false },
    'geography': { name: 'Geography', facultyIds: ['f-amrit'], branch: 'Non-Tech', category: 'Non-Technical Theory', technical: false },
    'economy': { name: 'Economy', facultyIds: ['f-anjna'], branch: 'Non-Tech', category: 'Non-Technical Theory', technical: false },
    'biology': { name: 'Biology', facultyIds: ['f-anjna'], branch: 'Non-Tech', category: 'Non-Technical Theory', technical: false },
    'bio': { name: 'Biology', facultyIds: ['f-anjna'], branch: 'Non-Tech', category: 'Non-Technical Theory', technical: false },
    'chemistry': { name: 'Chemistry', facultyIds: ['f-anjna'], branch: 'Non-Tech', category: 'Non-Technical Theory', technical: false },
    'chem': { name: 'Chemistry', facultyIds: ['f-anjna'], branch: 'Non-Tech', category: 'Non-Technical Theory', technical: false },
    'static gk': { name: 'Static GK / Current Affairs', facultyIds: ['f-anjna'], branch: 'Non-Tech', category: 'Non-Technical Theory', technical: false },
    'static g k': { name: 'Static GK / Current Affairs', facultyIds: ['f-anjna'], branch: 'Non-Tech', category: 'Non-Technical Theory', technical: false },
    'current affairs': { name: 'Static GK / Current Affairs', facultyIds: ['f-anjna'], branch: 'Non-Tech', category: 'Non-Technical Theory', technical: false },
    'static gk current affairs': { name: 'Static GK / Current Affairs', facultyIds: ['f-anjna'], branch: 'Non-Tech', category: 'Non-Technical Theory', technical: false }
  };

  function normalize(value) {
    return String(value || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function getRoute() {
    return (location.hash || '#/dashboard').replace(/^#\/?/, '').split('/')[0] || 'dashboard';
  }

  function cloudSave() {
    try { if (typeof window.save === 'function') window.save(); } catch (_) {}
    try {
      if (window.state) localStorage.setItem(STORAGE_KEY, JSON.stringify(window.state));
      if (typeof window.examonCloudSyncNow === 'function') window.examonCloudSyncNow();
    } catch (_) {}
  }

  function toast(message) {
    if (typeof window.toast === 'function') return window.toast(message);
    const el = document.createElement('div');
    el.textContent = message;
    el.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:999999;background:#062033;color:white;padding:12px 16px;border-radius:12px;font-family:Arial,sans-serif;box-shadow:0 12px 30px rgba(0,0,0,.22)';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2400);
  }

  function forceRequiredSubjectMappings() {
    if (!window.state || !Array.isArray(window.state.subjects) || !Array.isArray(window.state.faculty)) return;
    const facultyById = Object.fromEntries(window.state.faculty.map(f => [f.id, f]));
    Object.entries(requiredFacultySubjects).forEach(([id, subjects]) => {
      if (facultyById[id]) facultyById[id].subjects = subjects.slice();
    });

    const canonicalByName = {};
    Object.values(requiredSubjectMap).forEach(item => canonicalByName[normalize(item.name)] = item);
    const subjectByNorm = new Map(window.state.subjects.map(s => [normalize(s.name), s]));

    Object.values(canonicalByName).forEach(item => {
      let subject = subjectByNorm.get(normalize(item.name));
      if (!subject) {
        subject = { id: 's-' + normalize(item.name).replace(/\s+/g, '-'), name: item.name, duration: 60, active: true };
        window.state.subjects.push(subject);
        subjectByNorm.set(normalize(item.name), subject);
      }
      subject.name = item.name;
      subject.facultyIds = item.facultyIds.slice();
      subject.branch = item.branch;
      subject.category = item.category;
      subject.technical = item.technical;
      subject.active = true;
    });

    function fixEntity(entity) {
      const item = requiredSubjectMap[normalize(entity.subjectName || entity.name)] || canonicalByName[normalize(entity.subjectName || entity.name)];
      if (!item) return;
      if (entity.subjectName) entity.subjectName = item.name;
      if (entity.name) entity.name = item.name;
      entity.facultyIds = item.facultyIds.slice();
      entity.category = item.category;
    }

    (window.state.templates || []).forEach(t => (t.modules || []).forEach(fixEntity));
    (window.state.plans || []).forEach(p => {
      (p.modules || []).forEach(fixEntity);
      (p.sessions || []).forEach(fixEntity);
      if (p.planType === 'Revision') p.planType = 'Theory + Question Practice';
    });
    if (window.draft) {
      (window.draft.modules || []).forEach(fixEntity);
      if (window.draft.planType === 'Revision') window.draft.planType = 'Theory + Question Practice';
      window.draft.selectedFacultyIds = [...new Set((window.draft.modules || []).flatMap(m => m.facultyIds || []))];
    }
  }

  function deleteStudyPlan(planId) {
    if (!window.state || !Array.isArray(window.state.plans)) return;
    const plan = window.state.plans.find(p => p.id === planId);
    if (!plan) return toast('Study plan not found');
    const ok = window.confirm(`Delete "${plan.batchName || plan.examName || 'this study plan'}"?\n\nThis will remove the batch and all its sessions from Dashboard and Calendar.`);
    if (!ok) return;
    window.state.plans = window.state.plans.filter(p => p.id !== planId);
    cloudSave();
    if (typeof window.render === 'function') window.render();
    setTimeout(addDashboardDeletePanel, 80);
    toast('Study plan deleted');
  }

  window.examonDeleteStudyPlan = deleteStudyPlan;

  function installCSS() {
    if (document.querySelector('style[data-dashboard-actions-v3]')) return;
    const style = document.createElement('style');
    style.setAttribute('data-dashboard-actions-v3', 'true');
    style.textContent = `
      .dashboard-visible-actions { margin: 12px 0 18px; display: grid; gap: 10px; }
      .dashboard-visible-action-row { border: 1px solid #cfe4ee; background: #f8fdff; border-radius: 14px; padding: 12px; display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 12px; align-items: center; }
      .dashboard-visible-action-row b { display:block; color:#071e36; font-size: 14px; line-height: 1.35; white-space: normal; overflow: visible; text-overflow: unset; }
      .dashboard-visible-meta { color:#60738a; font-size: 12px; margin-top: 3px; }
      .dashboard-action-buttons { display:flex; gap:8px; align-items:center; flex-wrap:wrap; justify-content:flex-end; }
      .dashboard-action-buttons a, .dashboard-action-buttons button { border:0; border-radius: 10px; padding: 8px 12px; font-weight: 800; cursor:pointer; text-decoration:none; font-family:inherit; font-size: 13px; }
      .dashboard-open-btn { background:#07b9c6; color:#021522; }
      .dashboard-delete-btn { background:#fff1f2; color:#b4232d; border:1px solid #ffb3b8 !important; }
      .dashboard-delete-btn:hover { background:#ffe2e5; }
      .table-wrap table.table th:last-child, .table-wrap table.table td:last-child { min-width: 96px; }
      @media(max-width:760px){.dashboard-visible-action-row{grid-template-columns:1fr}.dashboard-action-buttons{justify-content:flex-start}}
    `;
    document.head.appendChild(style);
  }

  function addDashboardDeletePanel() {
    if (!window.state || !Array.isArray(window.state.plans)) return;
    forceRequiredSubjectMappings();
    installCSS();
    const route = getRoute();
    if (route !== 'dashboard' && route !== '') return;

    const recentHeading = Array.from(document.querySelectorAll('h3')).find(h => /recent study plans/i.test(h.textContent || ''));
    if (!recentHeading) return;
    let panel = document.querySelector('.dashboard-visible-actions');
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'dashboard-visible-actions';
      recentHeading.insertAdjacentElement('afterend', panel);
    }

    const plans = window.state.plans.slice(0, 8);
    panel.innerHTML = plans.length ? plans.map(plan => {
      const sessions = Array.isArray(plan.sessions) ? plan.sessions.length : 0;
      return `<div class="dashboard-visible-action-row" data-plan-row="${plan.id}">
        <div><b>${escapeHtml(plan.batchName || 'Unnamed Study Plan')}</b><div class="dashboard-visible-meta">${escapeHtml(plan.examName || '')} · ${escapeHtml(plan.planType || '')} · ${sessions} session(s)</div></div>
        <div class="dashboard-action-buttons"><a class="dashboard-open-btn" href="#/plans/${encodeURIComponent(plan.id)}">Open</a><button type="button" class="dashboard-delete-btn" data-visible-delete="${plan.id}">Delete</button></div>
      </div>`;
    }).join('') : '<div class="dashboard-visible-meta">No plans yet.</div>';

    panel.querySelectorAll('[data-visible-delete]').forEach(btn => {
      btn.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        deleteStudyPlan(btn.getAttribute('data-visible-delete'));
      });
    });
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function boot() {
    if (!window.state) return setTimeout(boot, 250);
    forceRequiredSubjectMappings();
    cloudSave();
    addDashboardDeletePanel();
    if (!window.__dashboardActionsInterval) {
      window.__dashboardActionsInterval = setInterval(() => {
        forceRequiredSubjectMappings();
        addDashboardDeletePanel();
      }, 1000);
    }
    window.addEventListener('hashchange', () => setTimeout(addDashboardDeletePanel, 150));
  }

  boot();
})();
