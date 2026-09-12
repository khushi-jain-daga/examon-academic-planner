/* Final fix: rolling import must work, and adding faculty after import must not freeze/remove modules. */
(function () {
  const STORAGE_KEY = 'examonAcademicPlannerV1';
  const DEFAULT_DAYS = [1, 2, 3, 4, 5];

  function arr(x) { return Array.isArray(x) ? x : []; }
  function uniq(x) { return [...new Set(arr(x).filter(Boolean))]; }
  function norm(x) { return String(x || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim(); }
  function idForSubject(name) { return 's-' + norm(name).replace(/\s+/g, '-'); }
  function newId(prefix) {
    try { if (typeof uid === 'function') return uid(prefix); } catch (_) {}
    return prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  }
  function clone(x) {
    try { if (typeof deep === 'function') return deep(x); } catch (_) {}
    return JSON.parse(JSON.stringify(x));
  }
  function todayIso() {
    try { if (typeof iso === 'function') return iso(new Date()); } catch (_) {}
    return new Date().toISOString().slice(0, 10);
  }
  function toastSafe(message) {
    try { if (typeof toast === 'function') return toast(message); } catch (_) {}
    const el = document.createElement('div');
    el.textContent = message;
    el.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:999999;background:#062033;color:white;padding:12px 16px;border-radius:12px;font:700 14px Arial,sans-serif;box-shadow:0 12px 32px rgba(0,0,0,.22)';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2400);
  }
  function getState() {
    try { return state; } catch (_) { return null; }
  }
  function getDraft() {
    try { return draft; } catch (_) { return null; }
  }
  function setDraft(value) {
    try { draft = value; return true; } catch (_) { return false; }
  }
  function renderSafe() {
    try { if (typeof render === 'function') render(); } catch (e) { console.error(e); }
  }
  function persist() {
    const st = getState();
    try { if (typeof save === 'function') save(); else if (st) localStorage.setItem(STORAGE_KEY, JSON.stringify(st)); } catch (_) {}
    try { if (typeof window.examonCloudSyncNow === 'function') window.examonCloudSyncNow(); } catch (_) {}
  }
  function getSubjectById(id) {
    const st = getState();
    return st ? arr(st.subjects).find(s => s.id === id) : null;
  }
  function getSubjectByName(name) {
    const st = getState();
    return st ? arr(st.subjects).find(s => norm(s.name) === norm(name)) : null;
  }
  function ensureSubject(name, facultyId) {
    const st = getState();
    if (!st || !name) return null;
    st.subjects = arr(st.subjects);
    let sub = getSubjectByName(name);
    if (!sub) {
      const f = arr(st.faculty).find(x => x.id === facultyId) || {};
      const domains = arr(f.domains);
      const branch = domains.some(d => norm(d).includes('civil')) ? 'Civil' : domains.some(d => norm(d).includes('mechanical') || norm(d).includes('automobile')) ? 'Mechanical' : 'Non-Tech';
      const technical = branch !== 'Non-Tech';
      sub = {
        id: idForSubject(name),
        name,
        branch,
        technical,
        category: technical ? 'Technical Theory' : 'Non-Technical Theory',
        facultyIds: [],
        duration: 60,
        active: true
      };
      st.subjects.push(sub);
    }
    if (facultyId && !arr(sub.facultyIds).includes(facultyId)) sub.facultyIds = uniq([...(sub.facultyIds || []), facultyId]);
    sub.active = true;
    return sub;
  }
  function syncFacultySubjectsIntoMaster() {
    const st = getState();
    if (!st) return;
    arr(st.faculty).forEach(f => {
      arr(f.subjects).forEach(subjectName => ensureSubject(subjectName, f.id));
    });
  }
  function facultyIdsForModule(module) {
    const sub = getSubjectById(module && module.subjectId) || getSubjectByName(module && module.subjectName);
    if (sub && arr(sub.facultyIds).length) return uniq(sub.facultyIds);
    return uniq(module && module.facultyIds);
  }
  function normalizeDraft(keepExtraFaculty) {
    const d = getDraft();
    if (!d) return;
    d.modules = arr(d.modules);
    d.selectedFacultyIds = uniq([...(keepExtraFaculty || []), ...(d.selectedFacultyIds || [])]);
    d.modules.forEach(m => {
      const ids = facultyIdsForModule(m);
      if (ids.length) m.facultyIds = ids;
    });
    d.selectedFacultyIds = uniq([...d.selectedFacultyIds, ...d.modules.flatMap(m => arr(m.facultyIds))]);
  }
  function createBlankDraft() {
    try { if (typeof blankDraft === 'function') return blankDraft(); } catch (_) {}
    return { id: newId('plan'), examName: '', batchName: '', branch: 'Mechanical', planType: 'Foundation', contentFlags: [], selectedFacultyIds: [], startDate: todayIso(), examDate: '', workingDays: DEFAULT_DAYS.slice(), status: 'Draft', version: 1, modules: [], sessions: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  }
  function getModuleWindow(source, moduleId) {
    const dates = arr(source.sessions).filter(s => s.moduleId === moduleId).map(s => s.date).filter(Boolean).sort();
    return { start: dates[0] || '', end: dates[dates.length - 1] || '' };
  }
  function makeRollingDraft(source, newStart, previousFaculty) {
    const d = createBlankDraft();
    d.examName = source.examName || '';
    d.batchName = '';
    d.branch = source.branch || 'Mechanical';
    d.planType = source.planType || 'Foundation';
    d.contentFlags = arr(source.contentFlags).slice();
    d.startDate = newStart || todayIso();
    d.sessions = [];
    d.modules = [];

    const grouped = {};
    arr(source.modules).forEach(m => (grouped[m.track || 'Track A'] ||= []).push(m));
    Object.entries(grouped).forEach(([track, modules]) => {
      const live = [];
      const completed = [];
      modules.forEach(oldModule => {
        const m = clone(oldModule);
        m.id = newId('mod');
        m.customStart = '';
        m.startMode = 'auto';
        m.weekendOverride = false;
        m.workingDays = arr(m.workingDays).length ? arr(m.workingDays) : DEFAULT_DAYS.slice();
        m.facultyIds = facultyIdsForModule(m);
        const w = getModuleWindow(source, oldModule.id);
        if (w.end && w.end < d.startDate) completed.push(m); else live.push(m);
      });
      [...live, ...completed].forEach((m, index) => {
        m.priority = index + 1;
        m.track = track;
        d.modules.push(m);
      });
    });
    d.selectedFacultyIds = uniq([...(previousFaculty || []), ...d.modules.flatMap(m => arr(m.facultyIds))]);
    return d;
  }
  function importSelectedBatch() {
    const st = getState();
    if (!st) return toastSafe('App data not ready. Refresh once.');
    syncFacultySubjectsIntoMaster();
    const select = document.querySelector('#rolling-source');
    const id = select && select.value;
    if (!id) return toastSafe('Choose a previous study plan');
    const src = arr(st.plans).find(p => p.id === id);
    if (!src) return toastSafe('Selected study plan not found');

    const current = getDraft() || createBlankDraft();
    const previousFaculty = uniq(current.selectedFacultyIds || []);
    const startDate = document.querySelector('#c-start')?.value || current.startDate || todayIso();
    const imported = makeRollingDraft(src, startDate, previousFaculty);
    setDraft(imported);
    persist();
    renderSafe();
    toastSafe('Batch imported. You can now add more faculty and subjects.');
  }
  function toggleFaculty(card) {
    syncFacultySubjectsIntoMaster();
    const d = getDraft();
    if (!d) return;
    try { if (typeof syncDraft === 'function') syncDraft(); } catch (_) {}
    const id = card.dataset.fid;
    d.selectedFacultyIds = uniq(d.selectedFacultyIds || []);
    if (d.selectedFacultyIds.includes(id)) {
      const usedByModules = arr(d.modules).some(m => arr(facultyIdsForModule(m)).includes(id));
      if (usedByModules) {
        toastSafe('Faculty is used in selected subjects. Remove those subjects first.');
      } else {
        d.selectedFacultyIds = d.selectedFacultyIds.filter(x => x !== id);
      }
    } else {
      d.selectedFacultyIds.push(id);
      const f = arr(getState().faculty).find(x => x.id === id);
      arr(f && f.subjects).forEach(name => ensureSubject(name, id));
      toastSafe('Faculty added. Their subjects are available below.');
    }
    normalizeDraft();
    persist();
    renderSafe();
  }
  function patchAddSubject() {
    try {
      if (window.__examonFinalAddSubjectPatch || typeof addSubjectToDraft !== 'function') return;
      window.__examonFinalAddSubjectPatch = true;
      addSubjectToDraft = function (id) {
        const d = getDraft();
        if (!d) return;
        syncFacultySubjectsIntoMaster();
        const s = getSubjectById(id);
        if (!s || arr(d.modules).some(m => m.subjectId === id)) return;
        d.modules.push({ id: newId('mod'), subjectId: s.id, subjectName: s.name, category: s.category, facultyIds: uniq(s.facultyIds), classes: 10, priority: 1, track: 'Track A', startMode: 'auto', customStart: '', startTime: '', duration: s.duration || 60, workingDays: DEFAULT_DAYS.slice(), weekendOverride: false });
        normalizeDraft();
      };
    } catch (_) {}
  }
  function patchSyncDraft() {
    try {
      if (window.__examonFinalSyncDraftPatch || typeof syncDraft !== 'function') return;
      window.__examonFinalSyncDraftPatch = true;
      const original = syncDraft;
      syncDraft = function () {
        const result = original.apply(this, arguments);
        syncFacultySubjectsIntoMaster();
        normalizeDraft();
        return result;
      };
    } catch (_) {}
  }
  function patchRender() {
    try {
      if (window.__examonFinalRenderPatch || typeof render !== 'function') return;
      window.__examonFinalRenderPatch = true;
      const original = render;
      render = function () {
        if (String(location.hash || '').includes('/create')) syncFacultySubjectsIntoMaster();
        const result = original.apply(this, arguments);
        setTimeout(() => { patchSyncDraft(); patchAddSubject(); }, 0);
        return result;
      };
      window.render = render;
    } catch (_) {}
  }

  document.addEventListener('click', function (event) {
    const importButton = event.target && event.target.closest && event.target.closest('#rolling-import');
    if (importButton && String(location.hash || '').includes('/create')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      importSelectedBatch();
      return;
    }
    const facultyCard = event.target && event.target.closest && event.target.closest('.faculty-select-card');
    if (facultyCard && String(location.hash || '').includes('/create')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      toggleFaculty(facultyCard);
      return;
    }
  }, true);

  const boot = setInterval(() => {
    patchSyncDraft();
    patchAddSubject();
    patchRender();
    if (typeof render === 'function') clearInterval(boot);
  }, 200);
  setTimeout(() => clearInterval(boot), 10000);
})();
