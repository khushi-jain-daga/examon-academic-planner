/* Force Examon watermark back to the center of every print/PDF page. */
(function () {
  const LOGO = 'assets/examon-logo.webp';

  function installWatermarkCss() {
    let style = document.querySelector('style[data-watermark-center-fix]');
    if (!style) {
      style = document.createElement('style');
      style.setAttribute('data-watermark-center-fix', 'true');
      document.head.appendChild(style);
    }

    style.textContent = `
      .print-page {
        position: relative !important;
      }

      .print-page::after {
        content: none !important;
        display: none !important;
      }

      .print-page > .print-watermark-final,
      .print-page > .examon-center-watermark {
        position: absolute !important;
        left: 50% !important;
        top: 50% !important;
        right: auto !important;
        bottom: auto !important;
        width: 520px !important;
        max-width: 68% !important;
        height: 520px !important;
        max-height: 68% !important;
        transform: translate(-50%, -50%) !important;
        object-fit: contain !important;
        opacity: 0.15 !important;
        visibility: visible !important;
        display: block !important;
        z-index: 10004 !important;
        pointer-events: none !important;
        user-select: none !important;
        mix-blend-mode: multiply !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .print-page > .print-footer {
        z-index: 10006 !important;
      }

      .print-page > :not(.print-footer):not(.print-watermark-final):not(.examon-center-watermark):not(.footer-guard) {
        position: relative !important;
        z-index: 2 !important;
      }

      @media print {
        .print-page > .print-watermark-final,
        .print-page > .examon-center-watermark {
          left: 50% !important;
          top: 50% !important;
          width: 520px !important;
          max-width: 68% !important;
          height: 520px !important;
          max-height: 68% !important;
          transform: translate(-50%, -50%) !important;
          opacity: 0.15 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;
  }

  function centerWatermarks() {
    installWatermarkCss();
    document.querySelectorAll('.print-page').forEach(page => {
      Array.from(page.querySelectorAll('.print-watermark-final, .examon-center-watermark')).forEach((wm, index) => {
        if (index > 0) wm.remove();
      });

      let watermark = page.querySelector(':scope > .print-watermark-final') || page.querySelector(':scope > .examon-center-watermark');
      if (!watermark) {
        watermark = document.createElement('img');
        watermark.className = 'print-watermark-final examon-center-watermark';
        watermark.alt = 'Examon Education watermark';
        watermark.decoding = 'async';
      }

      watermark.src = LOGO;
      watermark.classList.add('print-watermark-final', 'examon-center-watermark');
      page.appendChild(watermark);

      Object.assign(watermark.style, {
        position: 'absolute',
        left: '50%',
        top: '50%',
        right: 'auto',
        bottom: 'auto',
        width: '520px',
        maxWidth: '68%',
        height: '520px',
        maxHeight: '68%',
        transform: 'translate(-50%, -50%)',
        objectFit: 'contain',
        opacity: '0.15',
        zIndex: '10004',
        pointerEvents: 'none',
        display: 'block',
        visibility: 'visible'
      });

      const footer = page.querySelector(':scope > .print-footer');
      if (footer) page.appendChild(footer);
    });
  }

  let pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    setTimeout(() => {
      pending = false;
      centerWatermarks();
    }, 80);
  }

  function boot() {
    centerWatermarks();
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    window.addEventListener('hashchange', () => setTimeout(centerWatermarks, 250));
    window.addEventListener('beforeprint', centerWatermarks);
    setInterval(centerWatermarks, 1500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
