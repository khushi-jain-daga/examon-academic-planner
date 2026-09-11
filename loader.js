async function loadText(path) {
  const response = await fetch(`/${path}?v=8`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
  return response.text();
}

const EXAMON_RUNTIME_PATCH = String.raw`
;(function () {
  const LOGO = 'assets/examon-logo.webp';
  const STORAGE_KEY = 'examonAcademicPlannerV1';
  const MENTORSHIP_FOOTER = 'Examon Education | Mentorship: 8368886452';

  const normalize = (value = '') => String(value).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();
  const splitList = (value = '') => String(value).split(',').map(item => item.trim()).filter(Boolean);
  const unique = arr => [...new Set((arr || []).filter(Boolean))];

  const subjectAliases = {
    'reasoning': 'Reasoning',
    'physics': 'Physics',
    'history': 'History',
    'polity': 'Polity',
    'geography': 'Geography',
    'economy': 'Economy',
    'bio': 'Biology',
    'biology': 'Biology',
    'chem': 'Chemistry',
    'chemistry': 'Chemistry',
    'static gk': 'Static GK / Current Affairs',
    'static g k': 'Static GK / Current Affairs',
    'static gk current affairs': 'Static GK / Current Affairs',
    'current affairs': 'Static GK / Current Affairs'
  };

  const mandatoryMap = {
    'Reasoning': ['f-shivam'],
    'Physics': ['f-joshit'],
    'History': ['f-amrit'],
    'Polity': ['f-amrit'],
    'Geography': ['f-amrit'],
    'Economy': ['f-anjna'],
    'Biology': ['f-anjna'],
    'Chemistry': ['f-anjna'],
    'Static GK / Current Affairs': ['f-anjna']
  };

  function canonicalSubjectName(name) {
    return subjectAliases[normalize(name)] || name;
  }

  function idForSubject(name) {
    return 's-' + normalize(name).replace(/\s+/g, '-');
  }

  function toastSafe(message) {
    try { toast(message); return; } catch (_) {}
    const el = document.createElement('div');
    el.textContent = message;
    el.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:99999;background:#062033;color:white;padding:12px 16px;border-radius:12px;font-family:Arial,sans-serif;box-shadow:0 12px 30px rgba(0,0,0,.22)';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2400);
  }

  function subjectByName(name) {
    const key = normalize(canonicalSubjectName(name));
    return (state.subjects || []).find(s => normalize(s.name) === key);
  }

  function ensureSubject(name, facultyIds, branch = 'Non-Tech', category = 'Non-Technical Theory', technical = false) {
    const canonical = canonicalSubjectName(name);
    let subject = subjectByName(canonical);
    if (!subject) {
      subject = { id: idForSubject(canonical), name: canonical, branch, technical, category, facultyIds: [], duration: 60, active: true };
      state.subjects.push(subject);
    }
    subject.name = canonical;
    subject.facultyIds = unique(facultyIds);
    subject.active = true;
    return subject;
  }

  function applyFixedFacultyLists() {
    const facultyById = Object.fromEntries((state.faculty || []).map(f => [f.id, f]));
    if (facultyById['f-shivam']) facultyById['f-shivam'].subjects = ['Fluid Mechanics', 'Thermodynamics', 'Power Plant Engineering', 'Strength of Materials', 'RAC', 'IC Engine', 'Industrial Engineering', 'Engineering Mathematics', 'Mechanical Technical Practice', 'Material Science', 'Reasoning'];
    if (facultyById['f-joshit']) facultyById['f-joshit'].subjects = ['Environmental Engineering', 'Hydrology & Irrigation', 'Transportation Engineering', 'BMC', 'Survey', 'Geotechnical Engineering', 'Structure Analysis', 'Steel', 'RCC', 'Civil Technical Practice', 'Physics'];
    if (facultyById['f-amrit']) facultyById['f-amrit'].subjects = ['History', 'Polity', 'Geography', 'Non-Technical Practice'];
    if (facultyById['f-anjna']) facultyById['f-anjna'].subjects = ['General Awareness', 'Economy', 'Biology', 'Chemistry', 'Static GK / Current Affairs'];
  }

  function syncSubjectMasterFromFacultyCards() {
    if (!state || !Array.isArray(state.faculty) || !Array.isArray(state.subjects)) return;

    const subjectsByName = new Map((state.subjects || []).map(s => [normalize(s.name), s]));
    (state.subjects || []).forEach(subject => { subject.facultyIds = []; });

    (state.faculty || []).forEach(faculty => {
      const raw = Array.isArray(faculty.subjects) ? faculty.subjects.join(',') : faculty.subjects;
      splitList(raw).forEach(subjectNameRaw => {
        const name = canonicalSubjectName(subjectNameRaw);
        const key = normalize(name);
        let subject = subjectsByName.get(key);
        if (!subject) {
          const isFixedNonTech = ['Reasoning','Physics','History','Polity','Geography','Economy','Biology','Chemistry','Static GK / Current Affairs'].includes(name);
          const isCivil = Array.isArray(faculty.domains) && faculty.domains.includes('Civil');
          const isMechanical = Array.isArray(faculty.domains) && faculty.domains.includes('Mechanical');
          subject = {
            id: idForSubject(name),
            name,
            branch: isCivil ? 'Civil' : (isMechanical && !isFixedNonTech ? 'Mechanical' : 'Non-Tech'),
            technical: !!((isCivil || isMechanical) && !isFixedNonTech),
            category: isFixedNonTech ? 'Non-Technical Theory' : 'Technical Theory',
            facultyIds: [],
            duration: 60,
            active: true
          };
          subjectsByName.set(key, subject);
          state.subjects.push(subject);
        }
        if (!subject.facultyIds.includes(faculty.id)) subject.facultyIds.push(faculty.id);
      });
    });

    Object.entries(mandatoryMap).forEach(([subjectName, facultyIds]) => ensureSubject(subjectName, facultyIds));
  }

  function facultyIdsForSubject(name, fallback = []) {
    const canonical = canonicalSubjectName(name);
    if (mandatoryMap[canonical]) return unique(mandatoryMap[canonical]);
    const subject = subjectByName(canonical);
    return unique((subject && subject.facultyIds && subject.facultyIds.length) ? subject.facultyIds : fallback);
  }

  function applySubjectMappingsEverywhere() {
    state.settings = state.settings || {};
    state.settings.logo = LOGO;
    state.settings.footer = MENTORSHIP_FOOTER;
    state.settings.mentorship = '8368886452';

    Object.entries(mandatoryMap).forEach(([subjectName, facultyIds]) => ensureSubject(subjectName, facultyIds));

    const containers = [];
    (state.templates || []).forEach(t => containers.push(t));
    (state.plans || []).forEach(p => containers.push(p));
    if (typeof draft !== 'undefined' && draft) containers.push(draft);

    containers.forEach(container => {
      (container.modules || []).forEach(module => {
        module.subjectName = canonicalSubjectName(module.subjectName);
        module.facultyIds = facultyIdsForSubject(module.subjectName, module.facultyIds);
      });
      if (Array.isArray(container.selectedFacultyIds)) {
        container.selectedFacultyIds = unique((container.modules || []).flatMap(m => m.facultyIds || []));
      }
    });

    (state.plans || []).forEach(plan => {
      (plan.sessions || []).forEach(session => {
        session.subjectName = canonicalSubjectName(session.subjectName);
        session.facultyIds = facultyIdsForSubject(session.subjectName, session.facultyIds);
      });
    });
  }

  function persistNow() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
    try { if (typeof window.examonCloudSyncNow === 'function') window.examonCloudSyncNow(); } catch (_) {}
  }

  function installSaveHook() {
    if (window.__examonSaveHookInstalled) return;
    window.__examonSaveHookInstalled = true;
    const originalSave = save;
    save = function () {
      syncSubjectMasterFromFacultyCards();
      applySubjectMappingsEverywhere();
      const result = originalSave.apply(this, arguments);
      try { if (typeof window.examonCloudSyncNow === 'function') window.examonCloudSyncNow(); } catch (_) {}
      return result;
    };
  }

  function deleteStudyPlan(planId) {
    const plan = (state.plans || []).find(p => p.id === planId);
    if (!plan) return toastSafe('Study plan not found');
    const ok = confirm('Delete this study plan permanently?\n\n' + (plan.batchName || plan.examName || 'Unnamed Study Plan') + '\n\nThis will remove it from Dashboard, Study Plans and Calendar.');
    if (!ok) return;
    state.plans = (state.plans || []).filter(p => p.id !== planId);
    persistNow();
    if (location.hash.includes('/plans/' + planId)) location.hash = '#/plans';
    render();
    toastSafe('Study plan deleted');
  }

  window.examonDeleteStudyPlan = deleteStudyPlan;

  function installUiCss() {
    if (document.querySelector('style[data-examon-runtime-patch]')) return;
    const style = document.createElement('style');
    style.setAttribute('data-examon-runtime-patch', 'true');
    style.textContent = `
      .brand img, .top-actions img, .print-logo-inline { object-fit: contain !important; }
      .print-page { position: relative !important; overflow: hidden !important; }
      .print-page::after { content: '' !important; position: absolute !important; inset: 0 !important; background-image: url('${LOGO}') !important; background-repeat: no-repeat !important; background-position: center center !important; background-size: min(62%, 520px) auto !important; opacity: 0.15 !important; z-index: 9999 !important; pointer-events: none !important; mix-blend-mode: multiply !important; }
      .print-page > * { position: relative !important; z-index: 1 !important; }
      .print-area .module-card-top span, .print-area .module-page-count, .print-area .structure-list div:last-child, .print-area .module-summary th:nth-child(5), .print-area .module-summary td:nth-child(5) { display: none !important; }
      .dash-visible-actions { display:flex; gap:8px; align-items:center; margin-top:8px; flex-wrap:wrap; position:relative; z-index:5; }
      .dash-visible-actions .open-plan, .dash-visible-actions .delete-plan { border:0; border-radius:10px; padding:7px 12px; font-weight:800; cursor:pointer; text-decoration:none; font-size:13px; display:inline-flex; align-items:center; justify-content:center; }
      .dash-visible-actions .open-plan { background:#e6fbff; color:#006775; }
      .dash-visible-actions .delete-plan { background:#fff1f2; color:#b4232d; border:1px solid #ffb3b8; }
      .delete-plan-main { background:#fff1f2 !important; color:#b4232d !important; border:1px solid #ffb3b8 !important; }
      .cloud-status-pill { position:fixed; right:18px; bottom:18px; z-index:9999; border-radius:999px; padding:9px 13px; font:700 12px Arial,sans-serif; box-shadow:0 8px 24px rgba(6,32,51,.15); background:#e6fbff; color:#006775; border:1px solid #b7edf5; }
      .cloud-status-pill.error { background:#fff1f2; color:#b4232d; border-color:#ffb3b8; }
      @media print { .print-page::after { opacity:0.15 !important; -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; } }
    `;
    document.head.appendChild(style);
  }

  function injectDeleteButtons() {
    installUiCss();
    const route = currentRoute();

    document.querySelectorAll('a[href^="#/plans/"]').forEach(link => {
      const match = link.getAttribute('href').match(/#\/plans\/([^"'?#]+)/);
      if (!match) return;
      const planId = decodeURIComponent(match[1]);
      if (!(state.plans || []).some(p => p.id === planId)) return;

      const cell = link.closest('td') || link.parentElement;
      if (!cell || cell.querySelector('[data-delete-visible="' + CSS.escape(planId) + '"]')) return;
      const actions = document.createElement('div');
      actions.className = 'dash-visible-actions';
      actions.setAttribute('data-delete-visible', planId);
      actions.innerHTML = '<a class="open-plan" href="#/plans/' + planId + '">Open</a><button type="button" class="delete-plan" data-delete-plan="' + planId + '">Delete</button>';
      const titleBlock = link.parentElement || cell;
      titleBlock.appendChild(actions);
    });

    const detailMatch = location.hash.match(/^#\/plans\/([^\s?#]+)/);
    if (detailMatch) {
      const planId = decodeURIComponent(detailMatch[1]);
      const topActions = document.querySelector('.top-actions');
      if (topActions && !topActions.querySelector('[data-delete-plan="' + CSS.escape(planId) + '"]') && (state.plans || []).some(p => p.id === planId)) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn small delete-plan-main';
        btn.dataset.deletePlan = planId;
        btn.textContent = 'Delete Plan';
        topActions.insertBefore(btn, topActions.firstChild);
      }
    }
  }

  function installClickHandlers() {
    document.addEventListener('click', event => {
      const deleteBtn = event.target.closest && event.target.closest('[data-delete-plan]');
      if (deleteBtn) {
        event.preventDefault();
        event.stopPropagation();
        deleteStudyPlan(deleteBtn.dataset.deletePlan);
        return;
      }

      const text = (event.target && event.target.textContent || '').trim().toLowerCase();
      if (text === 'save' || text.includes('save settings')) {
        setTimeout(() => {
          syncSubjectMasterFromFacultyCards();
          applySubjectMappingsEverywhere();
          persistNow();
          render();
          toastSafe('Saved and synced');
        }, 120);
      }
    }, true);
  }

  function installRenderHook() {
    if (window.__examonRenderHookInstalled) return;
    window.__examonRenderHookInstalled = true;
    const originalRender = render;
    render = function () {
      applySubjectMappingsEverywhere();
      const result = originalRender.apply(this, arguments);
      setTimeout(injectDeleteButtons, 0);
      return result;
    };
    window.render = render;
  }

  function installCloudStatus() {
    function update() {
      let status = window.EXAMON_CLOUD_STATUS || {};
      let el = document.querySelector('.cloud-status-pill');
      if (!el) {
        el = document.createElement('div');
        el.className = 'cloud-status-pill';
        document.body.appendChild(el);
      }
      const s = status.status || 'local';
      el.classList.toggle('error', s === 'error' || s === 'local');
      el.textContent = s === 'cloud' ? 'Saved to Cloud' : s === 'syncing' ? 'Syncing…' : s === 'error' ? 'Cloud Sync Error' : 'Local Only';
      el.title = status.detail || '';
    }
    update();
    window.addEventListener('examon-cloud-status', update);
    setInterval(update, 2500);
  }

  function normalizePlanType() {
    if (Array.isArray(PLAN_TYPES)) {
      const idx = PLAN_TYPES.indexOf('Revision');
      if (idx !== -1) PLAN_TYPES[idx] = 'Theory + Question Practice';
      if (!PLAN_TYPES.includes('Theory + Question Practice')) PLAN_TYPES.push('Theory + Question Practice');
    }
    (state.plans || []).forEach(p => { if (p.planType === 'Revision') p.planType = 'Theory + Question Practice'; });
    (state.templates || []).forEach(t => { if (t.type === 'Revision') t.type = 'Theory + Question Practice'; });
    if (typeof draft !== 'undefined' && draft && draft.planType === 'Revision') draft.planType = 'Theory + Question Practice';
  }

  try {
    installUiCss();
    applyFixedFacultyLists();
    syncSubjectMasterFromFacultyCards();
    applySubjectMappingsEverywhere();
    normalizePlanType();
    installSaveHook();
    installRenderHook();
    installClickHandlers();
    installCloudStatus();
    persistNow();
  } catch (error) {
    console.error('Examon runtime patch failed', error);
  }
})();
`;

async function waitForCloudReady() {
  if (!window.EXAMON_CLOUD_READY_PROMISE) return;
  try {
    await Promise.race([
      window.EXAMON_CLOUD_READY_PROMISE,
      new Promise(resolve => setTimeout(resolve, 1800))
    ]);
  } catch (_) {}
}

(async () => {
  try {
    await waitForCloudReady();

    const cssParts = await Promise.all(['chunks/styles-1.txt','chunks/styles-2.txt','chunks/styles-3.txt'].map(loadText));
    const style = document.createElement('style');
    style.textContent = cssParts.join('');
    document.head.appendChild(style);

    const jsParts = await Promise.all(['chunks/app-1.txt','chunks/app-2.txt','chunks/app-3.txt'].map(loadText));
    (0, eval)(jsParts.join('') + EXAMON_RUNTIME_PATCH);

    if (typeof window.render === 'function') window.render();
    else if (typeof render === 'function') render();
    else window.dispatchEvent(new HashChangeEvent('hashchange'));
  } catch (error) {
    console.error(error);
    const app = document.getElementById('app');
    if (app) app.innerHTML = `<div style="font-family:Arial,sans-serif;max-width:760px;margin:60px auto;padding:24px;border:1px solid #ddd;border-radius:16px;background:white"><h2>Unable to load Examon Academic Planner</h2><p>${String(error.message || error)}</p><p>Please refresh after the latest Vercel deployment completes.</p></div>`;
  }
})();
