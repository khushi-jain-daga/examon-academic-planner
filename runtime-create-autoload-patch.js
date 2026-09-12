/* Runtime code patch loaded before loader.js.
   Purpose: Create page must show/load every subject associated with selected faculty,
   across Mechanical/Civil/Non-Tech, without editing fragile bundled chunks. */
(function () {
  if (window.__EXAMON_RUNTIME_CREATE_AUTOLOAD_PATCH__) return;
  window.__EXAMON_RUNTIME_CREATE_AUTOLOAD_PATCH__ = true;

  var nativeEval = window.eval;

  function patchAppCode(code) {
    if (typeof code !== 'string' || code.indexOf('function examonRuntimePatch()') === -1) return code;

    // 1) Main Create page originally blocked subjects by branch. Remove that branch restriction.
    code = code.replace(
      "const eligibleSubjects=state.subjects.filter(s=>s.active && (s.branch===draft.branch || s.branch==='Non-Tech') && (!selectedFacultySet.size || (s.facultyIds||[]).some(fid=>selectedFacultySet.has(fid))));",
      "const eligibleSubjects=state.subjects.filter(s=>s.active && (!selectedFacultySet.size || (s.facultyIds||[]).some(fid=>selectedFacultySet.has(fid))));"
    );

    // 2) Add helper inside examonRuntimePatch so it can access lexical state/draft/uid.
    var helper = `

  function subjectLinkedToFaculty(subject, facultyId) {
    if (!subject || subject.active === false) return false;
    if ((subject.facultyIds || []).includes(facultyId)) return true;
    const faculty = (state.faculty || []).find(f => f.id === facultyId);
    if (!faculty) return false;
    const subjectNames = Array.isArray(faculty.subjects) ? faculty.subjects : splitList(faculty.subjects);
    return subjectNames.some(name => normalize(canonical(name)) === normalize(canonical(subject.name)));
  }

  function nextDraftPriority(track) {
    let max = 0;
    (draft.modules || []).forEach(m => {
      if ((m.track || 'Track A') === track) max = Math.max(max, Number(m.priority || 0));
    });
    return max + 1;
  }

  function addAllSelectedFacultySubjectsToDraft(force = false) {
    if (!String(location.hash || '').includes('/create')) return 0;
    if (typeof draft === 'undefined' || !draft || !Array.isArray(state.subjects)) return 0;
    draft.selectedFacultyIds = unique(draft.selectedFacultyIds || []);
    const selectedIds = draft.selectedFacultyIds;
    if (!selectedIds.length) return 0;

    const signature = selectedIds.slice().sort().join('|') + '::' + (state.subjects || []).map(s => s.id + ':' + (s.facultyIds || []).join(',')).join('|');
    if (!force && draft.__facultySubjectAutoloadSignature === signature) return 0;

    draft.modules = draft.modules || [];
    let added = 0;
    (state.subjects || []).forEach(subject => {
      if (!subject || subject.active === false) return;
      if (!selectedIds.some(fid => subjectLinkedToFaculty(subject, fid))) return;
      const exists = draft.modules.some(m => m.subjectId === subject.id || normalize(m.subjectName) === normalize(subject.name));
      if (exists) return;
      const facultyIds = unique((subject.facultyIds || []).filter(fid => selectedIds.includes(fid)));
      const finalFacultyIds = facultyIds.length ? facultyIds : idsForSubject(subject.name, subject.facultyIds || []);
      const track = subject.branch === 'Civil' ? 'Track C' : subject.branch === 'Mechanical' ? 'Track A' : 'Track B';
      draft.modules.push({
        id: (typeof uid === 'function' ? uid('mod') : 'mod-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)),
        subjectId: subject.id,
        subjectName: canonical(subject.name),
        category: subject.category || (subject.technical ? 'Technical Theory' : 'Non-Technical Theory'),
        facultyIds: unique(finalFacultyIds),
        classes: 10,
        priority: nextDraftPriority(track),
        track,
        startMode: 'auto',
        customStart: '',
        startTime: '',
        duration: subject.duration || 60,
        workingDays: [1, 2, 3, 4, 5],
        weekendOverride: false
      });
      added++;
    });
    draft.__facultySubjectAutoloadSignature = signature;
    if (added) persistNow();
    return added;
  }
`;

    if (code.indexOf('function addAllSelectedFacultySubjectsToDraft(') === -1) {
      code = code.replace('  function installRenderHook() {', helper + '\n  function installRenderHook() {');
    }

    // 3) Auto-load once before rendering Create page, and again when faculty cards are clicked.
    code = code.replace(
      "render = function () { applyMappingsEverywhere(); const result = originalRender.apply(this, arguments); setTimeout(injectDeleteButtons, 0); return result; };",
      "render = function () { applyMappingsEverywhere(); try { addAllSelectedFacultySubjectsToDraft(false); } catch (_) {} const result = originalRender.apply(this, arguments); setTimeout(injectDeleteButtons, 0); return result; };"
    );

    code = code.replace(
      "normalizeDraftFaculty();\n      persistNow();\n      render();\n      toastSafe('Faculty updated. Imported subjects kept.');",
      "const added = addAllSelectedFacultySubjectsToDraft(true);\n      normalizeDraftFaculty();\n      persistNow();\n      render();\n      toastSafe(added ? (added + ' subject(s) loaded from selected faculty') : 'Faculty updated. Imported subjects kept.');"
    );

    return code;
  }

  window.eval = function (code) {
    return nativeEval.call(this, patchAppCode(code));
  };
})();
