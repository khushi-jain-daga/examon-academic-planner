/* Safe Create page patch: selecting faculty loads every linked subject, across all branches.
   It does not replace the main app. It only augments draft modules and visible subject cards. */
(function () {
  var STORE_KEY = 'examonAcademicPlannerV1';
  var installed = false;

  function onCreatePage() {
    return String(location.hash || '').indexOf('/create') !== -1;
  }
  function uniq(arr) {
    var out = [];
    (arr || []).forEach(function (x) { if (x && out.indexOf(x) === -1) out.push(x); });
    return out;
  }
  function norm(v) {
    return String(v || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function html(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (m) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];
    });
  }
  function toastMsg(msg) {
    try { if (typeof toast === 'function') { toast(msg); return; } } catch (_) {}
    var el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = 'position:fixed;right:18px;bottom:72px;z-index:100000;background:#062033;color:white;padding:12px 16px;border-radius:12px;font:800 14px Arial,sans-serif;box-shadow:0 12px 30px rgba(0,0,0,.22)';
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 2200);
  }
  function saveState() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (_) {}
    try { if (typeof window.examonCloudSyncNow === 'function') window.examonCloudSyncNow(); } catch (_) {}
  }
  function facultyName(id) {
    var f = (state.faculty || []).find(function (x) { return x.id === id; });
    return f ? f.name : id;
  }
  function facultyNames(ids) {
    return uniq(ids).map(facultyName).join(' & ');
  }
  function subjectFacultyIds(subject) {
    return uniq(subject && subject.facultyIds ? subject.facultyIds : []);
  }
  function subjectLinkedToFaculty(subject, facultyId) {
    if (!subject || subject.active === false) return false;
    if (subjectFacultyIds(subject).indexOf(facultyId) !== -1) return true;
    var f = (state.faculty || []).find(function (x) { return x.id === facultyId; });
    if (!f) return false;
    var names = Array.isArray(f.subjects) ? f.subjects : String(f.subjects || '').split(',');
    return names.some(function (name) { return norm(name) === norm(subject.name); });
  }
  function selectedFacultyIds() {
    if (typeof draft === 'undefined' || !draft) return [];
    draft.selectedFacultyIds = uniq(draft.selectedFacultyIds || []);
    return draft.selectedFacultyIds;
  }
  function subjectsForSelectedFaculty() {
    if (typeof state === 'undefined' || !state || !Array.isArray(state.subjects)) return [];
    var ids = selectedFacultyIds();
    if (!ids.length) return [];
    return (state.subjects || []).filter(function (subject) {
      return ids.some(function (fid) { return subjectLinkedToFaculty(subject, fid); });
    });
  }
  function nextPriority(track) {
    var max = 0;
    (draft.modules || []).forEach(function (m) {
      if ((m.track || 'Track A') === track) max = Math.max(max, Number(m.priority || 0));
    });
    return max + 1;
  }
  function addModuleForSubject(subject, silent) {
    if (typeof draft === 'undefined' || !draft || !subject) return false;
    draft.modules = draft.modules || [];
    var exists = draft.modules.some(function (m) {
      return m.subjectId === subject.id || norm(m.subjectName) === norm(subject.name);
    });
    if (exists) return false;
    var selected = selectedFacultyIds();
    var ids = subjectFacultyIds(subject).filter(function (id) { return selected.indexOf(id) !== -1; });
    if (!ids.length) ids = subjectFacultyIds(subject);
    var track = 'Track A';
    draft.modules.push({
      id: (typeof uid === 'function') ? uid('mod') : ('mod-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)),
      subjectId: subject.id,
      subjectName: subject.name,
      category: subject.category || (subject.technical ? 'Technical Theory' : 'Non-Technical Theory'),
      facultyIds: uniq(ids),
      classes: 10,
      priority: nextPriority(track),
      track: track,
      startMode: 'auto',
      customStart: '',
      startTime: '',
      duration: subject.duration || 60,
      workingDays: [1, 2, 3, 4, 5],
      weekendOverride: false
    });
    if (!silent) toastMsg(subject.name + ' added');
    return true;
  }
  function removeModuleForSubject(subjectId) {
    if (typeof draft === 'undefined' || !draft) return;
    draft.modules = (draft.modules || []).filter(function (m) { return m.subjectId !== subjectId; });
    saveState();
    try { if (typeof render === 'function') render(); } catch (_) {}
  }
  function autoAddAllSelectedFacultySubjects() {
    if (!onCreatePage() || typeof draft === 'undefined' || !draft) return 0;
    var list = subjectsForSelectedFaculty();
    var count = 0;
    list.forEach(function (subject) { if (addModuleForSubject(subject, true)) count++; });
    if (count) {
      draft.selectedFacultyIds = uniq((draft.selectedFacultyIds || []).concat((draft.modules || []).flatMap(function (m) { return m.facultyIds || []; })));
      saveState();
    }
    return count;
  }
  function subjectCard(subject) {
    var selected = (draft.modules || []).some(function (m) { return m.subjectId === subject.id || norm(m.subjectName) === norm(subject.name); });
    var selectedF = selectedFacultyIds();
    var fids = subjectFacultyIds(subject).filter(function (id) { return !selectedF.length || selectedF.indexOf(id) !== -1; });
    if (!fids.length) fids = subjectFacultyIds(subject);
    return '<label class="subject-card all-faculty-subject ' + (selected ? 'selected' : '') + '" data-branch="' + html(subject.branch || '') + '" data-safe-added="1">' +
      '<input type="checkbox" data-subid="' + html(subject.id) + '" ' + (selected ? 'checked' : '') + '>' +
      '<strong>' + html(subject.name) + '</strong>' +
      '<div class="small-muted">' + html(subject.branch || '') + ' · ' + html(subject.category || '') + '</div>' +
      '<div class="subject-faculty">' + html(facultyNames(fids)) + '</div>' +
      '</label>';
  }
  function showAllLinkedSubjectCards() {
    if (!onCreatePage() || typeof draft === 'undefined' || !draft) return;
    var grid = document.querySelector('#subject-grid');
    if (!grid) return;
    var existingIds = Array.from(grid.querySelectorAll('input[data-subid]')).map(function (i) { return i.getAttribute('data-subid'); });
    var htmlToAdd = '';
    subjectsForSelectedFaculty().forEach(function (subject) {
      if (existingIds.indexOf(subject.id) === -1) htmlToAdd += subjectCard(subject);
    });
    if (htmlToAdd) grid.insertAdjacentHTML('beforeend', htmlToAdd);
  }
  function afterRender() {
    setTimeout(function () {
      if (!onCreatePage()) return;
      showAllLinkedSubjectCards();
    }, 0);
  }
  function installRenderPatch() {
    if (installed || typeof render !== 'function') return;
    installed = true;
    var oldRender = render;
    render = function () {
      var result = oldRender.apply(this, arguments);
      afterRender();
      return result;
    };
    window.render = render;
  }

  document.addEventListener('click', function (ev) {
    if (!onCreatePage()) return;
    var card = ev.target.closest && ev.target.closest('.faculty-select-card');
    if (!card) return;
    setTimeout(function () {
      var added = autoAddAllSelectedFacultySubjects();
      if (added && typeof render === 'function') {
        render();
        toastMsg(added + ' subject(s) loaded from selected faculty');
      } else {
        showAllLinkedSubjectCards();
      }
    }, 120);
  }, true);

  document.addEventListener('change', function (ev) {
    if (!onCreatePage()) return;
    var input = ev.target && ev.target.closest && ev.target.closest('#subject-grid input[data-subid]');
    if (!input) return;
    var id = input.getAttribute('data-subid');
    var subject = (state.subjects || []).find(function (s) { return s.id === id; });
    if (!subject) return;
    if (input.checked) {
      addModuleForSubject(subject, true);
      saveState();
      if (typeof render === 'function') render();
    } else {
      removeModuleForSubject(id);
    }
  }, true);

  setInterval(function () {
    installRenderPatch();
    if (onCreatePage()) showAllLinkedSubjectCards();
  }, 500);
})();