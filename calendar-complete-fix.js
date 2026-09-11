/* Complete Calendar route replacement. Does not depend on the broken internal calendar renderer. */
(function () {
  const LOGO = 'assets/examon-logo.webp';
  const FOOTER = 'Examon Education | Mentorship: 8368886452';
  const STORAGE_KEYS = ['examonAcademicPlannerV1', 'examon-planner-v1', 'examon-academic-planner'];

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function getState() {
    try { if (typeof state !== 'undefined' && state && Array.isArray(state.plans)) return state; } catch (_) {}
    try { if (window.state && Array.isArray(window.state.plans)) return window.state; } catch (_) {}
    for (const key of STORAGE_KEYS) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.plans)) return parsed;
      } catch (_) {}
    }
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const raw = localStorage.getItem(key);
        if (!raw || !raw.includes('plans')) continue;
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.plans)) return parsed;
      }
    } catch (_) {}
    return { plans: [], faculty: [], settings: { logo: LOGO, footer: FOOTER } };
  }

  function niceDate(date) {
    try { if (typeof pretty === 'function') return pretty(date); } catch (_) {}
    if (!date) return '';
    try {
      return new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (_) { return date; }
  }

  function niceDay(date) {
    try { if (typeof dayName === 'function') return dayName(date); } catch (_) {}
    try { return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }); } catch (_) { return ''; }
  }

  function facultyText(st, ids) {
    try { if (typeof facultyNames === 'function') return facultyNames(ids || []); } catch (_) {}
    const faculty = (st && st.faculty) || [];
    return (ids || []).map(id => (faculty.find(f => f.id === id) || {}).name || id).filter(Boolean).join(' & ');
  }

  function allItems() {
    const st = getState();
    const out = [];
    (st.plans || []).forEach(plan => {
      (plan.sessions || []).forEach(session => {
        out.push({
          planId: plan.id,
          batch: plan.batchName || 'Untitled Batch',
          exam: plan.examName || '',
          date: session.date || '',
          startTime: session.startTime || '',
          subjectName: session.subjectName || '',
          topic: session.topic || '',
          category: session.category || '',
          facultyIds: session.facultyIds || [],
          exception: session.exception || ''
        });
      });
    });
    return out.sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.startTime).localeCompare(String(b.startTime)) || String(a.subjectName).localeCompare(String(b.subjectName)));
  }

  function groupedItems() {
    const grouped = {};
    allItems().forEach(item => { (grouped[item.date] ||= []).push(item); });
    return grouped;
  }

  function downloadCsv(name, rows) {
    const csv = rows.map(row => row.map(value => '"' + String(value ?? '').replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  function rowsFor(items) {
    const st = getState();
    const rows = [['Date', 'Day', 'Time', 'Batch', 'Exam', 'Subject', 'Topic', 'Category', 'Faculty']];
    items.forEach(x => rows.push([x.date, niceDay(x.date), x.startTime, x.batch, x.exam, x.subjectName, x.topic, x.category, facultyText(st, x.facultyIds)]));
    return rows;
  }

  window.exportCalendarCSV = function () { downloadCsv('examon-master-calendar-full.csv', rowsFor(allItems())); };
  window.exportDayCSV = function (date) { downloadCsv('examon-calendar-' + date + '.csv', rowsFor(allItems().filter(x => x.date === date))); };

  function printDoc(title, body) {
    const w = window.open('', '_blank');
    if (!w) { alert('Please allow popups to download PDF.'); return; }
    w.document.write('<!doctype html><html><head><title>' + esc(title) + '</title><style>@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;background:#eef5f9;color:#062033;font-family:Arial,sans-serif}.page{position:relative;width:210mm;min-height:297mm;margin:0 auto 10mm;background:#fff;padding:16mm 15mm 22mm;overflow:hidden;page-break-after:always}.page:after{content:"";position:absolute;left:50%;top:50%;width:125mm;height:125mm;transform:translate(-50%,-50%);background:url("' + LOGO + '") center/contain no-repeat;opacity:.14;z-index:20;pointer-events:none}.content{position:relative;z-index:2}.top{display:flex;justify-content:space-between;align-items:center;border-bottom:4px solid #20bfc7;padding-bottom:10px;margin-bottom:14px}.top img{height:18mm;object-fit:contain}h1{font-size:26px;margin:4px 0}.kicker{text-transform:uppercase;letter-spacing:.08em;font-size:11px;color:#5f7c91;font-weight:900}.subtitle{color:#5f7c91;font-size:13px}.day{margin-top:14px;border:1px solid #d9e9ef;border-radius:14px;overflow:hidden;break-inside:avoid}.day-head{background:#eaf8f8;padding:10px 12px}.day-head b{font-size:17px}.day-head span{display:block;color:#5f7c91;font-size:12px;margin-top:3px}table{width:100%;border-collapse:collapse}th,td{border-top:1px solid #d9e4ec;padding:7px 8px;text-align:left;font-size:10.5px;vertical-align:top}th{background:#f4fbfc;color:#063244;text-transform:uppercase;letter-spacing:.04em}.time{font-weight:900;color:#00a8b5;font-size:13px}.subject{font-weight:800}.muted{display:block;color:#6f8295;font-size:9.5px;margin-top:2px}.pill{display:inline-block;background:#eef0ff;color:#3f49bc;border-radius:999px;padding:4px 8px;font-weight:800;font-size:9.5px;white-space:nowrap}.footer{position:absolute;left:15mm;right:15mm;bottom:8mm;border-top:1px solid #d9e4ec;padding-top:5px;display:flex;justify-content:space-between;color:#55708a;font-size:10px;z-index:30;background:rgba(255,255,255,.9)}@media print{body{background:#fff}.page{margin:0;break-after:page;-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>' + body + '<script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script></body></html>');
    w.document.close();
  }

  window.printDay = function (date) {
    const st = getState();
    const list = allItems().filter(x => x.date === date);
    const body = '<section class="page"><div class="content"><div class="top"><div><div class="kicker">Examon Education · Daily Calendar</div><h1>' + esc(niceDate(date)) + '</h1><div class="subtitle">' + esc(niceDay(date)) + ' · ' + list.length + ' classes</div></div><img src="' + LOGO + '"></div><div class="day"><table><thead><tr><th>Time</th><th>Batch</th><th>Subject</th><th>Category</th><th>Faculty</th></tr></thead><tbody>' + list.map(x => '<tr><td class="time">' + esc(x.startTime) + '</td><td>' + esc(x.batch) + '<span class="muted">' + esc(x.exam) + '</span></td><td><span class="subject">' + esc(x.subjectName) + '</span><span class="muted">' + esc(x.topic) + '</span></td><td><span class="pill">' + esc(x.category) + '</span></td><td>' + esc(facultyText(st, x.facultyIds)) + '</td></tr>').join('') + '</tbody></table></div></div><div class="footer"><span>' + FOOTER + '</span><span>Daily Calendar</span></div></section>';
    printDoc('Examon Daily Calendar ' + date, body);
  };

  window.printFullCalendarPDF = function () {
    const st = getState();
    const g = groupedItems();
    const dates = Object.keys(g);
    const total = allItems().length;
    let html = '<section class="page"><div class="content"><div class="top"><div><div class="kicker">Examon Education · Master Calendar</div><h1>Full Class Calendar</h1><div class="subtitle">' + total + ' total classes · ' + dates.length + ' active dates</div></div><img src="' + LOGO + '"></div>';
    let weightOnPage = 0;
    dates.forEach((date, idx) => {
      const list = g[date];
      const weight = 2 + list.length;
      if (idx > 0 && weightOnPage + weight > 14) {
        html += '</div><div class="footer"><span>' + FOOTER + '</span><span>Master Calendar</span></div></section><section class="page"><div class="content"><div class="top"><div><div class="kicker">Examon Education · Master Calendar</div><h1>Full Class Calendar</h1><div class="subtitle">Continued</div></div><img src="' + LOGO + '"></div>';
        weightOnPage = 0;
      }
      html += '<div class="day"><div class="day-head"><b>' + esc(niceDate(date)) + '</b><span>' + esc(niceDay(date)) + ' · ' + list.length + ' class(es)</span></div><table><thead><tr><th>Time</th><th>Batch</th><th>Subject</th><th>Category</th><th>Faculty</th></tr></thead><tbody>' + list.map(x => '<tr><td class="time">' + esc(x.startTime) + '</td><td>' + esc(x.batch) + '<span class="muted">' + esc(x.exam) + '</span></td><td><span class="subject">' + esc(x.subjectName) + '</span><span class="muted">' + esc(x.topic) + '</span></td><td><span class="pill">' + esc(x.category) + '</span></td><td>' + esc(facultyText(st, x.facultyIds)) + '</td></tr>').join('') + '</tbody></table></div>';
      weightOnPage += weight;
    });
    if (!dates.length) html += '<div class="day"><div class="day-head"><b>No scheduled sessions yet.</b></div></div>';
    html += '</div><div class="footer"><span>' + FOOTER + '</span><span>Master Calendar</span></div></section>';
    printDoc('Examon Full Calendar PDF', html);
  };

  function calendarContent() {
    const st = getState();
    const all = allItems();
    const grouped = groupedItems();
    const groups = Object.keys(grouped).length ? Object.entries(grouped).map(([date, list]) => {
      return '<section class="cal-day"><div class="cal-day-head"><div><h3>' + esc(niceDate(date)) + '</h3><p>' + esc(niceDay(date)) + ' · ' + list.length + ' class(es)</p></div><div class="cal-actions"><button onclick="exportDayCSV(\'' + esc(date) + '\')">Download Day CSV</button><button class="gold" onclick="printDay(\'' + esc(date) + '\')">Download Day PDF</button></div></div>' + list.map(x => '<div class="cal-row"><div class="cal-time">' + esc(x.startTime) + '</div><div><b>' + esc(x.subjectName) + '</b><span>' + esc(x.batch) + '</span></div><div>' + esc(facultyText(st, x.facultyIds)) + '</div><div><em>' + esc(x.category) + '</em></div></div>').join('') + '</section>';
    }).join('') : '<section class="cal-empty">No scheduled sessions yet.</section>';

    return '<div class="cal-title"><div><h1>Master Calendar</h1><p>Daily operations view across all batches. Total ' + all.length + ' classes.</p></div><div class="cal-actions"><button onclick="exportCalendarCSV()">Download Full CSV</button><button class="gold" onclick="printFullCalendarPDF()">Download Full PDF</button></div></div>' + groups;
  }

  function fullShell() {
    return '<aside class="fix-sidebar"><div class="fix-logo"><img src="' + LOGO + '"><span>Examon Education</span></div><a href="#/dashboard">Dashboard</a><a href="#/create">Create Study Plan</a><a href="#/plans">Study Plans</a><a href="#/templates">Templates</a><a href="#/faculty">Faculty</a><a href="#/subjects">Subjects</a><a class="active" href="#/calendar">Calendar</a><a href="#/settings">Settings</a><div class="fix-note"><b>Local App</b><br>Data saves in browser and cloud when sync is active.</div></aside><main class="fix-main"><header class="fix-header"><div><h2>Calendar</h2><p>Daily class calendar and exports</p></div><a class="fix-create" href="#/create">+ Create</a><img src="' + LOGO + '"></header><section class="fix-content">' + calendarContent() + '</section></main><div class="cloud-status-pill">Saved to Cloud</div>';
  }

  function installCss() {
    if (document.getElementById('calendar-complete-fix-css')) return;
    const style = document.createElement('style');
    style.id = 'calendar-complete-fix-css';
    style.textContent = 'body{margin:0;background:#eaf3f8;color:#062033;font-family:Inter,Arial,sans-serif}#app.calendar-fixed{display:grid;grid-template-columns:310px 1fr;min-height:100vh}.fix-sidebar{background:#082438;color:#dff7fb;padding:26px 22px;position:sticky;top:0;height:100vh;box-sizing:border-box}.fix-logo{display:flex;align-items:center;gap:12px;margin-bottom:28px;font-weight:900}.fix-logo img{width:42px;height:42px;object-fit:contain}.fix-sidebar a{display:block;color:#e8fbff;text-decoration:none;padding:14px 18px;border-radius:14px;font-size:18px;font-weight:750;margin:6px 0}.fix-sidebar a.active,.fix-sidebar a:hover{background:#154661;color:#22d4df}.fix-note{position:absolute;left:22px;right:22px;bottom:22px;background:#123c56;border:1px solid #245a74;border-radius:14px;padding:16px;color:#c8edf4}.fix-main{min-width:0}.fix-header{height:96px;background:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 42px;border-bottom:1px solid #d9e4ec;box-sizing:border-box}.fix-header h2{margin:0;font-size:28px}.fix-header p{margin:8px 0 0;color:#6a8092}.fix-header img{width:42px;height:42px;object-fit:contain}.fix-create{background:#18c4cc;color:#062033;text-decoration:none;border-radius:14px;padding:15px 26px;font-weight:900}.fix-content{padding:44px 48px}.cal-title{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:24px}.cal-title h1{font-size:42px;margin:0 0 8px}.cal-title p{font-size:21px;color:#5f7c91;margin:0}.cal-actions{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.cal-actions button{border:1px solid #cfe0e8;background:#fff;color:#062033;border-radius:14px;padding:14px 20px;font-weight:900;font-size:16px;cursor:pointer;box-shadow:0 10px 26px rgba(6,32,51,.06)}.cal-actions button.gold{background:#e4af18;border-color:#e4af18}.cal-day{background:#fff;border:1px solid #d9e9ef;border-radius:22px;margin:0 0 24px;overflow:hidden;box-shadow:0 18px 42px rgba(6,32,51,.06)}.cal-day-head{display:flex;justify-content:space-between;align-items:center;background:#eaf8f8;padding:22px 28px;gap:18px}.cal-day-head h3{margin:0;font-size:25px}.cal-day-head p{margin:7px 0 0;color:#5f7c91;font-size:18px}.cal-row{display:grid;grid-template-columns:130px 1.4fr .9fr .9fr;gap:20px;align-items:center;padding:18px 28px;border-top:1px solid #d9e4ec;background:#fff}.cal-row b{font-size:20px}.cal-row span{display:block;color:#5f7c91;margin-top:4px}.cal-row em{display:inline-block;background:#eef0ff;color:#3f49bc;border-radius:999px;padding:7px 11px;font-style:normal;font-weight:900}.cal-time{font-size:26px;font-weight:950;color:#00a8b5}.cal-empty{background:#fff;border:1px solid #d9e9ef;border-radius:18px;padding:30px;color:#5f7c91}.cloud-status-pill{position:fixed;right:22px;bottom:22px;z-index:9999;border-radius:999px;padding:11px 17px;background:#e6fbff;color:#006775;border:1px solid #b7edf5;font-weight:900}@media(max-width:900px){#app.calendar-fixed{display:block}.fix-sidebar{position:relative;height:auto}.fix-content{padding:24px}.cal-title,.cal-day-head{display:block}.cal-actions{margin-top:16px}.cal-row{grid-template-columns:1fr;gap:8px}}';
    document.head.appendChild(style);
  }

  function renderCalendarHard() {
    if (location.hash !== '#/calendar' && !location.hash.endsWith('/calendar')) return;
    installCss();
    const app = document.getElementById('app');
    if (!app) return;
    app.className = 'calendar-fixed';
    app.innerHTML = fullShell();
  }

  function maybeCalendar() {
    if (location.hash === '#/calendar' || location.hash.endsWith('/calendar')) {
      renderCalendarHard();
      setTimeout(renderCalendarHard, 300);
      setTimeout(renderCalendarHard, 900);
    }
  }

  document.addEventListener('click', function (e) {
    const a = e.target.closest && e.target.closest('a[href^="#/"]');
    if (!a) return;
    if (a.getAttribute('href') === '#/calendar') return;
    if (document.getElementById('app')?.classList.contains('calendar-fixed')) {
      setTimeout(function () { location.reload(); }, 50);
    }
  }, true);

  window.addEventListener('hashchange', maybeCalendar);
  [100, 350, 800, 1500, 3000].forEach(ms => setTimeout(maybeCalendar, ms));
})();
