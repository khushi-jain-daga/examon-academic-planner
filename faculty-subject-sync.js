// Keeps Faculty subject edits synced with Subject Master, Study Plan Creator, saved plans and sessions.
(function () {
  const STORAGE_KEY = 'examonAcademicPlannerV1';

  const esc = value => String(value || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const normalize = value => String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  const splitList = value => String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);

  const aliases = {
    'bio': 'Biology',
    'chem': 'Chemistry',
    'static gk': 'Static GK / Current Affairs',
    'static g k': 'Static GK / Current Affairs',
    'current affairs': 'Static GK / Current Affairs',
    'static gk current affairs': 'Static GK / Current Affairs'
  };

  const lockedOwners = {
    'reasoning': ['f-shivam'],
    'physics': ['f-joshit'],
    'history': ['f-amrit'],
    'polity': ['f-amrit'],
    'geography': ['f-amrit'],
    'economy': ['f-anjna'],
    'biology': ['f-anjna'],
    'chemistry': ['f-anjna'],
    'static gk current affairs': ['f-anjna']
  };

  function saveAndSync() {
    try {
      if (typeof window.save === 'function') window.save();
      else if (window.state) localStorage.setItem(STORAGE_KEY, JSON.stringify(window.state));
    } catch (_) {}
    try { if (typeof window.examonCloudSyncNow === 'function') window.examonCloudSyncNow(); } catch (_) {}
  }

  function canonicalName(raw) {
    const key = normalize(raw);
    return aliases[key] || raw.trim();
  }

  function inferSubjectMeta(name, faculty) {
    const key = normalize(name);
    const nonTech = ['reasoning','physics','history','polity','geography','economy','biology','chemistry','static gk current affairs'].includes(key);
    const domains = faculty && Array.isArray(faculty.domains) ? faculty.domains.map(normalize) : [];
    const isCivil = domains.includes('civil');
    const isMechanical = domains.includes('mechanical');
    return {
      branch: nonTech ? 'Non-Tech' : (isCivil ? 'Civil' : (isMechanical ? 'Mechanical' : 'Non-Tech')),
      technical: !nonTech && (isCivil || isMechanical),
      category: nonTech ? 'Non-Technical Theory' : 'Technical Theory'
    };
  }

  function buildSubjectFacultyMap() {
    const map = new Map();
    (window.state.faculty || []).forEach(faculty => {
      splitList(Array.isArray(faculty.subjects) ? faculty.subjects.join(',') : faculty.subjects).forEach(raw => {
        const name = canonicalName(raw);
        const key = normalize(name);
        if (!key) return;
        if (!map.has(key)) map.set(key, { name, facultyIds: [], faculty });
        if (!map.get(key).facultyIds.includes(faculty.id)) map.get(key).facultyIds.push(faculty.id);
      });
    });

    Object.entries(lockedOwners).forEach(([key, facultyIds]) => {
      const display = key === 'static gk current affairs' ? 'Static GK / Current Affairs' : key.replace(/\b\w/g, c => c.toUpperCase());
      map.set(key, { name: display, facultyIds: [...facultyIds], faculty: (window.state.faculty || []).find(f => facultyIds.includes(f.id)) });
    });
    return map;
  }

  function applyFacultySubjectSync() {
    if (!window.state || !Array.isArray(window.state.faculty) || !Array.isArray(window.state.subjects)) return false;
    const map = buildSubjectFacultyMap();
    const existing = new Map(window.state.subjects.map(s => [normalize(s.name), s]));
    let changed = false;

    map.forEach((entry, key) => {
      let subject = existing.get(key);
      if (!subject) {
        const meta = inferSubjectMeta(entry.name, entry.faculty);
        subject = {
          id: 's-' + key.replace(/\s+/g, '-'),
          name: entry.name,
          branch: meta.branch,
          technical: meta.technical,
          category: meta.category,
          facultyIds: [],
          duration: 60,
          active: true
        };
        window.state.subjects.push(subject);
        existing.set(key, subject);
        changed = true;
      }
      const newIds = [...new Set(entry.facultyIds)].sort();
      const oldIds = [...new Set(subject.facultyIds || [])].sort();
      if (JSON.stringify(newIds) !== JSON.stringify(oldIds)) {
        subject.facultyIds = newIds;
        changed = true;
      }
      subject.active = true;
    });

    function updateModuleLike(item) {
      if (!item || !item.subjectName) return;
      const key = normalize(canonicalName(item.subjectName));
      const mapped = map.get(key);
      if (!mapped) return;
      const newIds = [...new Set(mapped.facultyIds)].sort();
      const oldIds = [...new Set(item.facultyIds || [])].sort();
      if (JSON.stringify(newIds) !== JSON.stringify(oldIds)) {
        item.facultyIds = newIds;
        changed = true;
      }
    }

    (window.state.templates || []).forEach(t => (t.modules || []).forEach(updateModuleLike));
    (window.state.plans || []).forEach(plan => {
      (plan.modules || []).forEach(updateModuleLike);
      (plan.sessions || []).forEach(updateModuleLike);
    });
    if (window.draft && Array.isArray(window.draft.modules)) {
      window.draft.modules.forEach(updateModuleLike);
      window.draft.selectedFacultyIds = [...new Set(window.draft.modules.flatMap(m => m.facultyIds || []))];
      changed = true;
    }

    if (changed) saveAndSync();
    return changed;
  }

  function showSyncBadge() {
    let badge = document.querySelector('[data-faculty-sync-badge]');
    if (!badge) {
      badge = document.createElement('div');
      badge.dataset.facultySyncBadge = 'true';
      badge.style.cssText = 'position:fixed;right:18px;bottom:70px;z-index:99999;background:#062033;color:white;padding:10px 14px;border-radius:12px;font-family:Arial,sans-serif;font-weight:700;box-shadow:0 12px 30px rgba(0,0,0,.22)';
      document.body.appendChild(badge);
    }
    badge.textContent = 'Faculty subjects synced to Study Plan Creator';
    setTimeout(() => badge.remove(), 2200);
  }

  function hookSaves() {
    document.addEventListener('click', event => {
      const text = (event.target && event.target.textContent || '').trim().toLowerCase();
      if (text === 'save' || text.includes('save')) {
        setTimeout(() => {
          const changed = applyFacultySubjectSync();
          if (changed && typeof window.render === 'function') window.render();
          if (changed) showSyncBadge();
        }, 250);
      }
    }, true);
  }

  function boot() {
    if (!window.state) return setTimeout(boot, 250);
    applyFacultySubjectSync();
    hookSaves();
    window.addEventListener('hashchange', () => setTimeout(applyFacultySubjectSync, 100));
  }

  window.examonApplyFacultySubjectSync = applyFacultySubjectSync;
  boot();
})();
