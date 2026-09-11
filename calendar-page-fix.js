/* Standalone Master Calendar renderer with full CSV and full PDF exports. */
(function () {
  const LOGO = 'assets/examon-logo.webp';
  const FOOTER = 'Examon Education | Mentorship: 8368886452';

  function escSafe(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function fmtDate(date) {
    if (typeof pretty === 'function') return pretty(date);
    return date || '';
  }

  function daySafe(date) {
    if (typeof dayName === 'function') return dayName(date);
    try { return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }); }
    catch (_) { return ''; }
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
          topic: session.topic || '',
          category: session.category || '',
          facultyIds: session.facultyIds || [],
          exception: session.exception || ''
        });
      });
    });
    return rows.sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.startTime).localeCompare(String(b.startTime)) || String(a.subjectName).localeCompare(String(b.subjectName)));
  }

  function groupedItems() {
    const grouped = {};
    allCalendarItems().forEach(item => { (grouped[item.date] ||= []).push(item); });
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

  function calendarRows(items) {
    const rows = [['Date', 'Day', 'Time', 'Batch', 'Exam', 'Subject', 'Topic', 'Category', 'Faculty']];
    items.forEach(item => rows.push([
      item.date,
      daySafe(item.date),
      item.startTime,
      item.batch,
      item.exam,
      item.subjectName,
      item.topic,
      item.category,
      facultySafe(item.facultyIds)
    ]));
    return rows;
  }

  window.exportCalendarCSV = function () {
    downloadCsv('examon-master-calendar-full.csv', calendarRows(allCalendarItems()));
  };

  window.exportDayCSV = function (date) {
    downloadCsv('examon-calendar-' + date + '.csv', calendarRows(allCalendarItems().filter(item => item.date === date)));
  };

  function printWindow(html) {
    const w = window.open('', '_blank');
    if (!w) { alert('Please allow popups to print/download PDF.'); return; }
    w.document.write(html);
    w.document.close();
  }

  function printHtml(title, subtitle, bodyHtml) {
    return '<!doctype html><html><head><title>' + escSafe(title) + '</title><style>' +
      '@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;background:#eef5f9;color:#062033;font-family:Arial,sans-serif}.page{position:relative;width:210mm;min-height:297mm;margin:0 auto 12mm;background:#fff;padding:16mm 15mm 22mm;overflow:hidden;page-break-after:always}.page:after{content:"";position:absolute;left:50%;top:50%;width:125mm;height:125mm;transform:translate(-50%,-50%);background:url("' + LOGO + '") center/contain no-repeat;opacity:.13;z-index:20;pointer-events:none}.content{position:relative;z-index:2}.top{display:flex;justify-content:space-between;align-items:center;border-bottom:4px solid #20bfc7;padding-bottom:10px;margin-bottom:14px}.top img{height:18mm;object-fit:contain}.kicker{letter-spacing:.08em;color:#5f7c91;font-size:11px;font-weight:800;text-transform:uppercase}h1{font-size:26px;margin:3px 0 4px}.subtitle{color:#5f7c91;font-size:13px}.day{margin-top:14px;border:1px solid #d9e9ef;border-radius:14px;overflow:hidden;break-inside:avoid}.day-head{background:#eaf8f8;padding:10px 12px;display:flex;justify-content:space-between;gap:12px}.day-head b{font-size:17px}.day-head span{display:block;color:#5f7c91;font-size:12px;margin-top:3px}table{width:100%;border-collapse:collapse}th,td{border-top:1px solid #d9e4ec;padding:7px 8px;text-align:left;font-size:10.5px;vertical-align:top}th{background:#f4fbfc;color:#063244;text-transform:uppercase;letter-spacing:.04em}.time{font-weight:900;color:#00a8b5;font-size:13px}.subject{font-weight:800}.muted{display:block;color:#6f8295;font-size:9.5px;margin-top:2px}.pill{display:inline-block;background:#eef0ff;color:#3f49bc;border-radius:999px;padding:4px 8px;font-weight:800;font-size:9.5px;white-space:nowrap}.footer{position:absolute;left:15mm;right:15mm;bottom:8mm;border-top:1px solid #d9e4ec;padding-top:5px;display:flex;justify-content:space-between;color:#55708a;font-size:10px;z-index:30;background:rgba(255,255,255,.86)}@media print{body{background:#fff}.page{margin:0;break-after:page;-webkit-print-color-adjust:exact;print-color-adjust:exact}}' +
      '</style></head><body>' + bodyHtml + '<script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script></body></html>';
  }

  window.printDay = function (date) {
    const rows = allCalendarItems().filter(item => item.date === date);
    const body = '<section class="page"><div class="content"><div class="top"><div><div class="kicker">Examon Education · Daily Calendar</div><h1>' + escSafe(fmtDate(date)) + '</h1><div class="subtitle">' + escSafe(daySafe(date)) + ' · ' + rows.length + ' classes</div></div><img src="' + LOGO + '"></div><div class="day"><table><thead><tr><th>Time</th><th>Batch</th><th>Subject</th><th>Category</th><th>Faculty</th></tr></thead><tbody>' + rows.map(item => '<tr><td class="time">' + escSafe(item.startTime) + '</td><td>' + escSafe(item.batch) + '<span class="muted">' + escSafe(item.exam) + '</span></td><td><span class="subject">' + escSafe(item.subjectName) + '</span><span class="muted">' + escSafe(item.topic) + '</span></td><td><span class="pill">' + escSafe(item.category) + '</span></td><td>' + escSafe(facultySafe(item.facultyIds)) + '</td></tr>').join('') + '</tbody></table></div></div><div class="footer"><span>' + FOOTER + '</span><span>Daily Calendar</span></div></section>';
    printWindow(printHtml('Examon Daily Calendar ' + date, '', body));
  };

  window.printFullCalendarPDF = function () {
    const grouped = groupedItems();
    const dates = Object.keys(grouped);
    const total = allCalendarItems().length;
    let pages = '<section class="page"><div class="content"><div class="top"><div><div class="kicker">Examon Education · Master Calendar</div><h1>Full Class Calendar</h1><div class="subtitle">' + total + ' total classes · ' + dates.length + ' active dates</div></div><img src="' + LOGO + '"></div>';
    let countOnPage = 0;
    dates.forEach((date, dateIndex) => {
      const list = grouped[date];
      const block = '<div class="day"><div class="day-head"><div><b>' + escSafe(fmtDate(date)) + '</b><span>' + escSafe(daySafe(date)) + ' · ' + list.length + ' class(es)</span></div></div><table><thead><tr><th>Time</th><th>Batch</th><th>Subject</th><th>Category</th><th>Faculty</th></tr></thead><tbody>' + list.map(item => '<tr><td class="time">' + escSafe(item.startTime) + '</td><td>' + escSafe(item.batch) + '<span class="muted">' + escSafe(item.exam) + '</span></td><td><span class="subject">' + escSafe(item.subjectName) + '</span><span class="muted">' + escSafe(item.topic) + '</span></td><td><span class="pill">' + escSafe(item.category) + '</span></td><td>' + escSafe(facultySafe(item.facultyIds)) + '</td></tr>').join('') + '</tbody></table></div>';
      const weight = 1 + list.length;
      if (dateIndex > 0 && countOnPage + weight > 13) {
        pages += '</div><div class="footer"><span>' + FOOTER + '</span><span>Master Calendar</span></div></section><section class="page"><div class="content"><div class="top"><div><div class="kicker">Examon Education · Master Calendar</div><h1>Full Class Calendar</h1><div class="subtitle">Continued</div></div><img src="' + LOGO + '"></div>';
        countOnPage = 0;
      }
      pages += block;
      countOnPage += weight;
    });
    if (!dates.length) pages += '<div class="day"><div class="day-head"><b>No scheduled sessions yet.</b></div></div>';
    pages += '</div><div class="footer"><span>' + FOOTER + '</span><span>Master Calendar</span></div></section>';
    printWindow(printHtml('Examon Full Calendar PDF', '', pages));
  };

  function buildCalendarHtml() {
    const items = allCalendarItems();
    const grouped = groupedItems();
    const groupsHtml = Object.keys(grouped).length
      ? Object.entries(grouped).map(([date, list]) => '<div class="day-group"><div class="day-head"><div><b>' + escSafe(fmtDate(date)) + '</b><span class="day-sub">' + escSafe(daySafe(date)) + ' · ' + list.length + ' class(es)</span></div><div class="toolbar"><button class="btn small" onclick="exportDayCSV(\'' + escSafe(date) + '\')">Download Day CSV</button><button class="btn small gold" onclick="printDay(\'' + escSafe(date) + '\')">Download Day PDF</button></div></div>' + list.map(item => '<div class="session"><div class="time">' + escSafe(item.startTime) + '</div><div><b>' + escSafe(item.subjectName) + '</b><div class="meta"><a href="#/plans/' + encodeURIComponent(item.planId) + '">' + escSafe(item.batch) + '</a></div></div><div class="faculty">' + escSafe(facultySafe(item.facultyIds)) + '</div><div class="meta">' + escSafe(item.category) + '</div>' + (item.exception ? '<span class="tag gold">Weekend</span>' : '<span></span>') + '</div>').join('') + '</div>').join('')
      : '<div class="card empty">No scheduled sessions yet.</div>';

    return '<div class="page-title"><div><h2>Master Calendar</h2><p>Daily operations view across all batches. Total ' + items.length + ' classes.</p></div><div class="toolbar"><button class="btn" onclick="exportCalendarCSV()">Download Full CSV</button><button class="btn gold" onclick="printFullCalendarPDF()">Download Full PDF</button></div></div>' + groupsHtml;
  }

  function installCalendarOverride() {
    window.calendarPage = function () {
      if (typeof layout === 'function') return layout(buildCalendarHtml(), 'Calendar', 'Daily class calendar and exports');
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
