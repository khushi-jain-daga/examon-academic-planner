/* Final print/PDF layout fix for Examon Academic Planner */
(function () {
  const FOOTER_TEXT = 'Examon Education | Mentorship: 8368886452';
  const LOGO = 'assets/examon-logo.webp';
  const FOOTER_SAFE_PX = 76;

  function installCss() {
    let style = document.querySelector('style[data-print-layout-final]');
    if (!style) {
      style = document.createElement('style');
      style.setAttribute('data-print-layout-final', 'true');
      document.head.appendChild(style);
    }

    style.textContent = `
      .print-area { width: 100% !important; }

      .print-page {
        position: relative !important;
        width: 210mm !important;
        min-height: 297mm !important;
        height: 297mm !important;
        max-height: 297mm !important;
        box-sizing: border-box !important;
        padding: 16mm 18mm 31mm 18mm !important;
        margin: 0 auto 18mm auto !important;
        overflow: hidden !important;
        background: #ffffff !important;
      }

      .print-page > .print-footer {
        position: absolute !important;
        left: 18mm !important;
        right: 18mm !important;
        bottom: 8mm !important;
        width: auto !important;
        height: 10mm !important;
        box-sizing: border-box !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 8px !important;
        padding: 6px 0 0 0 !important;
        margin: 0 !important;
        border-top: 1px solid #d9e4ec !important;
        color: #55708a !important;
        font-size: 10px !important;
        line-height: 1.2 !important;
        background: rgba(255,255,255,0.92) !important;
        z-index: 10002 !important;
      }

      .print-footer span:first-child { font-weight: 700 !important; }
      .print-footer span:last-child { text-align: right !important; white-space: nowrap !important; }

      .print-page > :not(.print-footer) { position: relative !important; z-index: 2 !important; }

      .print-page::after {
        content: '' !important;
        position: absolute !important;
        left: 50% !important;
        top: 50% !important;
        width: 520px !important;
        height: 520px !important;
        transform: translate(-50%, -50%) !important;
        background-image: url('${LOGO}') !important;
        background-repeat: no-repeat !important;
        background-position: center center !important;
        background-size: contain !important;
        opacity: 0.13 !important;
        z-index: 10000 !important;
        pointer-events: none !important;
      }

      .print-page .module-summary,
      .print-page .schedule-table,
      .print-page table { margin-bottom: 0 !important; }

      .print-page table { width: 100% !important; border-collapse: collapse !important; }
      .print-page tr { break-inside: avoid !important; page-break-inside: avoid !important; }

      /* Do not show priority / P1 in final draft PDF */
      .print-page th.priority-col,
      .print-page td.priority-col,
      .print-page th[data-priority-col],
      .print-page td[data-priority-col],
      .print-page .priority-col,
      .print-page .module-priority,
      .print-page .priority-pill { display: none !important; }

      .print-page .print-continuation-title {
        font-size: 18px !important;
        font-weight: 900 !important;
        color: #062033 !important;
        margin: 0 0 10px 0 !important;
        padding-bottom: 8px !important;
        border-bottom: 1px solid #d9e4ec !important;
      }

      .print-page .footer-guard {
        position: absolute !important;
        left: 18mm !important;
        right: 18mm !important;
        bottom: 18mm !important;
        height: 12mm !important;
        background: linear-gradient(to bottom, rgba(255,255,255,0), #fff 55%) !important;
        z-index: 10001 !important;
        pointer-events: none !important;
      }

      @media print {
        @page { size: A4; margin: 0; }
        html, body { background: #ffffff !important; }
        .no-print, .print-toolbar, .cloud-status-pill { display: none !important; }
        .print-page {
          page-break-after: always !important;
          break-after: page !important;
          margin: 0 !important;
          width: 210mm !important;
          height: 297mm !important;
          min-height: 297mm !important;
          max-height: 297mm !important;
          padding: 16mm 18mm 31mm 18mm !important;
          overflow: hidden !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .print-page > .print-footer {
          position: absolute !important;
          left: 18mm !important;
          right: 18mm !important;
          bottom: 8mm !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .print-page::after {
          opacity: 0.13 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;
  }

  function pageLabelFromFooterText(text, index) {
    const value = String(text || '');
    if (value.includes('Cover')) return 'Study Plan · Cover';
    if (value.includes('Overview')) return 'Study Plan · Overview';
    if (value.includes('Module')) return 'Study Plan · Modules';
    if (value.includes('Schedule')) return 'Study Plan · Schedule';
    return `Study Plan · Page ${index + 1}`;
  }

  function normalizeFooter(page, index) {
    if (!page) return;

    let footers = Array.from(page.querySelectorAll('.print-footer'));
    if (!footers.length) {
      const footer = document.createElement('div');
      footer.className = 'print-footer';
      footers = [footer];
    }

    const footer = footers[0];
    const originalText = footer.textContent || '';
    footers.slice(1).forEach(f => f.remove());

    if (footer.parentElement !== page) page.appendChild(footer);

    const right = page.dataset.pageLabel || pageLabelFromFooterText(originalText, index);
    footer.innerHTML = `<span>${FOOTER_TEXT}</span><span>${right}</span>`;
    footer.style.position = 'absolute';
    footer.style.left = '18mm';
    footer.style.right = '18mm';
    footer.style.bottom = '8mm';
    footer.style.width = 'auto';
    footer.style.margin = '0';

    let guard = page.querySelector(':scope > .footer-guard');
    if (!guard) {
      guard = document.createElement('div');
      guard.className = 'footer-guard';
      page.insertBefore(guard, footer);
    }
  }

  function hidePriorityColumns() {
    document.querySelectorAll('.print-page table').forEach(table => {
      const rows = Array.from(table.rows || []);
      if (!rows.length) return;

      const headerCells = Array.from(rows[0].cells || []);
      const priorityIndexes = [];
      headerCells.forEach((cell, index) => {
        const text = String(cell.textContent || '').trim().toLowerCase();
        if (text === 'priority' || text === 'p' || text.includes('priority')) priorityIndexes.push(index);
      });

      // Some generated PDF tables do not label the column clearly, but show P1 values.
      rows.slice(1).forEach(row => Array.from(row.cells || []).forEach((cell, index) => {
        const text = String(cell.textContent || '').trim();
        if (/^P\d+$/i.test(text)) priorityIndexes.push(index);
      }));

      [...new Set(priorityIndexes)].forEach(index => {
        rows.forEach(row => {
          const cell = row.cells && row.cells[index];
          if (cell) cell.classList.add('priority-col');
        });
      });
    });
  }

  function contentBottom(page) {
    const pageRect = page.getBoundingClientRect();
    const footer = page.querySelector(':scope > .print-footer');
    if (footer) return footer.getBoundingClientRect().top - 12;
    return pageRect.bottom - FOOTER_SAFE_PX;
  }

  function createContinuationPage(sourcePage, label) {
    const next = sourcePage.cloneNode(false);
    next.dataset.generatedContinuation = 'true';
    next.dataset.pageLabel = label || sourcePage.dataset.pageLabel || 'Study Plan · Continued';
    next.className = sourcePage.className;
    const title = document.createElement('div');
    title.className = 'print-continuation-title';
    title.textContent = label || 'Continued Schedule';
    next.appendChild(title);
    const footer = document.createElement('div');
    footer.className = 'print-footer';
    next.appendChild(footer);
    sourcePage.parentNode.insertBefore(next, sourcePage.nextSibling);
    return next;
  }

  function splitTableIfNeeded(page, index) {
    if (!page || page.dataset.paginationProcessed === 'true') return;
    const tables = Array.from(page.querySelectorAll('table'));
    if (!tables.length) return;

    tables.forEach(table => {
      let tbody = table.tBodies && table.tBodies[0];
      if (!tbody || tbody.rows.length < 2) return;

      const limit = contentBottom(page);
      const rows = Array.from(tbody.rows);
      let firstOverflowIndex = rows.findIndex(row => row.getBoundingClientRect().bottom > limit);
      if (firstOverflowIndex < 0) return;

      // Keep at least one row on the current page when possible.
      if (firstOverflowIndex === 0) firstOverflowIndex = 1;

      const overflowRows = rows.slice(firstOverflowIndex);
      if (!overflowRows.length) return;

      const label = table.closest('.schedule-table') || String((page.textContent || '')).includes('Schedule')
        ? 'Study Plan · Schedule'
        : 'Study Plan · Continued';
      const nextPage = createContinuationPage(page, label);
      const newTable = table.cloneNode(false);
      const oldThead = table.tHead ? table.tHead.cloneNode(true) : null;
      if (oldThead) newTable.appendChild(oldThead);
      const newBody = document.createElement('tbody');
      overflowRows.forEach(row => newBody.appendChild(row));
      newTable.appendChild(newBody);
      nextPage.insertBefore(newTable, nextPage.querySelector('.print-footer'));
    });

    page.dataset.paginationProcessed = 'true';
  }

  function splitOversizedPages() {
    const pages = Array.from(document.querySelectorAll('.print-page:not([data-generated-continuation])'));
    pages.forEach((page, index) => splitTableIfNeeded(page, index));
  }

  function fixPrintPages() {
    installCss();
    hidePriorityColumns();
    splitOversizedPages();
    const pages = Array.from(document.querySelectorAll('.print-page'));
    pages.forEach(normalizeFooter);
    hidePriorityColumns();
  }

  let pending = false;
  function scheduleFix() {
    if (pending) return;
    pending = true;
    setTimeout(() => {
      pending = false;
      fixPrintPages();
    }, 80);
  }

  function boot() {
    installCss();
    setTimeout(fixPrintPages, 250);
    const observer = new MutationObserver(scheduleFix);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('hashchange', () => setTimeout(fixPrintPages, 300));
    window.addEventListener('beforeprint', fixPrintPages);
    setInterval(fixPrintPages, 2000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
