/* Subject page: replace broken multi-select with real faculty checkboxes and save mapping reliably. */
(function () {
  const STORAGE_KEY = 'examonAcademicPlannerV1';

  function readState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch (_) { return {}; }
  }
  function writeState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    try { if (typeof window.examonCloudSyncNow === 'function') window.examonCloudSyncNow(); } catch (_) {}
  }
  function norm(v) {
    return String(v || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function toast(message) {
    const old = document.querySelector('[data-subject-checkbox-toast]');
    if (old) old.remove();
    const el = document.createElement('div');
    el.dataset.subjectCheckboxToast = '1';
    el.textContent = message;
    el.style.cssText = 'position:fixed;right:18px;bottom:72px;z-index:100000;background:#062033;color:white;padding:12px 16px;border-radius:12px;font:800 14px Arial,sans-serif;box-shadow:0 12px 30px rgba(0,0,0,.22)';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }
  function facultyLabel(f) { return f && (f.name || f.title || f.id); }
  function facultyIdFromOptionText(state, text) {
    const wanted = norm(text);
    const f = (state.faculty || []).find(x => norm(facultyLabel(x)) === wanted || norm(x.id) === wanted);
    return f && f.id;
  }
  function subjectByName(state, name) {
    const wanted = norm(name);
    return (state.subjects || []).find(s => norm(s.name) === wanted);
  }
  function selectedIdsForSubject(state, subjectName, select) {
    const subject = subjectByName(state, subjectName);
    const ids = new Set((subject && subject.facultyIds) || []);
    Array.from(select.selectedOptions || []).forEach(opt => {
      const id = opt.value || facultyIdFromOptionText(state, opt.textContent);
      if (id) ids.add(id);
    });
    return ids;
  }
  function findEditModal() {
    const headings = Array.from(document.querySelectorAll('h1,h2,h3,.modal-title'));
    const heading = headings.find(h => /edit subject/i.test(h.textContent || ''));
    if (!heading) return null;
    return heading.closest('.modal,.dialog,.card,section,div') || heading.parentElement;
  }
  function findSubjectName(modal) {
    const inputs = Array.from(modal.querySelectorAll('input'));
    const input = inputs.find(i => i.value && i.type !== 'hidden');
    return input ? input.value.trim() : '';
  }
  function findFacultySelect(modal) {
    const selects = Array.from(modal.querySelectorAll('select'));
    return selects.find(s => s.size > 1 || s.multiple || Array.from(s.options || []).some(o => /sir|ma.am|ma’am|mam/i.test(o.textContent || '')));
  }
  function setSelectFromChecks(box, select) {
    const checkedIds = new Set(Array.from(box.querySelectorAll('input[type="checkbox"]:checked')).map(i => i.value));
    Array.from(select.options || []).forEach(opt => {
      const state = readState();
      const id = opt.value || facultyIdFromOptionText(state, opt.textContent);
      opt.selected = checkedIds.has(id);
    });
  }
  function installCheckboxes() {
    if (!/#\/subjects/.test(location.hash || '')) return;
    const modal = findEditModal();
    if (!modal || modal.dataset.subjectFacultyCheckboxReady === '1') return;
    const select = findFacultySelect(modal);
    const subjectName = findSubjectName(modal);
    if (!select || !subjectName) return;

    const state = readState();
    const faculty = (state.faculty || []).filter(f => f && f.id && facultyLabel(f));
    if (!faculty.length) return;
    const selectedIds = selectedIdsForSubject(state, subjectName, select);

    select.style.display = 'none';
    select.setAttribute('aria-hidden', 'true');

    const box = document.createElement('div');
    box.className = 'subject-faculty-checkbox-box';
    box.innerHTML = faculty.map(f => {
      const checked = selectedIds.has(f.id) ? 'checked' : '';
      const label = facultyLabel(f);
      const sub = Array.isArray(f.domains) ? f.domains.join(', ') : (f.domains || '');
      return `<label class="subject-faculty-check"><input type="checkbox" value="${String(f.id).replace(/"/g, '&quot;')}" ${checked}> <span><b>${String(label).replace(/</g,'&lt;')}</b>${sub ? `<small>${String(sub).replace(/</g,'&lt;')}</small>` : ''}</span></label>`;
    }).join('');
    select.parentElement.insertBefore(box, select.nextSibling);
    box.addEventListener('change', () => setSelectFromChecks(box, select));
    setSelectFromChecks(box, select);
    modal.dataset.subjectFacultyCheckboxReady = '1';
  }
  function saveSubjectFromCheckboxes(modal) {
    const box = modal.querySelector('.subject-faculty-checkbox-box');
    const select = findFacultySelect(modal);
    const subjectName = findSubjectName(modal);
    if (!box || !subjectName) return false;
    if (select) setSelectFromChecks(box, select);

    const state = readState();
    const selected = Array.from(box.querySelectorAll('input[type="checkbox"]:checked')).map(i => i.value);
    let subject = subjectByName(state, subjectName);
    if (!subject) {
      subject = { id: 's-' + norm(subjectName).replace(/\s+/g, '-'), name: subjectName, branch: 'Non-Tech', technical: false, category: 'Non-Technical Theory', facultyIds: [], duration: 60, active: true };
      state.subjects = state.subjects || [];
      state.subjects.push(subject);
    }
    subject.facultyIds = selected;

    // Keep faculty master in sync: add/remove this subject name from faculty subject lists.
    (state.faculty || []).forEach(f => {
      const list = Array.isArray(f.subjects) ? f.subjects.slice() : String(f.subjects || '').split(',').map(x => x.trim()).filter(Boolean);
      const without = list.filter(x => norm(x) !== norm(subjectName));
      f.subjects = selected.includes(f.id) ? [...without, subject.name] : without;
    });

    // Reflect updated faculty in all templates, saved plans, and sessions.
    const updateModule = m => { if (m && norm(m.subjectName || m.name) === norm(subject.name)) m.facultyIds = selected.slice(); };
    (state.templates || []).forEach(t => (t.modules || []).forEach(updateModule));
    (state.plans || []).forEach(p => {
      (p.modules || []).forEach(updateModule);
      (p.sessions || []).forEach(s => { if (norm(s.subjectName) === norm(subject.name)) s.facultyIds = selected.slice(); });
      p.selectedFacultyIds = Array.from(new Set((p.modules || []).flatMap(m => m.facultyIds || [])));
    });

    writeState(state);
    toast('Subject faculty saved');
    setTimeout(() => location.reload(), 350);
    return true;
  }

  document.addEventListener('click', function (ev) {
    if (!/#\/subjects/.test(location.hash || '')) return;
    const btn = ev.target && ev.target.closest && ev.target.closest('button');
    if (!btn) return;
    const text = (btn.textContent || '').trim().toLowerCase();
    if (text !== 'save') return;
    const modal = findEditModal();
    if (!modal || !modal.querySelector('.subject-faculty-checkbox-box')) return;
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    saveSubjectFromCheckboxes(modal);
  }, true);

  const style = document.createElement('style');
  style.textContent = `.subject-faculty-checkbox-box{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:8px;max-height:230px;overflow:auto;border:1px solid #bfe4eb;border-radius:14px;padding:12px;background:#f8fdff}.subject-faculty-check{display:flex;gap:10px;align-items:flex-start;border:1px solid #d8e8ee;border-radius:12px;padding:10px 12px;background:#fff;cursor:pointer;font:500 14px Arial,sans-serif}.subject-faculty-check input{width:18px;height:18px;accent-color:#12c4c9;margin-top:2px}.subject-faculty-check b{display:block;color:#062033;font-size:15px}.subject-faculty-check small{display:block;color:#60758a;margin-top:3px;font-size:12px}@media(max-width:900px){.subject-faculty-checkbox-box{grid-template-columns:1fr}}`;
  document.head.appendChild(style);

  const observer = new MutationObserver(installCheckboxes);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setInterval(installCheckboxes, 500);
  installCheckboxes();
})();
