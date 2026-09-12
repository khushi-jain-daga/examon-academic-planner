/* Create page faculty/add-subject flow fix.
   Purpose: after importing an existing batch, selecting a new faculty should not remove/freeze modules.
   Faculty is still assigned from Subject Master, and selected faculty controls which extra subjects appear. */
(function () {
  function onCreateRoute() {
    return String(location.hash || '').replace(/^#\/?/, '').split('/')[0] === 'create';
  }

  function uniq(arr) {
    return Array.from(new Set((arr || []).filter(Boolean)));
  }

  function subjectForModule(module) {
    try {
      return (window.state && Array.isArray(window.state.subjects))
        ? window.state.subjects.find(s => s.id === module.subjectId || String(s.name).toLowerCase() === String(module.subjectName).toLowerCase())
        : null;
    } catch (_) {
      return null;
    }
  }

  function refreshModuleFacultyFromSubjects() {
    try {
      if (!window.draft || !Array.isArray(window.draft.modules)) return;
      const selected = new Set(window.draft.selectedFacultyIds || []);
      window.draft.modules.forEach(module => {
        const subject = subjectForModule(module);
        if (!subject || !Array.isArray(subject.facultyIds)) return;
        const mapped = subject.facultyIds.filter(fid => !selected.size || selected.has(fid));
        module.facultyIds = mapped.length ? mapped : uniq(module.facultyIds && module.facultyIds.length ? module.facultyIds : subject.facultyIds);
      });
    } catch (err) {
      console.warn('Could not refresh module faculty', err);
    }
  }

  function saveDraftSnapshot() {
    try { if (typeof window.syncDraft === 'function') window.syncDraft(); } catch (_) {}
    try { if (typeof window.save === 'function') window.save(); } catch (_) {}
    try { if (typeof window.examonCloudSyncNow === 'function') window.examonCloudSyncNow(); } catch (_) {}
  }

  document.addEventListener('click', function (event) {
    const card = event.target && event.target.closest ? event.target.closest('.faculty-select-card') : null;
    if (!card || !onCreateRoute()) return;

    // Stop the original handler because it removed imported modules while changing faculty.
    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();

    try {
      if (typeof window.syncDraft === 'function') window.syncDraft();
      if (!window.draft) return;
      if (!Array.isArray(window.draft.selectedFacultyIds)) window.draft.selectedFacultyIds = [];
      const id = card.dataset.fid;
      if (!id) return;
      if (window.draft.selectedFacultyIds.includes(id)) {
        window.draft.selectedFacultyIds = window.draft.selectedFacultyIds.filter(x => x !== id);
      } else {
        window.draft.selectedFacultyIds.push(id);
      }
      window.draft.selectedFacultyIds = uniq(window.draft.selectedFacultyIds);

      // Important: do NOT remove existing imported modules here.
      // Only refresh their faculty association from Subject Master.
      refreshModuleFacultyFromSubjects();
      saveDraftSnapshot();
      if (typeof window.render === 'function') window.render();
    } catch (err) {
      console.error('Faculty selection fix failed', err);
      alert('Faculty selection could not be updated. Please refresh once and try again.');
    }
  }, true);

  document.addEventListener('change', function (event) {
    const subjectCheckbox = event.target && event.target.matches ? event.target.matches('[data-subid]') : false;
    if (!subjectCheckbox || !onCreateRoute()) return;
    setTimeout(function () {
      try {
        refreshModuleFacultyFromSubjects();
        saveDraftSnapshot();
      } catch (_) {}
    }, 0);
  }, true);

  window.examonCreateFlowFixInstalled = true;
})();
