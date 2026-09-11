/* Fix PDF/print footer so it stays at the bottom of every A4 page. */
(function () {
  function installPrintFooterFix() {
    if (document.querySelector('style[data-print-footer-fix]')) return;

    const style = document.createElement('style');
    style.setAttribute('data-print-footer-fix', 'true');
    style.textContent = `
      .print-page {
        position: relative !important;
        min-height: 1122px !important;
        padding-bottom: 74px !important;
        box-sizing: border-box !important;
      }

      .print-footer {
        position: absolute !important;
        left: 48px !important;
        right: 48px !important;
        bottom: 26px !important;
        width: auto !important;
        margin: 0 !important;
        padding-top: 10px !important;
        border-top: 1px solid #d7e4ec !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 16px !important;
        color: #5f7c91 !important;
        background: transparent !important;
        z-index: 10000 !important;
        font-size: 12px !important;
        line-height: 1.25 !important;
      }

      .print-footer span:first-child {
        font-weight: 800 !important;
        color: #426477 !important;
      }

      .print-footer span:last-child {
        text-align: right !important;
        white-space: nowrap !important;
      }

      @media print {
        .print-page {
          min-height: 297mm !important;
          height: 297mm !important;
          padding-bottom: 22mm !important;
          overflow: hidden !important;
          page-break-after: always !important;
          break-after: page !important;
        }

        .print-footer {
          left: 14mm !important;
          right: 14mm !important;
          bottom: 8mm !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  installPrintFooterFix();
  window.addEventListener('hashchange', () => setTimeout(installPrintFooterFix, 50));
  new MutationObserver(installPrintFooterFix).observe(document.documentElement, { childList: true, subtree: true });
})();
