/* Stable Calendar route fix: keeps original app layout and replaces only the broken Calendar content. */
(function () {
  const LOGO = 'assets/examon-logo.webp';
  const FOOTER = 'Examon Education | Mentorship: 8368886452';

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function st() {
    try { if (typeof state !== 'undefined' && state && Array.isArray(state.plans)) return state; } catch (_) {}
    try { if (window.state && Array.isArray(window.state.plans)) return window.state; } catch (_) {}
    try {
      const raw = localStorage.getItem('examonAcademicPlannerV1');
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && Array.isArray(parsed.plans)) return parsed;
    } catch (_) {}
    return { plans: [], faculty: [] };
  }

  function niceDate(date) {
    try { if (typeof pretty === 'function') return pretty(date); } catch (_) {}
    if (!date) return '';
    try { return new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch (_) { return date; }
  }

  function niceDay(date) {
    try { if (typeof dayName === 'function') return dayName(date); } catch (_) {}
    try { return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }); }
    catch (_) { return ''; }
  }

  function facultyText(ids) {
    try { if (typeof facultyNames === 'function') return facultyNames(ids || []); } catch (_) {}
    const faculty = st().faculty || [];
    return (ids || []).map(id => (faculty.find(f => f.id === id) || {}).name || id).filter(Boolean).join(' & ');
  }

  function sessions() {
    const data = st();
    const rows = [];
    (data.plans || []).forEach(plan => {
      (plan.sessions || []).forEach(session => rows.push({
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
      }));
    });
    return rows.sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.startTime).localeCompare(String(b.startTime)) || String(a.subjectName).localeCompare(String(b.subjectName)));
  }

  function grouped() {
    const g = {};
    sessions().forEach(x => { (g[x.date] ||= []).push(x); });
    return g;
  }

  function csvRows(list) {
    return [['Date','Day','Time','Batch','Exam','Subject','Topic','Category','Faculty']].concat(list.map(x => [x.date, niceDay(x.date), x.startTime, x.batch, x.exam, x.subjectName, x.topic, x.category, facultyText(x.facultyIds)]));
  }

  function downloadCsv(filename, rows) {
    const csv = rows.map(row => row.map(v => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  window.exportCalendarCSV = function () { downloadCsv('examon-master-calendar-full.csv', csvRows(sessions())); };
  window.exportDayCSV = function (date) { downloadCsv('examon-calendar-' + date + '.csv', csvRows(sessions().filter(x => x.date === date))); };

  function printHtml(title, body) {
    const w = window.open('', '_blank');
    if (!w) { alert('Please allow popups to download PDF.'); return; }
    w.document.write('<!doctype html><html><head><title>' + esc(title) + '</title><style>@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;background:#eef5f9;color:#062033;font-family:Arial,sans-serif}.page{position:relative;width:210mm;min-height:297mm;margin:0 auto 10mm;background:#fff;padding:16mm 15mm 22mm;overflow:hidden;page-break-after:always}.page:after{content:"";position:absolute;left:50%;top:50%;width:125mm;height:125mm;transform:translate(-50%,-50%);background:url("' + LOGO + '") center/contain no-repeat;opacity:.14;z-index:20;pointer-events:none}.content{position:relative;z-index:2}.top{display:flex;justify-content:space-between;align-items:center;border-bottom:4px solid #20bfc7;padding-bottom:10px;margin-bottom:14px}.top img{height:18mm;object-fit:contain}h1{font-size:26px;margin:4px 0}.kicker{text-transform:uppercase;letter-spacing:.08em;font-size:11px;color:#5f7c91;font-weight:900}.subtitle{color:#5f7c91;font-size:13px}.day{margin-top:14px;border:1px solid #d9e9ef;border-radius:14px;overflow:hidden;break-inside:avoid}.day-head{background:#eaf8f8;padding:10px 12px}.day-head b{font-size:17px}.day-head span{display:block;color:#5f7c91;font-size:12px;margin-top:3px}table{width:100%;border-collapse:collapse}th,td{border-top:1px solid #d9e4ec;padding:7px 8px;text-align:left;font-size:10.5px;vertical-align:top}th{background:#f4fbfc;color:#063244;text-transform:uppercase;letter-spacing:.04em}.time{font-weight:900;color:#00a8b5;font-size:13px}.subject{font-weight:800}.muted{display:block;color:#6f8295;font-size:9.5px;margin-top:2px}.pill{display:inline-block;background:#eef0ff;color:#3f49bc;border-radius:999px;padding:4px 8px;font-weight:800;font-size:9.5px;white-space:nowrap}.footer{position:absolute;left:15mm;right:15mm;bottom:8mm;border-top:1px solid #d9e4ec;padding-top:5px;display:flex;justify-content:space-between;color:#55708a;font-size:10px;z-index:30;background:rgba(255,255,255,.9)}@media print{body{background:#fff}.page{margin:0;break-after:page;-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>' + body + '<script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script></body></html>');
    w.document.close();
  }

  function pdfDay(date) {
    const list = sessions().filter(x => x.date === date);
    const rows = list.map(x => '<tr><td class="time">' + esc(x.startTime) + '</td><td>' + esc(x.batch) + '<span class="muted">' + esc(x.exam) + '</span></td><td><span class="subject">' + esc(x.subjectName) + '</span><span class="muted">' + esc(x.topic) + '</span></td><td><span class="pill">' + esc(x.category) + '</span></td><td>' + esc(facultyText(x.facultyIds)) + '</td></tr>').join('');
    const body = '<section class="page"><div class="content"><div class="top"><div><div class="kicker">Examon Education · Daily Calendar</div><h1>' + esc(niceDate(date)) + '</h1><div class="subtitle">' + esc(niceDay(date)) + ' · ' + list.length + ' classes</div></div><img src="' + LOGO + '"></div><div class="day"><table><thead><tr><th>Time</th><th>Batch</th><th>Subject</th><th>Category</th><th>Faculty</th></tr></thead><tbody>' + rows + '</tbody></table></div></div><div class="footer"><span>' + FOOTER + '</span><span>Daily Calendar</span></div></section>';
    printHtml('Examon Daily Calendar ' + date, body);
  }

  function pdfFull() {
    const g = grouped();
    const dates = Object.keys(g);
    let page = '<section class="page"><div class="content"><div class="top"><div><div class="kicker">Examon Education · Master Calendar</div><h1>Full Class Calendar</h1><div class="subtitle">' + sessions().length + ' total classes · ' + dates.length + ' active dates</div></div><img src="' + LOGO + '"></div>';
    let used = 0;
    dates.forEach((date, idx) => {
      const list = g[date];
      const weight = 2 + list.length;
      if (idx > 0 && used + weight > 14) {
        page += '</div><div class="footer"><span>' + FOOTER + '</span><span>Master Calendar</span></div></section><section class="page"><div class="content"><div class="top"><div><div class="kicker">Examon Education · Master Calendar</div><h1>Full Class Calendar</h1><div class="subtitle">Continued</div></div><img src="' + LOGO + '"></div>';
        used = 0;
      }
      page += '<div class="day"><div class="day-head"><b>' + esc(niceDate(date)) + '</b><span>' + esc(niceDay(date)) + ' · ' + list.length + ' class(es)</span></div><table><thead><tr><th>Time</th><th>Batch</th><th>Subject</th><th>Category</th><th>Faculty</th></tr></thead><tbody>' + list.map(x => '<tr><td class="time">' + esc(x.startTime) + '</td><td>' + esc(x.batch) + '<span class="muted">' + esc(x.exam) + '</span></td><td><span class="subject">' + esc(x.subjectName) + '</span><span class="muted">' + esc(x.topic) + '</span></td><td><span class="pill">' + esc(x.category) + '</span></td><td>' + esc(facultyText(x.facultyIds)) + '</td></tr>').join('') + '</tbody></table></div>';
      used += weight;
    });
    if (!dates.length) page += '<div class="day"><div class="day-head"><b>No scheduled sessions yet.</b></div></div>';
    page += '</div><div class="footer"><span>' + FOOTER + '</span><span>Master Calendar</span></div></section>';
    printHtml('Examon Full Calendar PDF', page);
  }

  window.printDay = pdfDay;
  window.printFullCalendarPDF = pdfFull;

  function calendarMarkup() {
    const all = sessions();
    const g = grouped();
    const days = Object.entries(g).map(([date, list]) => '<div class="day-group"><div class="day-head"><div><b>' + esc(niceDate(date)) + '</b><span class="day-sub">' + esc(niceDay(date)) + ' · ' + list.length + ' class(es)</span></div><div class="toolbar"><button class="btn small" onclick="exportDayCSV(\'' + esc(date) + '\')">Download Day CSV</button><button class="btn small gold" onclick="printDay(\'' + esc(date) + '\')">Download Day PDF</button></div></div>' + list.map(x => '<div class="session"><div class="time">' + esc(x.startTime) + '</div><div><b>' + esc(x.subjectName) + '</b><div class="meta"><a href="#/plans/' + encodeURIComponent(x.planId) + '">' + esc(x.batch) + '</a></div></div><div class="faculty">' + esc(facultyText(x.facultyIds)) + '</div><div class="meta"><span class="tag">' + esc(x.category) + '</span></div></div>').join('') + '</div>').join('');
    return '<div class="page-title"><div><h2>Master Calendar</h2><p>Daily operations view across all batches. Total ' + all.length + ' classes.</p></div><div class="toolbar"><button class="btn" onclick="exportCalendarCSV()">Download Full CSV</button><button class="btn gold" onclick="printFullCalendarPDF()">Download Full PDF</button></div></div>' + (days || '<div class="card empty">No scheduled sessions yet.</div>');
  }

  function installCss() {
    if (document.getElementById('calendar-stable-css')) return;
    const css = document.createElement('style');
    css.id = 'calendar-stable-css';
    css.textContent = '#app .day-group{background:#fff;border:1px solid #d9e9ef;border-radius:18px;margin:0 0 18px;overflow:hidden;box-shadow:0 14px 34px rgba(6,32,51,.05)}#app .day-head{background:#eaf8f8;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;gap:12px}#app .day-head b{font-size:20px}#app .day-sub{display:block;color:#5f7c91;margin-top:3px}#app .session{display:grid;grid-template-columns:95px 1.3fr .8fr .8fr;gap:14px;align-items:center;padding:14px 18px;border-top:1px solid #d9e4ec;background:#fff}#app .time{font-weight:900;color:#00a8b5;font-size:20px}#app .faculty{font-weight:600}.toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.btn.gold{background:#e4af18!important;color:#061526!important;border-color:#e4af18!important}.btn.small{padding:9px 12px!important;font-size:13px!important}.tag{display:inline-block;background:#eef0ff;color:#3f49bc;border-radius:999px;padding:5px 10px;font-weight:800;font-size:12px}@media(max-width:900px){#app .session{grid-template-columns:1fr}#app .day-head{display:block}.toolbar{margin-top:10px}}';
    document.head.appendChild(css);
  }

  function patchCalendarPage() {
    try {
      calendarPage = function () {
        installCss();
        if (typeof layout === 'function') return layout(calendarMarkup(), 'Calendar', 'Daily class calendar and exports');
        return calendarMarkup();
      };
      window.calendarPage = calendarPage;
      return true;
    } catch (_) { return false; }
  }

  let renderedSig = '';
  function renderIfNeeded() {
    patchCalendarPage();
    if (location.hash !== '#/calendar' && !location.hash.endsWith('/calendar')) return;
    const sig = sessions().length + ':' + Object.keys(grouped()).join('|');
    const text = (document.getElementById('app') || {}).textContent || '';
    const broken = text.includes('</div>') || !text.includes('Master Calendar') || !text.includes('Download Full PDF') || text.includes('Examon EducationCalendar');
    if (broken || sig !== renderedSig) {
      renderedSig = sig;
      try { if (typeof render === 'function') render(); } catch (_) {}
      setTimeout(() => {
        const app = document.getElementById('app');
        const now = app ? app.textContent || '' : '';
        if (app && (now.includes('</div>') || !now.includes('Download Full PDF'))) {
          const main = app.querySelector('main') || app.querySelector('.content') || app;
          main.innerHTML = calendarMarkup();
        }
      }, 100);
    }
  }

  installCss();
  [100, 400, 1000, 1800, 3000].forEach(ms => setTimeout(renderIfNeeded, ms));
  window.addEventListener('hashchange', () => setTimeout(renderIfNeeded, 80));
  setInterval(renderIfNeeded, 2000);
})();
