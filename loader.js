async function loadText(path) {
  const response = await fetch(`/${path}?v=9`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
  return response.text();
}

function examonRuntimePatch() {
  const LOGO = 'assets/examon-logo.webp';
  const STORAGE_KEY = 'examonAcademicPlannerV1';
  const MENTORSHIP_FOOTER = 'Examon Education | Mentorship: 8368886452';
  const normalize = (value = '') => String(value).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();
  const unique = arr => [...new Set((arr || []).filter(Boolean))];
  const splitList = value => String(value || '').split(',').map(x => x.trim()).filter(Boolean);

  const aliases = {
    'revision': 'Theory + Question Practice',
    'theory question practice': 'Theory + Question Practice',
    'theory and question practice': 'Theory + Question Practice',
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

  function canonical(name) { return aliases[normalize(name)] || name; }
  function idFor(name) { return 's-' + normalize(name).replace(/\s+/g, '-'); }
  function bySubjectName(name) { return (state.subjects || []).find(s => normalize(s.name) === normalize(canonical(name))); }
  function ensureSubject(name, facultyIds, branch = 'Non-Tech', category = 'Non-Technical Theory', technical = false) {
    const fixed = canonical(name);
    let subject = bySubjectName(fixed);
    if (!subject) {
      subject = { id: idFor(fixed), name: fixed, branch, technical, category, facultyIds: [], duration: 60, active: true };
      state.subjects.push(subject);
    }
    subject.name = fixed;
    subject.facultyIds = unique(facultyIds);
    subject.active = true;
    return subject;
  }
  function idsForSubject(name, fallback = []) {
    const fixed = canonical(name);
    if (mandatoryMap[fixed]) return unique(mandatoryMap[fixed]);
    const subject = bySubjectName(fixed);
    return unique(subject && subject.facultyIds && subject.facultyIds.length ? subject.facultyIds : fallback);
  }
  function toastSafe(message) {
    try { toast(message); return; } catch (_) {}
    const el = document.createElement('div');
    el.textContent = message;
    el.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:99999;background:#062033;color:white;padding:12px 16px;border-radius:12px;font-family:Arial,sans-serif;box-shadow:0 12px 30px rgba(0,0,0,.22)';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }
  function persistNow() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
    try { if (typeof window.examonCloudSyncNow === 'function') window.examonCloudSyncNow(); } catch (_) {}
  }

  function syncFacultySubjectsToMaster() {
    if (!state || !Array.isArray(state.faculty) || !Array.isArray(state.subjects)) return;
    (state.subjects || []).forEach(s => { s.facultyIds = []; });
    (state.faculty || []).forEach(f => {
      splitList(Array.isArray(f.subjects) ? f.subjects.join(',') : f.subjects).forEach(raw => {
        const name = canonical(raw);
        const isFixedNonTech = ['Reasoning','Physics','History','Polity','Geography','Economy','Biology','Chemistry','Static GK / Current Affairs'].includes(name);
        const domains = Array.isArray(f.domains) ? f.domains : splitList(f.domains);
        const branch = domains.includes('Civil') ? 'Civil' : (domains.includes('Mechanical') && !isFixedNonTech ? 'Mechanical' : 'Non-Tech');
        const subject = bySubjectName(name) || ensureSubject(name, [], branch, isFixedNonTech ? 'Non-Technical Theory' : 'Technical Theory', branch !== 'Non-Tech');
        if (!subject.facultyIds.includes(f.id)) subject.facultyIds.push(f.id);
      });
    });
    Object.entries(mandatoryMap).forEach(([name, ids]) => ensureSubject(name, ids));
  }

  function applyMappingsEverywhere() {
    if (!state) return;
    state.settings = state.settings || {};
    state.settings.logo = LOGO;
    state.settings.footer = MENTORSHIP_FOOTER;
    state.settings.mentorship = '8368886452';

    if (Array.isArray(PLAN_TYPES) && !PLAN_TYPES.includes('Theory + Question Practice')) {
      const i = PLAN_TYPES.indexOf('Revision');
      if (i >= 0) PLAN_TYPES.splice(i, 1, 'Theory + Question Practice'); else PLAN_TYPES.push('Theory + Question Practice');
    }

    const facultyById = Object.fromEntries((state.faculty || []).map(f => [f.id, f]));
    if (facultyById['f-shivam']) facultyById['f-shivam'].subjects = unique([...(facultyById['f-shivam'].subjects || []), 'Reasoning']).filter(x => x !== 'Physics');
    if (facultyById['f-joshit']) facultyById['f-joshit'].subjects = unique([...(facultyById['f-joshit'].subjects || []), 'Physics']);
    if (facultyById['f-amrit']) facultyById['f-amrit'].subjects = unique([...(facultyById['f-amrit'].subjects || []), 'History', 'Polity', 'Geography']);
    if (facultyById['f-anjna']) facultyById['f-anjna'].subjects = unique([...(facultyById['f-anjna'].subjects || []), 'Economy', 'Biology', 'Chemistry', 'Static GK / Current Affairs']).filter(x => !['History','Polity','Geography'].includes(x));

    syncFacultySubjectsToMaster();

    const containers = [];
    (state.templates || []).forEach(x => containers.push(x));
    (state.plans || []).forEach(x => containers.push(x));
    if (typeof draft !== 'undefined' && draft) containers.push(draft);
    containers.forEach(container => {
      if (container.planType) container.planType = canonical(container.planType);
      (container.modules || []).forEach(m => {
        m.subjectName = canonical(m.subjectName);
        m.facultyIds = idsForSubject(m.subjectName, m.facultyIds);
      });
      if (Array.isArray(container.selectedFacultyIds)) container.selectedFacultyIds = unique((container.modules || []).flatMap(m => m.facultyIds || []));
    });
    (state.plans || []).forEach(p => (p.sessions || []).forEach(s => {
      s.subjectName = canonical(s.subjectName);
      s.facultyIds = idsForSubject(s.subjectName, s.facultyIds);
    }));
  }

  function deletePlan(planId) {
    const plan = (state.plans || []).find(p => p.id === planId);
    if (!plan) return toastSafe('Study plan not found');
    if (!confirm('Delete this study plan permanently?\n\n' + (plan.batchName || plan.examName || 'Unnamed Study Plan'))) return;
    state.plans = (state.plans || []).filter(p => p.id !== planId);
    persistNow();
    if (location.hash.includes('/plans/' + planId)) location.hash = '#/plans';
    render();
    toastSafe('Study plan deleted');
  }
  window.examonDeleteStudyPlan = deletePlan;

  function installCss() {
    if (document.querySelector('style[data-examon-final-patch]')) return;
    const style = document.createElement('style');
    style.setAttribute('data-examon-final-patch', 'true');
    style.textContent = '.brand img,.top-actions img,.print-logo-inline{object-fit:contain!important}.dash-visible-actions{display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap;position:relative;z-index:5}.dash-visible-actions a,.dash-visible-actions button{border:0;border-radius:10px;padding:7px 12px;font-weight:800;cursor:pointer;text-decoration:none;font-size:13px}.dash-visible-actions a{background:#e6fbff;color:#006775}.dash-visible-actions button{background:#fff1f2;color:#b4232d;border:1px solid #ffb3b8}.delete-plan-main{background:#fff1f2!important;color:#b4232d!important;border:1px solid #ffb3b8!important}.print-page{position:relative!important;overflow:hidden!important}.print-page:after{content:""!important;position:absolute!important;inset:0!important;background:url("assets/examon-logo.webp") center center/min(62%,520px) auto no-repeat!important;opacity:.15!important;z-index:9999!important;pointer-events:none!important;mix-blend-mode:multiply!important}.print-page>*{position:relative!important;z-index:1!important}.print-area .module-card-top span,.print-area .module-page-count,.print-area .structure-list div:last-child,.print-area .module-summary th:nth-child(5),.print-area .module-summary td:nth-child(5){display:none!important}.cloud-status-pill{position:fixed;right:18px;bottom:18px;z-index:9999;border-radius:999px;padding:9px 13px;font:700 12px Arial,sans-serif;box-shadow:0 8px 24px rgba(6,32,51,.15);background:#e6fbff;color:#006775;border:1px solid #b7edf5}.cloud-status-pill.error{background:#fff1f2;color:#b4232d;border-color:#ffb3b8}@media print{.print-page:after{opacity:.15!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}';
    document.head.appendChild(style);
  }

  function injectDeleteButtons() {
    installCss();
    document.querySelectorAll('a[href^="#/plans/"]').forEach(link => {
      const match = link.getAttribute('href').match(/#\/plans\/([^"'?#]+)/);
      if (!match) return;
      const planId = decodeURIComponent(match[1]);
      if (!(state.plans || []).some(p => p.id === planId)) return;
      const holder = link.parentElement || link.closest('td');
      if (!holder || holder.querySelector('[data-delete-visible="' + CSS.escape(planId) + '"]')) return;
      const actions = document.createElement('div');
      actions.className = 'dash-visible-actions';
      actions.setAttribute('data-delete-visible', planId);
      actions.innerHTML = '<a href="#/plans/' + planId + '">Open</a><button type="button" data-delete-plan="' + planId + '">Delete</button>';
      holder.appendChild(actions);
    });
    const detail = location.hash.match(/^#\/plans\/([^\s?#]+)/);
    if (detail) {
      const planId = decodeURIComponent(detail[1]);
      const top = document.querySelector('.top-actions');
      if (top && !top.querySelector('[data-delete-plan="' + CSS.escape(planId) + '"]')) {
        const btn = document.createElement('button');
        btn.className = 'btn small delete-plan-main';
        btn.type = 'button';
        btn.dataset.deletePlan = planId;
        btn.textContent = 'Delete Plan';
        top.insertBefore(btn, top.firstChild);
      }
    }
  }

  function installHandlers() {
    document.addEventListener('click', ev => {
      const btn = ev.target.closest && ev.target.closest('[data-delete-plan]');
      if (btn) { ev.preventDefault(); ev.stopPropagation(); deletePlan(btn.dataset.deletePlan); return; }
      const text = (ev.target && ev.target.textContent || '').trim().toLowerCase();
      if (text === 'save' || text.includes('save settings')) {
        setTimeout(() => { applyMappingsEverywhere(); persistNow(); render(); toastSafe('Saved and synced'); }, 100);
      }
    }, true);
  }

  function installSaveHook() {
    try {
      if (window.__examonSaveHookInstalled) return;
      window.__examonSaveHookInstalled = true;
      const originalSave = save;
      save = function () { applyMappingsEverywhere(); const result = originalSave.apply(this, arguments); try { if (typeof window.examonCloudSyncNow === 'function') window.examonCloudSyncNow(); } catch (_) {} return result; };
    } catch (_) {}
  }

  function installRenderHook() {
    if (window.__examonRenderHookInstalled) return;
    window.__examonRenderHookInstalled = true;
    const originalRender = render;
    render = function () { applyMappingsEverywhere(); const result = originalRender.apply(this, arguments); setTimeout(injectDeleteButtons, 0); return result; };
    window.render = render;
  }

  function installCloudStatus() {
    function update() {
      const status = window.EXAMON_CLOUD_STATUS || {};
      let el = document.querySelector('.cloud-status-pill');
      if (!el) { el = document.createElement('div'); el.className = 'cloud-status-pill'; document.body.appendChild(el); }
      const s = status.status || 'local';
      el.classList.toggle('error', s === 'error' || s === 'local');
      el.textContent = s === 'cloud' ? 'Saved to Cloud' : s === 'syncing' ? 'Syncing...' : s === 'error' ? 'Cloud Sync Error' : 'Local Only';
      el.title = status.detail || '';
    }
    update();
    window.addEventListener('examon-cloud-status', update);
    setInterval(update, 3000);
  }

  try {
    installCss();
    applyMappingsEverywhere();
    installSaveHook();
    installRenderHook();
    installHandlers();
    installCloudStatus();
    persistNow();
  } catch (e) { console.error('Runtime patch failed', e); }
}

async function waitForCloudReady() {
  if (!window.EXAMON_CLOUD_READY_PROMISE) return;
  try {
    await Promise.race([
      window.EXAMON_CLOUD_READY_PROMISE,
      new Promise(resolve => setTimeout(resolve, 1500))
    ]);
  } catch (_) {}
}

(async () => {
  try {
    setTimeout(() => {
      const app = document.getElementById('app');
      if (app && /Loading Examon Academic Planner/.test(app.textContent || '')) {
        app.innerHTML = '<div style="font-family:Arial,sans-serif;max-width:760px;margin:60px auto;padding:24px;border:1px solid #ddd;border-radius:16px;background:white"><h2>Still loading...</h2><p>Refreshing the application runtime. Please wait a few seconds or press Ctrl + Shift + R.</p></div>';
      }
    }, 6000);

    await waitForCloudReady();

    const cssParts = await Promise.all(['chunks/styles-1.txt','chunks/styles-2.txt','chunks/styles-3.txt'].map(loadText));
    const style = document.createElement('style');
    style.textContent = cssParts.join('');
    document.head.appendChild(style);

    const jsParts = await Promise.all(['chunks/app-1.txt','chunks/app-2.txt','chunks/app-3.txt'].map(loadText));
    const runtime = ';\n(' + examonRuntimePatch.toString() + ')();\nif (typeof render === "function") { render(); }';
    (0, eval)(jsParts.join('') + runtime);
  } catch (error) {
    console.error(error);
    const app = document.getElementById('app');
    if (app) app.innerHTML = `<div style="font-family:Arial,sans-serif;max-width:760px;margin:60px auto;padding:24px;border:1px solid #ddd;border-radius:16px;background:white"><h2>Unable to load Examon Academic Planner</h2><p>${String(error.message || error)}</p><p>Please redeploy the latest main branch and hard-refresh once.</p></div>`;
  }
})();
