/* Fix imported-batch faculty selection: adding faculty must not remove/freeze imported modules. */
(function () {
  const STORAGE_KEY = 'examonAcademicPlannerV1';

  function arr(x) { return Array.isArray(x) ? x : []; }
  function uniq(x) { return [...new Set(arr(x).filter(Boolean))]; }
  function toastSafe(message) {
    try { if (typeof toast === 'function') return toast(message); } catch (_) {}
    try {
      const el = document.createElement('div');
      el.textContent = message;
      el.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:99999;background:#062033;color:white;padding:12px 16px;border-radius:12px;font:700 14px Arial,sans-serif;box-shadow:0 12px 32px rgba(0,0,0,.22)';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2200);
    } catch (_) {}
  }
  function getSubject(id) {
    try { return arr(state.subjects).find(s => s.id === id); } catch (_) { return null; }
  }
  function moduleFacultyIds(module) {
    const subject = getSubject(module && module.subjectId);
    if (subject && subject.facultyIds && subject.facultyIds.length) return uniq(subject.facultyIds);
    return uniq(module && module.facultyIds);
  }
  function persist() {
    try { if (typeof save === 'function') save(); else localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
    try { if (typeof window.examonCloudSyncNow === 'function') window.examonCloudSyncNow(); } catch (_) {}
  }
  function normalizeDraftFaculty() {
    try {
      if (typeof draft === 'undefined' || !draft) return;
      draft.modules = arr(draft.modules);
      draft.selectedFacultyIds = uniq([...(draft.selectedFacultyIds || []), ...draft.modules.flatMap(m => moduleFacultyIds(m))]);
      draft.modules.forEach(m => { m.facultyIds = moduleFacultyIds(m); });
    } catch (e) { console.warn('normalizeDraftFaculty failed', e); }
  }

  function patchSyncDraft() {
    try {
      if (window.__examonImportFacultySyncPatched || typeof syncDraft !== 'function') return;
      window.__examonImportFacultySyncPatched = true;
      const original = syncDraft;
      syncDraft = function () {
        const result = original.apply(this, arguments);
        normalizeDraftFaculty();
        return result;
      };
    } catch (_) {}
  }

  function patchAddSubject() {
    try {
      if (window.__examonAddSubjectPatched || typeof addSubjectToDraft !== 'function') return;
      window.__examonAddSubjectPatched = true;
      addSubjectToDraft = function (id) {
        if (typeof draft === 'undefined' || !draft) return;
        const s = getSubject(id);
        if (!s || arr(draft.modules).some(m => m.subjectId === id)) return;
        draft.modules.push({
          id: typeof uid === 'function' ? uid('mod') : ('mod-' + Date.now()),
          subjectId: s.id,
          subjectName: s.name,
          category: s.category,
          facultyIds: uniq(s.facultyIds),
          classes: 10,
          priority: 1,
          track: 'Track A',
          startMode: 'auto',
          customStart: '',
          startTime: '',
          duration: s.duration || 60,
          workingDays: [1, 2, 3, 4, 5],
          weekendOverride: false
        });
        normalizeDraftFaculty();
      };
    } catch (_) {}
  }

  function patchRender() {
    try {
      if (window.__examonImportFacultyRenderPatched || typeof render !== 'function') return;
      window.__examonImportFacultyRenderPatched = true;
      const original = render;
      render = function () {
        if (String(location.hash || '').includes('/create')) normalizeDraftFaculty();
        const result = original.apply(this, arguments);
        setTimeout(() => {
          patchSyncDraft();
          patchAddSubject();
        }, 0);
        return result;
      };
      window.render = render;
    } catch (_) {}
  }

  document.addEventListener('click', function (event) {
    const facultyCard = event.target && event.target.closest && event.target.closest('.faculty-select-card');
    if (facultyCard && String(location.hash || '').includes('/create')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      try {
        if (typeof syncDraft === 'function') syncDraft();
        if (typeof draft === 'undefined' || !draft) return;
        const id = facultyCard.dataset.fid;
        draft.selectedFacultyIds = uniq(draft.selectedFacultyIds);
        if (draft.selectedFacultyIds.includes(id)) {
          draft.selectedFacultyIds = draft.selectedFacultyIds.filter(x => x !== id);
          // Do not delete imported modules. If a visible module belongs to this faculty, keep its association through Subject Master.
        } else {
          draft.selectedFacultyIds.push(id);
        }
        normalizeDraftFaculty();
        if (typeof render === 'function') render();
        toastSafe('Faculty selection updated. Imported subjects kept.');
      } catch (e) { console.error('Faculty selection fix failed', e); }
      return;
    }

    const importButton = event.target && event.target.closest && event.target.closest('#rolling-import');
    if (importButton && String(location.hash || '').includes('/create')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      try {
        if (typeof syncDraft === 'function') syncDraft();
        if (typeof draft === 'undefined' || !draft) return;
        const previousFaculty = uniq(draft.selectedFacultyIds);
        const id = document.querySelector('#rolling-source') && document.querySelector('#rolling-source').value;
        if (!id) { toastSafe('Choose a previous study plan'); return; }
        const src = arr(state.plans).find(p => p.id === id);
        if (!src || typeof importRollingPlan !== 'function') return;
        draft = importRollingPlan(src, draft.startDate);
        draft.batchName = '';
        draft.selectedFacultyIds = uniq([...previousFaculty, ...arr(draft.selectedFacultyIds), ...arr(draft.modules).flatMap(m => moduleFacultyIds(m))]);
        normalizeDraftFaculty();
        persist();
        if (typeof render === 'function') render();
        toastSafe('Previous batch imported. You can add more faculty/subjects now.');
      } catch (e) { console.error('Rolling import fix failed', e); }
      return;
    }
  }, true);

  const boot = setInterval(() => {
    patchSyncDraft();
    patchAddSubject();
    patchRender();
    if (typeof render === 'function') clearInterval(boot);
  }, 250);
  setTimeout(() => clearInterval(boot), 8000);
})();
