/* Standalone stable Calendar renderer for Examon Academic Planner.
   This bypasses the broken calendar HTML in the main chunk and renders from saved planner data. */
(function () {
  const STORAGE_KEY = 'examonAcademicPlannerV1';
  const LOGO = 'assets/examon-logo.webp';

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }
  function readState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { plans: [], faculty: [] }; }
    catch (_) { return { plans: [], faculty: [] }; }
  }
  function dateObj(iso) {
    const [y, m, d] = String(iso || '').split('-').map(Number);
    return new Date(y || 2000, (m || 1) - 1, d || 1);
  }
  function pretty(date) {
    if (!date) return '';
    return dateObj(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function dayName(date) {
    return dateObj(date).toLocaleDateString('en-US', { weekday: 'short' });
  }
  function facultyNames(st, ids) {
    const list = st.faculty || [];
    return (ids || []).map(id => list.find(f => f.id === id)?.name || '').filter(Boolean).join(' & ') || '—';
  }
  function rows() {
    const st = readState();
    const output = [];
    (st.plans || []).forEach(plan => {
      (plan.sessions || []).forEach(session => {
        output.push({
          planId: plan.id,
          batch: plan.batchName || 'Untitled Batch',
          exam: plan.examName || '',
          date: session.date || '',
          time: session.startTime || '',
          subject: session.subjectName || '',
          category: session.category || '',
          faculty: facultyNames(st, session.facultyIds || []),
          exception: session.exception || ''
        });
      });
    });
    return output.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.batch.localeCompare(b.batch));
  }
  function csvDownload(name, data) {
    const csv = data.map(row => row.map(value => '"' + String(value ?? '').replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  window.exportCalendarCSV = function () {
    const data = [['Date', 'Day', 'Time', 'Batch', 'Exam', 'Subject', 'Category', 'Faculty']];
    rows().forEach(r => data.push([r.date, dayName(r.date), r.time, r.batch, r.exam, r.subject, r.category, r.faculty]));
    csvDownload('examon-master-calendar.csv', data);
  };
  window.exportDayCSV = function (date) {
    const data = [['Date', 'Day', 'Time', 'Batch', 'Exam', 'Subject', 'Category', 'Faculty']];
    rows().filter(r => r.date === date).forEach(r => data.push([r.date, dayName(r.date), r.time, r.batch, r.exam, r.subject, r.category, r.faculty]));
    csvDownload('examon-calendar-' + date + '.csv', data);
  };
  window.printDay = function (date) {
    const dayRows = rows().filter(r => r.date === date);
    const w = window.open('', '_blank');
    w.document.write('<!doctype html><html><head><title>Examon Daily Calendar</title><style>body{font-family:Arial,sans-serif;color:#062033;padding:28px}header{display:flex;justify-content:space-between;align-items:center;border-bottom:4px solid #20bfc7;padding-bottom:14px;margin-bottom:20px}img{height:58px;object-fit:contain}table{width:100%;border-collapse:collapse}th,td{border:1px solid #d9e4ec;padding:9px;font-size:12px;text-align:left;vertical-align:top}th{background:#eaf8fb}.muted{color:#5f7c91;font-size:12px}</style></head><body><header><div><h1>Daily Class Calendar</h1><div class="muted">' + esc(pretty(date)) + ' · ' + esc(dayName(date)) + ' · ' + dayRows.length + ' classes</div></div><img src="' + LOGO + '"></header><table><thead><tr><th>Time</th><th>Batch</th><th>Subject</th><th>Category</th><th>Faculty</th></tr></thead><tbody>' + dayRows.map(r => '<tr><td><b>' + esc(r.time) + '</b></td><td>' + esc(r.batch) + '<div class="muted">' + esc(r.exam) + '</div></td><td><b>' + esc(r.subject) + '</b></td><td>' + esc(r.category) + '</td><td>' + esc(r.faculty) + '</td></tr>').join('') + '</tbody></table><script>window.onload=function(){window.print()}<\/script></body></html>');
    w.document.close();
  };

  function groupByDate(items) {
    return items.reduce((acc, item) => { (acc[item.date] ||= []).push(item); return acc; }, {});
  }
  function navLink(hash, label, active) {
    return '<a class="nav-link ' + (active ? 'active' : '') + '" href="' + hash + '"><span>○</span>' + label + '</a>';
  }
  function renderCalendar() {
    if (!(location.hash === '#/calendar' || location.hash.endsWith('/calendar'))) return;
    const app = document.getElementById('app');
    if (!app) return;

    const items = rows();
    const grouped = groupByDate(items);
    const groups = Object.entries(grouped).map(([date, list]) => {
      return '<section class="cal-day"><div class="cal-day-head"><div><h3>' + esc(pretty(date)) + '</h3><p>' + esc(dayName(date)) + ' · ' + list.length + ' class(es)</p></div><div class="cal-actions"><button onclick="exportDayCSV(\'' + esc(date) + '\')">Export Day CSV</button><button class="gold" onclick="printDay(\'' + esc(date) + '\')">Print / PDF Day</button></div></div>' +
        list.map(r => '<div class="cal-row"><div class="cal-time">' + esc(r.time) + '</div><div><b>' + esc(r.subject) + '</b><p>' + esc(r.batch) + '</p></div><div>' + esc(r.faculty) + '</div><div><span>' + esc(r.category) + '</span></div></div>').join('') + '</section>';
    }).join('');

    app.innerHTML = '<style>' +
      'body{margin:0;background:#eef6fa;color:#062033;font-family:Inter,Arial,sans-serif}.app-shell{display:grid;grid-template-columns:250px 1fr;min-height:100vh}.sidebar{background:#08243a;color:#dcecff;padding:26px 18px;position:sticky;top:0;height:100vh}.sidebar img{width:58px;height:58px;object-fit:contain;margin-bottom:24px}.nav-link{display:flex;gap:12px;align-items:center;color:#dcecff;text-decoration:none;padding:13px 12px;border-radius:12px;margin:4px 0;font-weight:700}.nav-link.active{background:#123f60;color:#19d6df}.side-card{position:absolute;left:18px;right:18px;bottom:24px;background:#113a59;border:1px solid #295776;border-radius:14px;padding:14px;color:#aad7e7}.topbar{height:82px;background:white;border-bottom:1px solid #d9e6ee;display:flex;align-items:center;justify-content:space-between;padding:0 38px}.topbar img{height:42px;object-fit:contain}.create-btn{background:#13c2c8;color:#062033;border:0;border-radius:13px;padding:14px 20px;font-weight:900;text-decoration:none}.main{padding:36px 38px}.page-title{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}.page-title h1{font-size:34px;margin:0 0 8px}.page-title p{margin:0;color:#627c90;font-size:17px}.export-main{background:white;border:1px solid #cfe0eb;border-radius:14px;padding:14px 18px;font-weight:900;box-shadow:0 10px 30px rgba(6,32,51,.08);cursor:pointer}.cal-day{background:white;border:1px solid #d9e6ee;border-radius:22px;overflow:hidden;margin-bottom:20px;box-shadow:0 20px 50px rgba(6,32,51,.06)}.cal-day-head{background:#eaf8f8;display:flex;justify-content:space-between;align-items:center;padding:18px 22px;border-bottom:1px solid #d9e6ee}.cal-day-head h3{margin:0;font-size:20px}.cal-day-head p{margin:4px 0 0;color:#637b8e}.cal-actions{display:flex;gap:10px}.cal-actions button{border:0;background:#0b2c44;color:white;border-radius:12px;padding:10px 14px;font-weight:900;cursor:pointer}.cal-actions button.gold{background:#e3b322;color:#111}.cal-row{display:grid;grid-template-columns:100px minmax(260px,1fr) 220px 210px;gap:18px;align-items:center;padding:15px 22px;border-bottom:1px solid #e1ebf2}.cal-row:last-child{border-bottom:0}.cal-time{font-size:19px;color:#08aeb8;font-weight:900}.cal-row b{font-size:17px}.cal-row p{margin:4px 0 0;color:#667e91;font-size:13px}.cal-row span{display:inline-block;background:#eef2ff;color:#4655b8;border-radius:999px;padding:6px 10px;font-weight:800;font-size:12px}.empty{background:white;border:1px solid #d9e6ee;border-radius:22px;padding:34px;text-align:center;color:#637b8e}.cloud-status-pill{position:fixed;right:18px;bottom:18px;z-index:9999;border-radius:999px;padding:9px 13px;font:700 12px Arial,sans-serif;box-shadow:0 8px 24px rgba(6,32,51,.15);background:#e6fbff;color:#006775;border:1px solid #b7edf5}@media(max-width:900px){.app-shell{grid-template-columns:1fr}.sidebar{display:none}.cal-row{grid-template-columns:1fr}.topbar{padding:0 18px}.main{padding:24px 18px}}' +
      '</style><div class="app-shell"><aside class="sidebar"><img src="' + LOGO + '" alt="Examon">' +
      navLink('#/dashboard','Dashboard',false) + navLink('#/create','Create Study Plan',false) + navLink('#/plans','Study Plans',false) + navLink('#/templates','Templates',false) + navLink('#/faculty','Faculty',false) + navLink('#/subjects','Subjects',false) + navLink('#/calendar','Calendar',true) + navLink('#/settings','Settings',false) +
      '<div class="side-card"><b>Local App</b><br><span>Data saves in this browser and cloud when Supabase is active.</span></div></aside><section><header class="topbar"><div><h2>Calendar</h2><p>Daily class calendar and exports</p></div><div style="display:flex;gap:18px;align-items:center"><a class="create-btn" href="#/create">+ Create</a><img src="' + LOGO + '" alt="Examon"></div></header><main class="main"><div class="page-title"><div><h1>Master Calendar</h1><p>Daily operations view across all batches. Export each day for the academic team.</p></div><button class="export-main" onclick="exportCalendarCSV()">Export Full Calendar CSV</button></div>' + (items.length ? groups : '<div class="empty">No scheduled sessions yet.</div>') + '</main></section></div>';
    document.body.dataset.calendarStandalone = 'true';
  }

  function handleRoute() {
    if (location.hash === '#/calendar' || location.hash.endsWith('/calendar')) {
      renderCalendar();
    } else if (document.body.dataset.calendarStandalone === 'true') {
      delete document.body.dataset.calendarStandalone;
      setTimeout(() => location.reload(), 20);
    }
  }

  window.addEventListener('hashchange', () => setTimeout(handleRoute, 20));
  window.addEventListener('storage', () => setTimeout(handleRoute, 50));
  setTimeout(handleRoute, 300);
  setTimeout(handleRoute, 1000);
  setInterval(() => {
    if (location.hash === '#/calendar' || location.hash.endsWith('/calendar')) {
      const appText = (document.getElementById('app')?.textContent || '');
      if (!appText.includes('Export Full Calendar CSV') || appText.includes('</div>')) renderCalendar();
    }
  }, 1500);
})();
