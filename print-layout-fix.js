/* Print/PDF layout fix for Examon Academic Planner */
(function () {
  const FOOTER_TEXT = 'Examon Education | Mentorship: 8368886452';
  const LOGO = 'assets/examon-logo.webp';

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
        height: auto !important;
        box-sizing: border-box !important;
        padding: 16mm 18mm 24mm 18mm !important;
        margin: 0 auto 18mm auto !important;
        overflow: visible !important;
        background: #ffffff !important;
      }

      .print-page > .print-footer {
        position: absolute !important;
        left: 18mm !important;
        right: 18mm !important;
        bottom: 8mm !important;
        width: auto !important;
        min-height: 8mm !important;
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
        background: transparent !important;
        z-index: 10005 !important;
      }

      .print-footer span:first-child { font-weight: 700 !important; }
      .print-footer span:last-child { text-align: right !important; white-space: nowrap !important; }

      .print-page > :not(.print-footer):not(.print-watermark-final) {
        position: relative !important;
        z-index: 2 !important;
      }

      .print-watermark-final {
        position: absolute !important;
        left: 50% !important;
        top: 50% !important;
        width: 520px !important;
        height: 520px !important;
        transform: translate(-50%, -50%) !important;
        object-fit: contain !important;
        opacity: 0.15 !important;
        z-index: 10004 !important;
        pointer-events: none !important;
        user-select: none !important;
        mix-blend-mode: multiply !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

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
        opacity: 0.12 !important;
        z-index: 10003 !important;
        pointer-events: none !important;
        mix-blend-mode: multiply !important;
      }

      .print-page table {
        width: 100% !important;
        border-collapse: collapse !important;
        margin-bottom: 12mm !important;
      }

      .print-page tr {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }

      .print-page th.priority-col,
      .print-page td.priority-col,
      .print-page th[data-priority-col],
      .print-page td[data-priority-col],
      .print-page .priority-col,
      .print-page .module-priority,
      .print-page .priority-pill {
        display: none !important;
      }

      .print-page .print-continuation-title {
        font-size: 18px !important;
        font-weight: 900 !important;
        color: #062033 !important;
        margin: 0 0 10px 0 !important;
        padding-bottom: 8px !important;
        border-bottom: 1px solid #d9e4ec !important;
      }

      .print-page .footer-guard {
        display: none !important;
      }

      .generated-print-page {
        height: 297mm !important;
        min-height: 297mm !important;
        max-height: 297mm !important;
        overflow: hidden !important;
        padding-bottom: 26mm !important;
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
          height: auto !important;
          min-height: 297mm !important;
          padding: 16mm 18mm 24mm 18mm !important;
          overflow: visible !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .generated-print-page {
          height: 297mm !important;
          min-height: 297mm !important;
          max-height: 297mm !important;
          overflow: hidden !important;
          padding-bottom: 26mm !important;
        }
        .print-page > .print-footer {
          position: absolute !important;
          left: 18mm !important;
          right: 18mm !important;
          bottom: 8mm !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .print-watermark-final, .print-page::after {
          opacity: 0.14 !important;
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
    page.querySelectorAll(':scope > .footer-guard, .footer-guard').forEach(el => el.remove());

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
  }

  function ensureWatermark(page) {
    if (!page) return;
    let watermark = page.querySelector(':scope > .print-watermark-final');
    if (!watermark) {
      watermark = document.createElement('img');
      watermark.className = 'print-watermark-final';
      watermark.alt = 'Examon watermark';
      watermark.decoding = 'async';
      page.appendChild(watermark);
    }
    watermark.src = LOGO;
    page.appendChild(watermark);
  }

  function hidePriorityColumns() {
    document.querySelectorAll('.print-page table').forEach(table => {
      const rows = Array.from(table.rows || []);
      if (!rows.length) return;
      const priorityIndexes = [];

      Array.from(rows[0].cells || []).forEach((cell, index) => {
        const text = String(cell.textContent || '').trim().toLowerCase();
        if (text === 'priority' || text === 'p' || text.includes('priority')) priorityIndexes.push(index);
      });

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

  function usableBottom(page) {
    const footer = page.querySelector(':scope > .print-footer');
    const pageRect = page.getBoundingClientRect();
    return footer ? footer.getBoundingClientRect().top - 18 : pageRect.bottom - 88;
  }

  function createContinuationPage(sourcePage, label) {
    const next = sourcePage.cloneNode(false);
    next.className = sourcePage.className + ' generated-print-page';
    next.dataset.generatedContinuation = 'true';
    next.dataset.pageLabel = label || 'Study Plan · Continued';

    const title = document.createElement('div');
    title.className = 'print-continuation-title';
    title.textContent = label || 'Study Plan · Continued';
    next.appendChild(title);

    const footer = document.createElement('div');
    footer.className = 'print-footer';
    next.appendChild(footer);
    sourcePage.parentNode.insertBefore(next, sourcePage.nextSibling);
    return next;
  }

  function splitOneTable(page, table) {
    const tbody = table.tBodies && table.tBodies[0];
    if (!tbody || tbody.rows.length < 2) return false;

    const rows = Array.from(tbody.rows);
    const limit = usableBottom(page);
    let cut = rows.findIndex(row => row.getBoundingClientRect().bottom > limit);
    if (cut < 0) return false;
    if (cut === 0) cut = 1;

    const overflowRows = rows.slice(cut);
    if (!overflowRows.length) return false;

    const label = String(page.textContent || '').includes('Schedule') ? 'Study Plan · Schedule' : 'Study Plan · Continued';
    const nextPage = createContinuationPage(page, label);
    const newTable = table.cloneNode(false);
    if (table.tHead) newTable.appendChild(table.tHead.cloneNode(true));
    const newBody = document.createElement('tbody');
    overflowRows.forEach(row => newBody.appendChild(row));
    newTable.appendChild(newBody);
    nextPage.insertBefore(newTable, nextPage.querySelector('.print-footer'));
    return true;
  }

  function paginateTables() {
    let guard = 0;
    while (guard < 20) {
      guard += 1;
      let changed = false;
      const pages = Array.from(document.querySelectorAll('.print-page'));
      for (const page of pages) {
        normalizeFooter(page, pages.indexOf(page));
        for (const table of Array.from(page.querySelectorAll('table'))) {
          if (splitOneTable(page, table)) {
            changed = true;
            break;
          }
        }
        if (changed) break;
      }
      if (!changed) break;
    }
  }

  function fixPrintPages() {
    installCss();
    document.querySelectorAll('.footer-guard').forEach(el => el.remove());
    hidePriorityColumns();
    paginateTables();
    const pages = Array.from(document.querySelectorAll('.print-page'));
    pages.forEach((page, index) => {
      normalizeFooter(page, index);
      ensureWatermark(page);
    });
    hidePriorityColumns();
  }

  let pending = false;
  function scheduleFix() {
    if (pending) return;
    pending = true;
    setTimeout(() => {
      pending = false;
      fixPrintPages();
    }, 120);
  }

  function boot() {
    installCss();
    setTimeout(fixPrintPages, 350);
    const observer = new MutationObserver(scheduleFix);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('hashchange', () => setTimeout(fixPrintPages, 350));
    window.addEventListener('beforeprint', fixPrintPages);
    setInterval(fixPrintPages, 2500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
