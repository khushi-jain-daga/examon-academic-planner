/* Fix Master Calendar page rendering and remove broken HTML artifacts. */
(function () {
  function escSafe(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function fmtDate(date) {
    if (typeof pretty === 'function') return pretty(date);
    return date || '';
  }

  function daySafe(date) {
    if (typeof dayName === 'function') return dayName(date);
    try {
      return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
    } catch (_) {
      return '';
    }
  }

  function facultySafe(ids) {
    if (typeof facultyNames === 'function') return facultyNames(ids || []);
    const faculties = (window.state && state.faculty) || [];
    return (ids || []).map(id => faculties.find(f => f.id === id)?.name || '').filter(Boolean).join(' & ');
  }

  function allCalendarItems() {
    const plans = (window.state && Array.isArray(state.plans)) ? state.plans : [];
    const rows = [];
    plans.forEach(plan => {
      (plan.sessions || []).forEach(session => {
        rows.push({
          planId: plan.id,
          batch: plan.batchName || 'Untitled Batch',
          exam: plan.examName || '',
          date: session.date,
          startTime: session.startTime || '',
          subjectName: session.subjectName || '',
          category: session.category || '',
          facultyIds: session.facultyIds || [],
          exception: session.exception || ''
        });
      });
    });
    return rows.sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.startTime).localeCompare(String(b.startTime)));
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

  window.exportCalendarCSV = function () {
    const rows = [['Date', 'Day', 'Time', 'Batch', 'Exam', 'Subject', 'Category', 'Faculty']];
    allCalendarItems().forEach(item => rows.push([
      item.date,
      daySafe(item.date),
      item.startTime,
      item.batch,
      item.exam,
      item.subjectName,
      item.category,
      facultySafe(item.facultyIds)
    ]));
    downloadCsv('examon-master-calendar.csv', rows);
  };

  window.exportDayCSV = function (date) {
    const rows = [['Date', 'Day', 'Time', 'Batch', 'Exam', 'Subject', 'Category', 'Faculty']];
    allCalendarItems().filter(item => item.date === date).forEach(item => rows.push([
      item.date,
      daySafe(item.date),
      item.startTime,
      item.batch,
      item.exam,
      item.subjectName,
      item.category,
      facultySafe(item.facultyIds)
    ]));
    downloadCsv('examon-calendar-' + date + '.csv', rows);
  };

  window.printDay = function (date) {
    const rows = allCalendarItems().filter(item => item.date === date);
    const w = window.open('', '_blank');
    w.document.write('<!doctype html><html><head><title>Examon Daily Calendar</title><style>body{font-family:Arial,sans-serif;color:#062033;padding:28px}header{display:flex;justify-content:space-between;align-items:center;border-bottom:4px solid #20bfc7;padding-bottom:14px;margin-bottom:20px}img{height:58px;object-fit:contain}table{width:100%;border-collapse:collapse}th,td{border:1px solid #d9e4ec;padding:9px;font-size:12px}th{background:#eaf8fb;text-align:left}.muted{color:#5f7c91}</style></head><body><header><div><h1>Daily Class Calendar</h1><div class="muted">' + escSafe(fmtDate(date)) + ' · ' + escSafe(daySafe(date)) + ' · ' + rows.length + ' classes</div></div><img src="assets/examon-logo.webp"></header><table><thead><tr><th>Time</th><th>Batch</th><th>Subject</th><th>Category</th><th>Faculty</th></tr></thead><tbody>' + rows.map(item => '<tr><td><b>' + escSafe(item.startTime) + '</b></td><td>' + escSafe(item.batch) + '<div class="muted">' + escSafe(item.exam) + '</div></td><td><b>' + escSafe(item.subjectName) + '</b></td><td>' + escSafe(item.category) + '</td><td>' + escSafe(facultySafe(item.facultyIds)) + '</td></tr>').join('') + '</tbody></table><script>window.onload=function(){window.print()}<\/script></body></html>');
    w.document.close();
  };

  function buildCalendarHtml() {
    const items = allCalendarItems();
    const grouped = {};
    items.forEach(item => {
      (grouped[item.date] ||= []).push(item);
    });

    const groupsHtml = Object.keys(grouped).length
      ? Object.entries(grouped).map(([date, list]) => {
          return '<div class="day-group">' +
            '<div class="day-head">' +
              '<div><b>' + escSafe(fmtDate(date)) + '</b><span class="day-sub">' + escSafe(daySafe(date)) + ' · ' + list.length + ' class(es)</span></div>' +
              '<div class="toolbar"><button class="btn small" onclick="exportDayCSV(\'' + escSafe(date) + '\')">Export Day CSV</button><button class="btn small gold" onclick="printDay(\'' + escSafe(date) + '\')">Print / PDF Day</button></div>' +
            '</div>' +
            list.map(item => '<div class="session">' +
              '<div class="time">' + escSafe(item.startTime) + '</div>' +
              '<div><b>' + escSafe(item.subjectName) + '</b><div class="meta"><a href="#/plans/' + encodeURIComponent(item.planId) + '">' + escSafe(item.batch) + '</a></div></div>' +
              '<div class="faculty">' + escSafe(facultySafe(item.facultyIds)) + '</div>' +
              '<div class="meta">' + escSafe(item.category) + '</div>' +
              (item.exception ? '<span class="tag gold">Weekend</span>' : '<span></span>') +
            '</div>').join('') +
          '</div>';
        }).join('')
      : '<div class="card empty">No scheduled sessions yet.</div>';

    return '<div class="page-title"><div><h2>Master Calendar</h2><p>Daily operations view across all batches. Export each day for the academic team.</p></div><button class="btn" onclick="exportCalendarCSV()">Export Full Calendar CSV</button></div>' + groupsHtml;
  }

  function installCalendarOverride() {
    window.calendarPage = function () {
      if (typeof layout === 'function') {
        return layout(buildCalendarHtml(), 'Calendar', 'Daily class calendar and exports');
      }
      return buildCalendarHtml();
    };
    try { calendarPage = window.calendarPage; } catch (_) {}
  }

  function maybeRenderCalendar() {
    installCalendarOverride();
    if (location.hash === '#/calendar' || location.hash.endsWith('/calendar')) {
      try { if (typeof render === 'function') render(); } catch (_) {}
    }
  }

  installCalendarOverride();
  setTimeout(maybeRenderCalendar, 300);
  window.addEventListener('hashchange', () => setTimeout(maybeRenderCalendar, 50));
})();
