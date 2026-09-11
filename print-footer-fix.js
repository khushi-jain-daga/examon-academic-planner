/* Final PDF/print footer fix: keep footer at true page bottom without overlapping content. */
(function () {
  function installPrintFooterFix() {
    let style = document.querySelector('style[data-print-footer-fix]');
    if (!style) {
      style = document.createElement('style');
      style.setAttribute('data-print-footer-fix', 'true');
      document.head.appendChild(style);
    }

    style.textContent = `
      .print-area {
        background: #eaf2f7 !important;
      }

      .print-page {
        position: relative !important;
        min-height: 1122px !important;
        box-sizing: border-box !important;
        display: flex !important;
        flex-direction: column !important;
        overflow: hidden !important;
        padding-bottom: 34px !important;
      }

      .print-footer {
        position: static !important;
        left: auto !important;
        right: auto !important;
        bottom: auto !important;
        transform: none !important;
        width: 100% !important;
        box-sizing: border-box !important;
        margin-top: auto !important;
        padding-top: 10px !important;
        border-top: 1px solid #d7e4ec !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 16px !important;
        color: #5f7c91 !important;
        background: transparent !important;
        z-index: 10001 !important;
        font-size: 12px !important;
        line-height: 1.25 !important;
        clear: both !important;
      }

      .print-footer span:first-child {
        font-weight: 800 !important;
        color: #426477 !important;
      }

      .print-footer span:last-child {
        text-align: right !important;
        white-space: nowrap !important;
      }

      .print-page::after {
        z-index: 9999 !important;
        pointer-events: none !important;
      }

      @media print {
        @page { size: A4; margin: 0; }

        .print-page {
          min-height: 297mm !important;
          height: 297mm !important;
          max-height: 297mm !important;
          page-break-after: always !important;
          break-after: page !important;
          overflow: hidden !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .print-footer {
          margin-top: auto !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;
  }

  function normalizeFooters() {
    installPrintFooterFix();
    document.querySelectorAll('.print-footer').forEach(footer => {
      footer.style.position = 'static';
      footer.style.marginTop = 'auto';
      footer.style.left = 'auto';
      footer.style.right = 'auto';
      footer.style.bottom = 'auto';
      footer.style.width = '100%';
    });
  }

  normalizeFooters();
  window.addEventListener('hashchange', () => setTimeout(normalizeFooters, 80));
  window.addEventListener('load', () => setTimeout(normalizeFooters, 120));
  new MutationObserver(() => setTimeout(normalizeFooters, 20)).observe(document.documentElement, { childList: true, subtree: true });
})();
