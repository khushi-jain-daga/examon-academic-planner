async function loadText(path) {
  const response = await fetch(`/${path}?v=7`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
  return response.text();
}

function installExamonPatches() {
  const LOGO = 'assets/examon-logo.webp';
  const MENTORSHIP_FOOTER = 'Examon Education | Mentorship: 8368886452';

  const normalize = (value = '') => String(value)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  const splitList = (value = '') => String(value)
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);

  const subjectAliases = {
    'reasoning': 'Reasoning',
    'physics': 'Physics',
    'history': 'History',
    'polity': 'Polity',
    'geography': 'Geography',
    'economy': 'Economy',
    'bio': 'Biology',
    'biology': 'Biology',
    'chem': 'Chemistry',
    'chemistry': 'Chemistry',
    'static gk': 'Static GK / Current Affairs',
    'static g k': 'Static GK / Current Affairs',
    'static gk current affairs': 'Static GK / Current Affairs',
    'current affairs': 'Static GK / Current Affairs'
  };

  const mandatoryMap = {
    'Reasoning': ['f-shivam'],
    'Physics': ['f-joshit'],
    'History': ['f-amrit'],
    'Polity': ['f-amrit'],
    'Geography': ['f-amrit'],
    'Economy': ['f-anjna'],
    'Biology': ['f-anjna'],
    'Chemistry': ['f-anjna'],
    'Static GK / Current Affairs': ['f-anjna']
  };

  const ensureSubject = (name, facultyIds, branch = 'Non-Tech', category = 'Non-Technical Theory', technical = false) => {
    if (!window.state) return;
    const key = normalize(name);
    let subject = state.subjects.find(s => normalize(s.name) === key);
    if (!subject) {
      subject = {
        id: 's-' + key.replace(/\s+/g, '-'),
        name,
        branch,
        technical,
        category,
        facultyIds: [],
        duration: 60,
        active: true
      };
      state.subjects.push(subject);
    }
    subject.facultyIds = [...new Set(facultyIds)];
    subject.active = true;
  };

  function applyRequiredMappings() {
    if (!window.state) return;

    state.settings = state.settings || {};
    state.settings.logo = LOGO;
    state.settings.footer = MENTORSHIP_FOOTER;

    const facultyById = Object.fromEntries((state.faculty || []).map(f => [f.id, f]));
    if (facultyById['f-shivam']) facultyById['f-shivam'].subjects = ['Fluid Mechanics', 'Thermodynamics', 'Power Plant Engineering', 'Strength of Materials', 'RAC', 'IC Engine', 'Industrial Engineering', 'Engineering Mathematics', 'Mechanical Technical Practice', 'Material Science', 'Reasoning'];
    if (facultyById['f-joshit']) facultyById['f-joshit'].subjects = ['Environmental Engineering', 'Hydrology & Irrigation', 'Transportation Engineering', 'BMC', 'Survey', 'Geotechnical Engineering', 'Structure Analysis', 'Steel', 'RCC', 'Civil Technical Practice', 'Physics'];
    if (facultyById['f-amrit']) facultyById['f-amrit'].subjects = ['History', 'Polity', 'Geography', 'Non-Technical Practice'];
    if (facultyById['f-anjna']) facultyById['f-anjna'].subjects = ['General Awareness', 'Economy', 'Biology', 'Chemistry', 'Static GK / Current Affairs'];

    Object.entries(mandatoryMap).forEach(([subjectName, facultyIds]) => ensureSubject(subjectName, facultyIds));

    (state.templates || []).forEach(template => (template.modules || []).forEach(module => {
      const subjectName = subjectAliases[normalize(module.subjectName)] || module.subjectName;
      if (mandatoryMap[subjectName]) module.facultyIds = [...mandatoryMap[subjectName]];
    }));

    (state.plans || []).forEach(plan => {
      (plan.modules || []).forEach(module => {
        const subjectName = subjectAliases[normalize(module.subjectName)] || module.subjectName;
        if (mandatoryMap[subjectName]) module.facultyIds = [...mandatoryMap[subjectName]];
      });
      (plan.sessions || []).forEach(session => {
        const subjectName = subjectAliases[normalize(session.subjectName)] || session.subjectName;
        if (mandatoryMap[subjectName]) session.facultyIds = [...mandatoryMap[subjectName]];
      });
    });

    if (window.draft && Array.isArray(draft.modules)) {
      draft.modules.forEach(module => {
        const subjectName = subjectAliases[normalize(module.subjectName)] || module.subjectName;
        if (mandatoryMap[subjectName]) module.facultyIds = [...mandatoryMap[subjectName]];
      });
      draft.selectedFacultyIds = [...new Set((draft.modules || []).flatMap(m => m.facultyIds || []))];
    }

    if (typeof window.save === 'function') save();
  }

  function syncSubjectMasterFromFacultyCards() {
    if (!window.state) return;
    const subjectsByName = new Map((state.subjects || []).map(s => [normalize(s.name), s]));
    (state.subjects || []).forEach(subject => { subject.facultyIds = []; });

    (state.faculty || []).forEach(faculty => {
      const facultySubjects = Array.isArray(faculty.subjects) ? faculty.subjects.join(',') : faculty.subjects;
      splitList(facultySubjects).forEach(rawName => {
        const alias = subjectAliases[normalize(rawName)] || rawName;
        const key = normalize(alias);
        let subject = subjectsByName.get(key);
        if (!subject) {
          subject = {
            id: 's-' + key.replace(/\s+/g, '-'),
            name: alias,
            branch: faculty.domains && faculty.domains.includes('Civil') ? 'Civil' : (faculty.domains && faculty.domains.includes('Mechanical') ? 'Mechanical' : 'Non-Tech'),
            technical: !!(faculty.domains && (faculty.domains.includes('Civil') || faculty.domains.includes('Mechanical')) && !['Reasoning','Physics','History','Polity','Geography','Economy','Biology','Chemistry','Static GK / Current Affairs'].includes(alias)),
            category: ['Reasoning','Physics','History','Polity','Geography','Economy','Biology','Chemistry','Static GK / Current Affairs'].includes(alias) ? 'Non-Technical Theory' : 'Technical Theory',
            facultyIds: [],
            duration: 60,
            active: true
          };
          subjectsByName.set(key, subject);
          state.subjects.push(subject);
        }
        if (!subject.facultyIds.includes(faculty.id)) subject.facultyIds.push(faculty.id);
      });
    });

    Object.entries(mandatoryMap).forEach(([subjectName, facultyIds]) => ensureSubject(subjectName, facultyIds));
    if (typeof window.save === 'function') save();
  }

  function installBrandingCSS() {
    const style = document.createElement('style');
    style.setAttribute('data-examon-patch', 'branding-watermark');
    style.textContent = `
      .brand img, .top-actions img, .print-logo-inline { object-fit: contain !important; }
      .print-page { position: relative !important; overflow: hidden !important; }
      .print-page::after {
        content: '' !important;
        position: absolute !important;
        inset: 0 !important;
        background-image: url('${LOGO}') !important;
        background-repeat: no-repeat !important;
        background-position: center center !important;
        background-size: min(62%, 520px) auto !important;
        opacity: 0.14 !important;
        z-index: 9999 !important;
        pointer-events: none !important;
        mix-blend-mode: multiply !important;
      }
      .print-page > * { position: relative !important; z-index: 1 !important; }
      .print-area .module-card-top span,
      .print-area .module-page-count,
      .print-area .structure-list div:last-child,
      .print-area .module-summary th:nth-child(5),
      .print-area .module-summary td:nth-child(5) { display: none !important; }
      .print-area .module-card-top { justify-content: flex-end !important; }
      .print-footer span:first-child { font-weight: 700 !important; }
      @media print {
        .print-page::after {
          opacity: 0.15 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function patchImageErrors() {
    document.addEventListener('error', event => {
      const el = event.target;
      if (el && el.tagName === 'IMG' && String(el.src || '').includes('examon-logo.png')) el.src = LOGO;
    }, true);
  }

  applyRequiredMappings();
  syncSubjectMasterFromFacultyCards();
  installBrandingCSS();
  patchImageErrors();

  document.addEventListener('click', event => {
    const text = (event.target && event.target.textContent || '').trim().toLowerCase();
    if (text === 'save' || text.includes('save settings')) {
      setTimeout(() => {
        syncSubjectMasterFromFacultyCards();
        applyRequiredMappings();
        if (typeof window.render === 'function') render();
      }, 250);
    }
  }, true);
}

async function waitForCloudReady() {
  if (!window.EXAMON_CLOUD_READY_PROMISE) return;
  try {
    await Promise.race([
      window.EXAMON_CLOUD_READY_PROMISE,
      new Promise(resolve => setTimeout(resolve, 1800))
    ]);
  } catch (_) {}
}

(async () => {
  try {
    await waitForCloudReady();

    const cssParts = await Promise.all(['chunks/styles-1.txt','chunks/styles-2.txt','chunks/styles-3.txt'].map(loadText));
    const style = document.createElement('style');
    style.textContent = cssParts.join('');
    document.head.appendChild(style);

    const jsParts = await Promise.all(['chunks/app-1.txt','chunks/app-2.txt','chunks/app-3.txt'].map(loadText));
    (0, eval)(jsParts.join(''));

    installExamonPatches();
    if (typeof window.render === 'function') window.render();
    else if (typeof render === 'function') render();
    else window.dispatchEvent(new HashChangeEvent('hashchange'));
  } catch (error) {
    console.error(error);
    const app = document.getElementById('app');
    if (app) app.innerHTML = `<div style="font-family:Arial,sans-serif;max-width:760px;margin:60px auto;padding:24px;border:1px solid #ddd;border-radius:16px;background:white"><h2>Unable to load Examon Academic Planner</h2><p>${String(error.message || error)}</p><p>Please refresh after the latest Vercel deployment completes.</p></div>`;
  }
})();
