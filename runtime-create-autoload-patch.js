/* Stable Create-page runtime patch V4.
   No automatic scheduler loading from faculty. Faculty only filters subject cards.
   Scheduler rows exist only when a subject is checked/imported. */
(function () {
  if (window.__EXAMON_CREATE_PATCH_V4__) return;
  window.__EXAMON_CREATE_PATCH_V4__ = true;

  var nativeEval = window.eval;

  function patchAppCode(code) {
    if (typeof code !== 'string' || code.indexOf('function examonRuntimePatch()') === -1) return code;

    // Show all active subjects linked to selected faculty. Do not block by branch.
    code = code.replace(
      "const eligibleSubjects=state.subjects.filter(s=>s.active && (s.branch===draft.branch || s.branch==='Non-Tech') && (!selectedFacultySet.size || (s.facultyIds||[]).some(fid=>selectedFacultySet.has(fid))));",
      "const eligibleSubjects=state.subjects.filter(s=>s.active && (!selectedFacultySet.size || (s.facultyIds||[]).some(fid=>selectedFacultySet.has(fid))));"
    );

    // Preserve per-study-plan faculty. Do not reset module faculty from Subject Master every render.
    code = code.replace(
      "function refreshModuleFaculty(container) {\n    (container.modules || []).forEach(m => {\n      m.subjectName = canonical(m.subjectName);\n      m.facultyIds = idsForModule(m);\n    });\n  }",
      "function refreshModuleFaculty(container) {\n    (container.modules || []).forEach(m => {\n      m.subjectName = canonical(m.subjectName);\n      if (!m.facultyIds || !m.facultyIds.length) m.facultyIds = idsForModule(m);\n      else m.facultyIds = unique(m.facultyIds);\n    });\n  }"
    );
    code = code.replace(
      "s.facultyIds = idsForSubject(s.subjectName, s.facultyIds);",
      "s.facultyIds = (s.facultyIds && s.facultyIds.length) ? unique(s.facultyIds) : idsForSubject(s.subjectName, s.facultyIds);"
    );

    // Import existing batch as exact editable copy: modules + sessions + dates + times + faculty.
    var oldImport = "function importRollingPlan(source,newStart){\n  const d=blankDraft();\n  d.examName=source.examName; d.branch=source.branch; d.planType=source.planType; d.contentFlags=[...(source.contentFlags||[])];\n  d.startDate=newStart||iso(new Date()); d.selectedFacultyIds=[...new Set(source.modules.flatMap(m=>m.facultyIds||[]))];\n  const grouped={};\n  source.modules.forEach(m=>(grouped[m.track||'Track A']??=[]).push(m));\n  d.modules=[];\n  Object.entries(grouped).forEach(([track,mods])=>{\n    const live=[],completed=[];\n    mods.forEach(m=>{\n      const w=moduleWindow(source,m.id);\n      const c={...deep(m),id:uid('mod'),customStart:'',startMode:'auto',weekendOverride:false};\n      if(w.end && w.end<d.startDate) completed.push(c); else live.push(c);\n    });\n    const ordered=[...live,...completed];\n    ordered.forEach((m,i)=>{m.priority=i+1;m.track=track;d.modules.push(m)});\n  });\n  return d;\n}";
    var newImport = "function importRollingPlan(source,newStart){\n  const d=blankDraft();\n  const firstSessionDate=(source.sessions||[]).map(s=>s.date).sort()[0]||source.startDate||newStart||iso(new Date());\n  d.examName=source.examName||'';\n  d.batchName=(source.batchName||'')+' Copy';\n  d.branch=source.branch||'Mechanical';\n  d.planType=source.planType||'Foundation';\n  d.contentFlags=[...(source.contentFlags||[])];\n  d.startDate=source.startDate||firstSessionDate;\n  d.targetEndDate=source.targetEndDate||'';\n  d.examDate=source.examDate||'';\n  d.defaultDuration=source.defaultDuration||60;\n  d.workingDays=[...(source.workingDays||DEFAULT_DAYS)];\n  d.status='Draft';\n  d.version=1;\n  d.theme=source.theme||d.theme;\n  const idMap={};\n  d.modules=(source.modules||[]).map(m=>{\n    const oldId=m.id; const newId=uid('mod'); idMap[oldId]=newId;\n    const w=moduleWindow(source,oldId);\n    return {...deep(m),id:newId,startMode:'custom',customStart:w.start||m.customStart||d.startDate,workingDays:[...(m.workingDays||DEFAULT_DAYS)],weekendOverride:!!m.weekendOverride};\n  });\n  d.sessions=(source.sessions||[]).map(s=>({...deep(s),id:uid('ses'),moduleId:idMap[s.moduleId]||s.moduleId,locked:false}));\n  d.selectedFacultyIds=[...new Set(d.modules.flatMap(m=>m.facultyIds||[]))];\n  d.createdAt=new Date().toISOString();\n  d.updatedAt=new Date().toISOString();\n  return d;\n}";
    if (code.indexOf(oldImport) !== -1) code = code.replace(oldImport, newImport);
    code = code.replace(
      "draft=importRollingPlan(src,draft.startDate);draft.batchName='';toast('Previous batch imported. Completed subjects moved to the end.');render()",
      "draft=importRollingPlan(src,draft.startDate);toast('Previous batch imported with all modules, classes, dates, times and faculty.');render()"
    );
    code = code.replace(
      "draft=importRollingPlan(src,start);draft.batchName=prompt('New batch name',src.batchName.replace(/(1\\.0|2\\.0|3\\.0)/,'2.0')+' - New')||src.batchName+' - New';toast('Rolling batch prepared. Completed subjects moved to the end.');go('create')",
      "draft=importRollingPlan(src,start);draft.batchName=prompt('New batch name',draft.batchName)||draft.batchName;toast('Rolling batch copied with all classes, dates, times and faculty.');go('create')"
    );

    // Select subject -> use default date/time/classes/track from Subject Master if present.
    var oldAddSubject = "function addSubjectToDraft(id){const s=state.subjects.find(x=>x.id===id);if(!s||draft.modules.some(m=>m.subjectId===id))return;const selected=new Set(draft.selectedFacultyIds||[]);let mapped=(s.facultyIds||[]).filter(fid=>!selected.size||selected.has(fid));if(!mapped.length)mapped=[...(s.facultyIds||[])];draft.modules.push({id:uid('mod'),subjectId:s.id,subjectName:s.name,category:s.category,facultyIds:mapped,classes:10,priority:1,track:'Track A',startMode:'auto',customStart:'',startTime:'',duration:s.duration,workingDays:[...DEFAULT_DAYS],weekendOverride:false})}";
    var newAddSubject = "function addSubjectToDraft(id){const s=state.subjects.find(x=>x.id===id);if(!s||draft.modules.some(m=>m.subjectId===id))return;const selected=new Set(draft.selectedFacultyIds||[]);let mapped=(s.facultyIds||[]).filter(fid=>!selected.size||selected.has(fid));if(!mapped.length)mapped=[...(s.facultyIds||[])];const track=s.defaultTrack||'Track A';const start=s.defaultStart||s.startDate||'';draft.modules.push({id:uid('mod'),subjectId:s.id,subjectName:s.name,category:s.defaultCategory||s.category,facultyIds:mapped,classes:Number(s.defaultClasses||s.classes||10),priority:Number(s.defaultPriority||1),track,startMode:start?'custom':'auto',customStart:start,startTime:s.defaultTime||s.startTime||'',duration:Number(s.duration||60),workingDays:[...DEFAULT_DAYS],weekendOverride:false})}";
    if (code.indexOf(oldAddSubject) !== -1) code = code.replace(oldAddSubject, newAddSubject);

    // Untick subject => remove from scheduler. No auto-return.
    code = code.replace(
      "$$('[data-subid]').forEach(x=>x.addEventListener('change',()=>{syncDraft();if(x.checked)addSubjectToDraft(x.dataset.subid);else draft.modules=draft.modules.filter(m=>m.subjectId!==x.dataset.subid);render()}));",
      "$$('[data-subid]').forEach(x=>x.addEventListener('change',()=>{syncDraft();const sid=x.dataset.subid;const sub=(state.subjects||[]).find(s=>s.id===sid);if(x.checked){addSubjectToDraft(sid)}else{draft.modules=(draft.modules||[]).filter(m=>m.subjectId!==sid && (!sub || normalize(m.subjectName)!==normalize(sub.name)))}render()}));"
    );

    // Remove button => remove one scheduler card.
    code = code.replace(
      "$$('.del-module').forEach(b=>b.addEventListener('click',()=>{syncDraft();draft.modules.splice(+b.dataset.i,1);render()}));",
      "$$('.del-module').forEach(b=>b.addEventListener('click',()=>{syncDraft();const idx=Number(b.dataset.i);draft.modules=(draft.modules||[]).filter((_,i)=>i!==idx);render();toast('Subject removed from scheduler')}));"
    );

    // Per-plan faculty checkboxes in scheduler.
    code = code.replace(
      '<div class="assigned-faculty"><span>Assigned faculty</span><b>${esc(facultyNames(m.facultyIds))}</b></div>',
      '<div class="assigned-faculty"><span>Assigned faculty</span><b>${esc(facultyNames(m.facultyIds))}</b></div><div class="module-faculty-picker"><span>Change faculty for this study plan only</span><div class="module-faculty-checks">${state.faculty.filter(f=>f.active).map(f=>`<label class="mini-check"><input type="checkbox" class="m-faculty-check" value="${f.id}" ${(m.facultyIds||[]).includes(f.id)?\'checked\':\'\'}><em>${esc(f.name)}</em></label>`).join(\'\')}</div></div>'
    );
    code = code.replace(
      "if(sub){const mapped=(sub.facultyIds||[]).filter(fid=>!selected.size||selected.has(fid));m.facultyIds=mapped.length?mapped:[...(sub.facultyIds||[])]}m.category=$('.m-cat',el).value;",
      "const picked=$$('.m-faculty-check:checked',el).map(c=>c.value);if(picked.length){m.facultyIds=picked}else if(sub && (!m.facultyIds||!m.facultyIds.length)){const mapped=(sub.facultyIds||[]).filter(fid=>!selected.size||selected.has(fid));m.facultyIds=mapped.length?mapped:[...(sub.facultyIds||[])]}m.category=$('.m-cat',el).value;"
    );

    // Subject Master table columns for defaults.
    code = code.replace("<th>Suggested Faculty</th><th>Duration</th><th></th>","<th>Suggested Faculty</th><th>Start Date</th><th>Time</th><th>Classes</th><th>Track</th><th>Duration</th><th></th>");
    code = code.replace("<td>${facultyNames(s.facultyIds)}</td><td>${s.duration} min</td><td><button class=\"btn small edit-subject\" data-id=\"${s.id}\">Edit</button></td>","<td>${facultyNames(s.facultyIds)}</td><td>${s.defaultStart||'—'}</td><td>${s.defaultTime||'—'}</td><td>${s.defaultClasses||'—'}</td><td>${s.defaultTrack||'Track A'}</td><td>${s.duration} min</td><td><button class=\"btn small edit-subject\" data-id=\"${s.id}\">Edit</button></td>");
    code = code.replace("const x=su?deep(su):{id:uid('s'),name:'',branch:'Mechanical',technical:true,category:'Technical Theory',facultyIds:[],duration:60,active:true};","const x=su?deep(su):{id:uid('s'),name:'',branch:'Mechanical',technical:true,category:'Technical Theory',facultyIds:[],duration:60,active:true,defaultStart:'',defaultTime:'',defaultClasses:10,defaultTrack:'Track A'};x.defaultStart=x.defaultStart||'';x.defaultTime=x.defaultTime||'';x.defaultClasses=x.defaultClasses||10;x.defaultTrack=x.defaultTrack||'Track A';");
    code = code.replace("<div class=\"field span-6\"><label>Duration (min)</label><input id=\"sm-duration\" type=\"number\" value=\"${x.duration}\"></div><div class=\"field span-12\"><label>Suggested Faculty</label>","<div class=\"field span-6\"><label>Duration (min)</label><input id=\"sm-duration\" type=\"number\" value=\"${x.duration}\"></div><div class=\"field span-4\"><label>Start Date</label><input id=\"sm-start\" type=\"date\" value=\"${x.defaultStart||''}\"></div><div class=\"field span-4\"><label>Time</label><input id=\"sm-time\" type=\"time\" value=\"${x.defaultTime||''}\"></div><div class=\"field span-4\"><label>Number of Classes</label><input id=\"sm-classes\" type=\"number\" min=\"1\" value=\"${x.defaultClasses||10}\"></div><div class=\"field span-12\"><label>Track</label><input id=\"sm-track\" value=\"${esc(x.defaultTrack||'Track A')}\"></div><div class=\"field span-12\"><label>Suggested Faculty</label>");
    code = code.replace("x.duration=+$(`#sm-duration`,m).value;x.facultyIds=$$('#sm-fac option:checked',m).map(o=>o.value);","x.duration=+$(`#sm-duration`,m).value;x.defaultStart=$('#sm-start',m)?.value||'';x.defaultTime=$('#sm-time',m)?.value||'';x.defaultClasses=+($('#sm-classes',m)?.value||10);x.defaultTrack=$('#sm-track',m)?.value||'Track A';x.facultyIds=$$('#sm-fac option:checked',m).map(o=>o.value);");

    // CSS for per-plan faculty checkboxes.
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
