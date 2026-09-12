/* Persist Subject -> Faculty mapping reliably from the Subjects modal.
   This fixes the case where the visual multi-select selection was saved, but
   the creator later rebuilt mappings from Faculty Master and lost it. */
(function () {
  const STORAGE_KEYS = ['examonAcademicPlannerV1', 'examon-planner-v1'];
  const normalize = v => String(v || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();
  const unique = arr => [...new Set((arr || []).filter(Boolean))];

  const mandatory = {
    'reasoning': ['shivam'],
    'physics': ['joshit'],
    'history': ['amrit'],
    'polity': ['amrit'],
    'geography': ['amrit'],
    'economy': ['anjna'],
    'biology': ['anjna'],
    'chemistry': ['anjna'],
    'static gk current affairs': ['anjna'],
    'current affairs': ['anjna']
  };

  function toast(message) {
    try {
      const el = document.createElement('div');
      el.textContent = message;
      el.style.cssText = 'position:fixed;right:18px;bottom:76px;z-index:999999;background:#062033;color:#fff;padding:12px 16px;border-radius:12px;font:700 14px Arial,sans-serif;box-shadow:0 12px 32px rgba(0,0,0,.22)';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2600);
    } catch (_) {}
  }

  function readStore() {
    for (const key of STORAGE_KEYS) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const data = JSON.parse(raw);
        if (data && Array.isArray(data.subjects) && Array.isArray(data.faculty)) return { key, data };
      } catch (_) {}
    }
    return null;
  }

  function writeStore(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
    try { if (typeof window.examonCloudSyncNow === 'function') window.examonCloudSyncNow(); } catch (_) {}
  }

  function facultyIdsFromSelect(select, data) {
    const chosenTexts = Array.from(select ? select.selectedOptions : []).map(o => normalize(o.textContent));
    const chosenValues = Array.from(select ? select.selectedOptions : []).map(o => o.value).filter(Boolean);
    const ids = [];
    (data.faculty || []).forEach(f => {
      if (chosenValues.includes(f.id) || chosenTexts.some(t => normalize(f.name) === t)) ids.push(f.id);
    });
    return unique(ids);
  }

  function facultyIdsForMandatory(subjectName, data) {
    const key = normalize(subjectName);
    const needles = mandatory[key] || null;
    if (!needles) return null;
    return unique((data.faculty || []).filter(f => needles.some(n => normalize(f.name).includes(n))).map(f => f.id));
  }

  function syncSubjectIntoFacultyLists(data, subjectName, selectedIds) {
    const subjectNorm = normalize(subjectName);
    (data.faculty || []).forEach(f => {
      f.subjects = Array.isArray(f.subjects) ? f.subjects : String(f.subjects || '').split(',').map(x => x.trim()).filter(Boolean);
      const has = f.subjects.some(s => normalize(s) === subjectNorm);
      if (selectedIds.includes(f.id) && !has) f.subjects.push(subjectName);
      if (!selectedIds.includes(f.id) && has) f.subjects = f.subjects.filter(s => normalize(s) !== subjectNorm);
      f.subjects = unique(f.subjects);
    });
  }

  function updateExistingPlans(data, subjectName, selectedIds) {
    const subjectNorm = normalize(subjectName);
    (data.plans || []).forEach(plan => {
      (plan.modules || []).forEach(m => {
        if (normalize(m.subjectName) === subjectNorm || normalize(m.name) === subjectNorm) m.facultyIds = unique(selectedIds);
      });
      (plan.sessions || []).forEach(s => {
        if (normalize(s.subjectName) === subjectNorm || normalize(s.name) === subjectNorm) s.facultyIds = unique(selectedIds);
      });
    });
    (data.templates || []).forEach(t => (t.modules || []).forEach(m => {
      if (normalize(m.subjectName) === subjectNorm || normalize(m.name) === subjectNorm) m.facultyIds = unique(selectedIds);
    }));
  }

  function persistSubjectSelectionFromModal(modal) {
    const store = readStore();
    if (!store || !modal) return false;
    const data = store.data;
    const name = modal.querySelector('#sm-name')?.value?.trim();
    const select = modal.querySelector('#sm-fac');
    if (!name || !select) return false;

    let selectedIds = facultyIdsFromSelect(select, data);
    const required = facultyIdsForMandatory(name, data);
    if (required && required.length) selectedIds = required;

    const subjectNorm = normalize(name);
    let subject = (data.subjects || []).find(s => normalize(s.name) === subjectNorm);
    if (!subject) {
      subject = { id: 's-' + subjectNorm.replace(/\s+/g, '-'), name, branch: 'Non-Tech', technical: false, category: 'Non-Technical Theory', facultyIds: [], duration: 60, active: true };
      data.subjects = data.subjects || [];
      data.subjects.push(subject);
    }
    subject.name = name;
    subject.branch = modal.querySelector('#sm-branch')?.value || subject.branch || 'Non-Tech';
    subject.category = modal.querySelector('#sm-cat')?.value || subject.category || 'Non-Technical Theory';
    subject.technical = String(subject.category || '').startsWith('Technical');
    subject.duration = Number(modal.querySelector('#sm-duration')?.value || subject.duration || 60);
    subject.facultyIds = unique(selectedIds);

    syncSubjectIntoFacultyLists(data, subject.name, selectedIds);
    updateExistingPlans(data, subject.name, selectedIds);
    writeStore(store.key, data);
    return true;
  }

  function repaintModalSelections() {
    const modal = document.querySelector('.modal');
    const select = modal && modal.querySelector('#sm-fac');
    const name = modal && modal.querySelector('#sm-name')?.value?.trim();
    if (!modal || !select || !name) return;
    const store = readStore();
    if (!store) return;
    const data = store.data;
    const subject = (data.subjects || []).find(s => normalize(s.name) === normalize(name));
    let ids = subject && Array.isArray(subject.facultyIds) ? subject.facultyIds : [];
    const required = facultyIdsForMandatory(name, data);
    if (required && required.length) ids = required;
    Array.from(select.options).forEach(opt => {
      const f = (data.faculty || []).find(x => x.id === opt.value || normalize(x.name) === normalize(opt.textContent));
      opt.selected = !!f && ids.includes(f.id);
    });
  }

  document.addEventListener('click', function (ev) {
    const saveBtn = ev.target && ev.target.closest && ev.target.closest('#sm-save');
    if (saveBtn) {
      const modal = saveBtn.closest('.modal');
      // Capture while modal still exists, then write again after original app save runs.
      setTimeout(() => {
        const ok = persistSubjectSelectionFromModal(modal);
        if (ok) {
          toast('Subject faculty saved. Reloading creator data...');
          setTimeout(() => location.reload(), 500);
        }
      }, 120);
    }
  }, true);

  const observer = new MutationObserver(() => setTimeout(repaintModalSelections, 50));
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setInterval(repaintModalSelections, 1500);
})();
