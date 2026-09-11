/* Final print/PDF layout fix for Examon Academic Planner */
(function () {
  const FOOTER_TEXT = 'Examon Education | Mentorship: 8368886452';
  const LOGO = 'assets/examon-logo.webp';

  function installCss() {
    if (document.querySelector('style[data-print-layout-final]')) return;
    const style = document.createElement('style');
    style.setAttribute('data-print-layout-final', 'true');
    style.textContent = `
      .print-area {
        width: 100% !important;
      }

      .print-page {
        position: relative !important;
        width: 210mm !important;
        min-height: 297mm !important;
        height: 297mm !important;
        box-sizing: border-box !important;
        padding: 18mm 18mm 24mm 18mm !important;
        margin: 0 auto 18mm auto !important;
        overflow: hidden !important;
        background: #ffffff !important;
      }

      .print-page > .print-footer,
      .print-page .print-footer,
      .print-footer {
        position: absolute !important;
        left: 18mm !important;
        right: 18mm !important;
        bottom: 9mm !important;
        height: 9mm !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 8px !important;
        padding: 0 !important;
        margin: 0 !important;
        border-top: 1px solid #d9e4ec !important;
        color: #55708a !important;
        font-size: 10px !important;
        line-height: 1.2 !important;
        background: transparent !important;
        z-index: 10002 !important;
      }

      .print-page > :not(.print-footer) {
        position: relative !important;
        z-index: 2 !important;
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
        opacity: 0.13 !important;
        z-index: 10000 !important;
        pointer-events: none !important;
      }

      .print-page .module-summary,
      .print-page .schedule-table,
      .print-page table {
        margin-bottom: 14mm !important;
      }

      .print-page .module-card,
      .print-page .card,
      .print-page .kpi-card,
      .print-page .overview-strip {
        position: relative !important;
        z-index: 2 !important;
      }

      .print-page .overview-strip + .print-footer,
      .print-page .kpi-strip + .print-footer,
      .print-page table + .print-footer {
        bottom: 9mm !important;
      }

      @media print {
        html, body {
          background: #ffffff !important;
        }
        .no-print,
        .print-toolbar,
        .cloud-status-pill {
          display: none !important;
        }
        .print-page {
          page-break-after: always !important;
          break-after: page !important;
          margin: 0 !important;
          width: 210mm !important;
          height: 297mm !important;
          min-height: 297mm !important;
          padding: 18mm 18mm 24mm 18mm !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .print-page::after {
          opacity: 0.13 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .print-footer {
          position: absolute !important;
          bottom: 9mm !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function normalizeFooter(page, index) {
    if (!page) return;

    let footers = Array.from(page.querySelectorAll('.print-footer'));
    if (!footers.length) {
      const footer = document.createElement('div');
      footer.className = 'print-footer';
      page.appendChild(footer);
      footers = [footer];
    }

    const footer = footers[0];
    footers.slice(1).forEach(f => f.remove());

    const right = footer.textContent && footer.textContent.includes('Cover')
      ? 'Study Plan · Cover'
      : footer.textContent && footer.textContent.includes('Overview')
        ? 'Study Plan · Overview'
        : `Study Plan · Page ${index + 1}`;

    footer.innerHTML = `<span>${FOOTER_TEXT}</span><span>${right}</span>`;
    footer.style.position = 'absolute';
    footer.style.left = '18mm';
    footer.style.right = '18mm';
    footer.style.bottom = '9mm';
  }

  function fixPrintPages() {
    installCss();
    const pages = Array.from(document.querySelectorAll('.print-page'));
    pages.forEach(normalizeFooter);
  }

  function boot() {
    installCss();
    fixPrintPages();
    const observer = new MutationObserver(() => fixPrintPages());
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('hashchange', () => setTimeout(fixPrintPages, 200));
    window.addEventListener('beforeprint', fixPrintPages);
    setInterval(fixPrintPages, 1200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
