/* Stable Create-page runtime patch.
   Keeps the last working app baseline and fixes only the requested items:
   1) selected faculty loads its subjects,
   2) subject deselect/remove really removes scheduler row and does not auto-return,
   3) per-plan faculty can be changed with checkboxes,
   4) rolling import copies modules + sessions + dates + time + faculty. */
(function () {
  if (window.__EXAMON_RUNTIME_CREATE_AUTOLOAD_PATCH_V3__) return;
  window.__EXAMON_RUNTIME_CREATE_AUTOLOAD_PATCH_V3__ = true;

  var nativeEval = window.eval;

  function patchAppCode(code) {
    if (typeof code !== 'string' || code.indexOf('function examonRuntimePatch()') === -1) return code;

    // Show every active subject connected with selected faculty. Do not block by branch.
    code = code.replace(
      "const eligibleSubjects=state.subjects.filter(s=>s.active && (s.branch===draft.branch || s.branch==='Non-Tech') && (!selectedFacultySet.size || (s.facultyIds||[]).some(fid=>selectedFacultySet.has(fid))));",
      "const eligibleSubjects=state.subjects.filter(s=>s.active && (!selectedFacultySet.size || (s.facultyIds||[]).some(fid=>selectedFacultySet.has(fid))));"
    );

    // Rolling import must copy the complete previous plan, not rebuild blank modules.
    var oldImport = "function importRollingPlan(source,newStart){\n  const d=blankDraft();\n  d.examName=source.examName; d.branch=source.branch; d.planType=source.planType; d.contentFlags=[...(source.contentFlags||[])];\n  d.startDate=newStart||iso(new Date()); d.selectedFacultyIds=[...new Set(source.modules.flatMap(m=>m.facultyIds||[]))];\n  const grouped={};\n  source.modules.forEach(m=>(grouped[m.track||'Track A']??=[]).push(m));\n  d.modules=[];\n  Object.entries(grouped).forEach(([track,mods])=>{\n    const live=[],completed=[];\n    mods.forEach(m=>{\n      const w=moduleWindow(source,m.id);\n      const c={...deep(m),id:uid('mod'),customStart:'',startMode:'auto',weekendOverride:false};\n      if(w.end && w.end<d.startDate) completed.push(c); else live.push(c);\n    });\n    const ordered=[...live,...completed];\n    ordered.forEach((m,i)=>{m.priority=i+1;m.track=track;d.modules.push(m)});\n  });\n  return d;\n}";
    var newImport = "function importRollingPlan(source,newStart){\n  const d=blankDraft();\n  const firstSessionDate=(source.sessions||[]).map(s=>s.date).sort()[0]||source.startDate||newStart||iso(new Date());\n  d.examName=source.examName||'';\n  d.batchName=(source.batchName||'')+' Copy';\n  d.branch=source.branch||'Mechanical';\n  d.planType=source.planType||'Foundation';\n  d.contentFlags=[...(source.contentFlags||[])];\n  d.startDate=source.startDate||firstSessionDate;\n  d.targetEndDate=source.targetEndDate||'';\n  d.examDate=source.examDate||'';\n  d.defaultDuration=source.defaultDuration||60;\n  d.workingDays=[...(source.workingDays||DEFAULT_DAYS)];\n  d.status='Draft';\n  d.version=1;\n  d.theme=source.theme||d.theme;\n  d.__removedSubjectIds=[];\n  const idMap={};\n  d.modules=(source.modules||[]).map(m=>{\n    const oldId=m.id; const newId=uid('mod'); idMap[oldId]=newId;\n    const w=moduleWindow(source,oldId);\n    return {...deep(m),id:newId,startMode:'custom',customStart:w.start||m.customStart||d.startDate,workingDays:[...(m.workingDays||DEFAULT_DAYS)],weekendOverride:!!m.weekendOverride};\n  });\n  d.sessions=(source.sessions||[]).map(s=>({...deep(s),id:uid('ses'),moduleId:idMap[s.moduleId]||s.moduleId,locked:false}));\n  d.selectedFacultyIds=[...new Set(d.modules.flatMap(m=>m.facultyIds||[]))];\n  d.createdAt=new Date().toISOString();\n  d.updatedAt=new Date().toISOString();\n  return d;\n}";
    if (code.indexOf(oldImport) !== -1) code = code.replace(oldImport, newImport);
    code = code.replace(
      "draft=importRollingPlan(src,draft.startDate);draft.batchName='';toast('Previous batch imported. Completed subjects moved to the end.');render()",
      "draft=importRollingPlan(src,draft.startDate);toast('Previous batch imported with all modules, classes, dates, times and faculty.');render()"
    );
    code = code.replace(
      "draft=importRollingPlan(src,start);draft.batchName=prompt('New batch name',src.batchName.replace(/(1\\.0|2\\.0|3\\.0)/,'2.0')+' - New')||src.batchName+' - New';toast('Rolling batch prepared. Completed subjects moved to the end.');go('create')",
      "draft=importRollingPlan(src,start);draft.batchName=prompt('New batch name',draft.batchName)||draft.batchName;toast('Rolling batch copied with all classes, dates, times and faculty.');go('create')"
    );

    var helper = `

  function subjectLinkedToFaculty(subject, facultyId) {
    if (!subject || subject.active === false) return false;
    if ((subject.facultyIds || []).includes(facultyId)) return true;
    const faculty = (state.faculty || []).find(f => f.id === facultyId);
    if (!faculty) return false;
    const subjectNames = Array.isArray(faculty.subjects) ? faculty.subjects : splitList(faculty.subjects);
    return subjectNames.some(name => normalize(canonical(name)) === normalize(canonical(subject.name)));
  }

  function removedSubjectSet() {
    if (typeof draft === 'undefined' || !draft) return new Set();
    draft.__removedSubjectIds = unique(draft.__removedSubjectIds || []);
    return new Set(draft.__removedSubjectIds);
  }

  function markSubjectRemoved(subjectId, subjectName) {
    if (typeof draft === 'undefined' || !draft) return;
    draft.__removedSubjectIds = unique([...(draft.__removedSubjectIds || []), subjectId, subjectName ? 'name:' + normalize(subjectName) : ''].filter(Boolean));
  }

  function unmarkSubjectRemoved(subjectId, subjectName) {
    if (typeof draft === 'undefined' || !draft) return;
    const banned = new Set([subjectId, subjectName ? 'name:' + normalize(subjectName) : ''].filter(Boolean));
    draft.__removedSubjectIds = (draft.__removedSubjectIds || []).filter(x => !banned.has(x));
  }

  function nextDraftPriority(track) {
    let max = 0;
    (draft.modules || []).forEach(m => {
      if ((m.track || 'Track A') === track) max = Math.max(max, Number(m.priority || 0));
    });
    return max + 1;
  }

  function buildModuleFromSubject(subject) {
    const selectedIds = unique(draft.selectedFacultyIds || []);
    const facultyIds = unique((subject.facultyIds || []).filter(fid => !selectedIds.length || selectedIds.includes(fid)));
    const finalFacultyIds = facultyIds.length ? facultyIds : idsForSubject(subject.name, subject.facultyIds || []);
    const track = subject.defaultTrack || (subject.branch === 'Civil' ? 'Track C' : subject.branch === 'Mechanical' ? 'Track A' : 'Track B');
    return {
      id: (typeof uid === 'function' ? uid('mod') : 'mod-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)),
      subjectId: subject.id,
      subjectName: canonical(subject.name),
      category: subject.defaultCategory || subject.category || (subject.technical ? 'Technical Theory' : 'Non-Technical Theory'),
      facultyIds: unique(finalFacultyIds),
      classes: Number(subject.defaultClasses || 10),
      priority: nextDraftPriority(track),
      track,
      startMode: subject.defaultStart ? 'custom' : 'auto',
      customStart: subject.defaultStart || '',
      startTime: subject.defaultTime || '',
      duration: Number(subject.duration || 60),
      workingDays: subject.defaultWorkingDays || [1, 2, 3, 4, 5],
      weekendOverride: !!subject.defaultWeekendOverride
    };
  }

  function addOneSubjectToDraftSafe(subjectId) {
    if (typeof draft === 'undefined' || !draft) return 0;
    const subject = (state.subjects || []).find(s => s.id === subjectId);
    if (!subject) return 0;
    unmarkSubjectRemoved(subject.id, subject.name);
    draft.modules = draft.modules || [];
    const exists = draft.modules.some(m => m.subjectId === subject.id);
    if (exists) return 0;
    draft.modules.push(buildModuleFromSubject(subject));
    draft.selectedFacultyIds = unique([...(draft.selectedFacultyIds || []), ...((draft.modules[draft.modules.length-1] || {}).facultyIds || [])]);
    return 1;
  }

  function addAllSelectedFacultySubjectsToDraft(force = false) {
    if (!String(location.hash || '').includes('/create')) return 0;
    if (typeof draft === 'undefined' || !draft || !Array.isArray(state.subjects)) return 0;
    draft.selectedFacultyIds = unique(draft.selectedFacultyIds || []);
    const selectedIds = draft.selectedFacultyIds;
    if (!selectedIds.length) return 0;
    const removed = removedSubjectSet();
    const signature = selectedIds.slice().sort().join('|') + '::' + (state.subjects || []).map(s => s.id + ':' + (s.facultyIds || []).join(',')).join('|') + '::removed=' + [...removed].sort().join('|');
    if (!force && draft.__facultySubjectAutoloadSignature === signature) return 0;
    draft.modules = draft.modules || [];
    let added = 0;
    (state.subjects || []).forEach(subject => {
      if (!subject || subject.active === false) return;
      if (removed.has(subject.id) || removed.has('name:' + normalize(subject.name))) return;
      if (!selectedIds.some(fid => subjectLinkedToFaculty(subject, fid))) return;
      const exists = draft.modules.some(m => m.subjectId === subject.id || normalize(m.subjectName) === normalize(subject.name));
      if (exists) return;
      draft.modules.push(buildModuleFromSubject(subject));
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

    // Auto-load, but respect removed/deselected subjects.
    code = code.replace(
      "render = function () { applyMappingsEverywhere(); const result = originalRender.apply(this, arguments); setTimeout(injectDeleteButtons, 0); return result; };",
      "render = function () { applyMappingsEverywhere(); try { addAllSelectedFacultySubjectsToDraft(false); } catch (_) {} const result = originalRender.apply(this, arguments); setTimeout(injectDeleteButtons, 0); return result; };"
    );

    // Faculty click: load subjects from that faculty, but don't remove already imported modules.
    code = code.replace(
      "normalizeDraftFaculty();\n      persistNow();\n      render();\n      toastSafe('Faculty updated. Imported subjects kept.');",
      "const added = addAllSelectedFacultySubjectsToDraft(true);\n      normalizeDraftFaculty();\n      persistNow();\n      render();\n      toastSafe(added ? (added + ' subject(s) loaded from selected faculty') : 'Faculty updated. Imported subjects kept.');"
    );

    // Subject card untick must remove scheduler row and remember it should not auto-return.
    code = code.replace(
      "$$('[data-subid]').forEach(x=>x.addEventListener('change',()=>{syncDraft();if(x.checked)addSubjectToDraft(x.dataset.subid);else draft.modules=draft.modules.filter(m=>m.subjectId!==x.dataset.subid);render()}));",
      "$$('[data-subid]').forEach(x=>x.addEventListener('change',()=>{syncDraft();const sid=x.dataset.subid;const subject=(state.subjects||[]).find(s=>s.id===sid);if(x.checked){unmarkSubjectRemoved(sid,subject&&subject.name);addOneSubjectToDraftSafe(sid)}else{markSubjectRemoved(sid,subject&&subject.name);draft.modules=(draft.modules||[]).filter(m=>m.subjectId!==sid && (!subject || normalize(m.subjectName)!==normalize(subject.name)))}persistNow();render()}));"
    );

    // Remove button must do the same as untick.
    code = code.replace(
      "$$('.del-module').forEach(b=>b.addEventListener('click',()=>{syncDraft();draft.modules.splice(+b.dataset.i,1);render()}));",
      "$$('.del-module').forEach(b=>b.addEventListener('click',()=>{syncDraft();const idx=Number(b.dataset.i);const removed=(draft.modules||[])[idx];if(removed)markSubjectRemoved(removed.subjectId,removed.subjectName);draft.modules=(draft.modules||[]).filter((_,i)=>i!==idx);persistNow();render();toast('Subject removed from scheduler')}));"
    );

    // Add per-study-plan faculty checkboxes inside Subject Priority & Time.
    code = code.replace(
      '<div class="assigned-faculty"><span>Assigned faculty</span><b>${esc(facultyNames(m.facultyIds))}</b></div>',
      '<div class="assigned-faculty"><span>Assigned faculty</span><b>${esc(facultyNames(m.facultyIds))}</b></div><div class="module-faculty-picker"><span>Change faculty for this study plan only</span><div class="module-faculty-checks">${state.faculty.filter(f=>f.active).map(f=>`<label class="mini-check"><input type="checkbox" class="m-faculty-check" value="${f.id}" ${(m.facultyIds||[]).includes(f.id)?\'checked\':\'\'}><em>${esc(f.name)}</em></label>`).join(\'\')}</div></div>'
    );

    // syncDraft must keep chosen per-plan faculty instead of resetting from Subject Master.
    code = code.replace(
      "if(sub){const mapped=(sub.facultyIds||[]).filter(fid=>!selected.size||selected.has(fid));m.facultyIds=mapped.length?mapped:[...(sub.facultyIds||[])]}m.category=$('.m-cat',el).value;",
      "const picked=$$('.m-faculty-check:checked',el).map(c=>c.value);if(picked.length){m.facultyIds=picked}else if(sub){const mapped=(sub.facultyIds||[]).filter(fid=>!selected.size||selected.has(fid));m.facultyIds=mapped.length?mapped:[...(sub.facultyIds||[])]}m.category=$('.m-cat',el).value;"
    );

    // Styling for per-plan faculty checkboxes.
    code = code.replace(
      "function currentRoute(){const h=location.hash.replace(/^#\\/?/,'');return h||'dashboard'}",
      "function currentRoute(){const h=location.hash.replace(/^#\\/?/,'');return h||'dashboard'}\n(function(){if(document.getElementById('per-plan-faculty-css'))return;const st=document.createElement('style');st.id='per-plan-faculty-css';st.textContent='.module-faculty-picker{margin-top:10px;padding:10px;border:1px solid var(--line);border-radius:12px;background:#f4fbfb}.module-faculty-picker>span{display:block;font-size:12px;color:var(--muted);margin-bottom:8px}.module-faculty-checks{display:flex;flex-wrap:wrap;gap:8px}.mini-check{display:inline-flex;align-items:center;gap:6px;padding:7px 10px;border:1px solid var(--line);border-radius:999px;background:#fff;cursor:pointer;font-size:12px}.mini-check input{width:14px;height:14px;accent-color:#18c6c8}.mini-check em{font-style:normal;font-weight:700;color:#11324b}';document.head.appendChild(st)})();"
    );

    return code;
  }

  window.eval = function (code) {
    return nativeEval.call(this, patchAppCode(code));
  };
})();
