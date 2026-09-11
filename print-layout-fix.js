/* Final print/PDF layout fix for Examon Academic Planner */
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
        height: 297mm !important;
        max-height: 297mm !important;
        box-sizing: border-box !important;
        padding: 18mm 18mm 28mm 18mm !important;
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
        height: 9mm !important;
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
        background: rgba(255,255,255,0.78) !important;
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
      .print-page table { margin-bottom: 16mm !important; }

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
          padding: 18mm 18mm 28mm 18mm !important;
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

    if (footer.parentElement !== page) {
      page.appendChild(footer);
    }

    const right = pageLabelFromFooterText(originalText, index);
    footer.innerHTML = `<span>${FOOTER_TEXT}</span><span>${right}</span>`;
    footer.style.position = 'absolute';
    footer.style.left = '18mm';
    footer.style.right = '18mm';
    footer.style.bottom = '8mm';
    footer.style.width = 'auto';
    footer.style.margin = '0';
  }

  function fixPrintPages() {
    installCss();
    const pages = Array.from(document.querySelectorAll('.print-page'));
    pages.forEach(normalizeFooter);
  }

  let pending = false;
  function scheduleFix() {
    if (pending) return;
    pending = true;
    setTimeout(() => {
      pending = false;
      fixPrintPages();
    }, 50);
  }

  function boot() {
    installCss();
    fixPrintPages();
    const observer = new MutationObserver(scheduleFix);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('hashchange', () => setTimeout(fixPrintPages, 200));
    window.addEventListener('beforeprint', fixPrintPages);
    setInterval(fixPrintPages, 1500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
