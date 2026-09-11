/* Compact UI fix for standalone Calendar page. Keeps calendar working but restores normal app scale. */
(function () {
  function install() {
    let style = document.getElementById('calendar-compact-ui-css');
    if (!style) {
      style = document.createElement('style');
      style.id = 'calendar-compact-ui-css';
      document.head.appendChild(style);
    }
    style.textContent = `
      #app.calendar-fixed {
        grid-template-columns: 250px minmax(0, 1fr) !important;
        font-size: 14px !important;
      }

      #app.calendar-fixed .fix-sidebar {
        width: 250px !important;
        padding: 20px 16px !important;
      }

      #app.calendar-fixed .fix-logo {
        gap: 10px !important;
        margin-bottom: 22px !important;
        font-size: 15px !important;
      }

      #app.calendar-fixed .fix-logo img {
        width: 34px !important;
        height: 34px !important;
      }

      #app.calendar-fixed .fix-sidebar a {
        font-size: 15px !important;
        padding: 11px 13px !important;
        border-radius: 11px !important;
        margin: 4px 0 !important;
      }

      #app.calendar-fixed .fix-note {
        left: 16px !important;
        right: 16px !important;
        bottom: 16px !important;
        padding: 12px !important;
        font-size: 13px !important;
        line-height: 1.3 !important;
      }

      #app.calendar-fixed .fix-header {
        height: 74px !important;
        padding: 0 30px !important;
      }

      #app.calendar-fixed .fix-header h2 {
        font-size: 22px !important;
        line-height: 1.1 !important;
      }

      #app.calendar-fixed .fix-header p {
        font-size: 14px !important;
        margin-top: 5px !important;
      }

      #app.calendar-fixed .fix-header img {
        width: 34px !important;
        height: 34px !important;
      }

      #app.calendar-fixed .fix-create {
        font-size: 14px !important;
        padding: 11px 18px !important;
        min-width: 0 !important;
        border-radius: 13px !important;
      }

      #app.calendar-fixed .fix-content {
        padding: 34px 38px 56px !important;
        max-width: 1160px !important;
        margin: 0 auto !important;
      }

      #app.calendar-fixed .cal-title {
        display: flex !important;
        align-items: flex-start !important;
        justify-content: space-between !important;
        gap: 20px !important;
        margin-bottom: 24px !important;
      }

      #app.calendar-fixed .cal-title h1 {
        font-size: 34px !important;
        line-height: 1.05 !important;
        margin: 0 0 8px !important;
      }

      #app.calendar-fixed .cal-title p {
        font-size: 16px !important;
        line-height: 1.35 !important;
        max-width: 700px !important;
        margin: 0 !important;
      }

      #app.calendar-fixed .cal-actions {
        display: flex !important;
        gap: 10px !important;
        flex-wrap: wrap !important;
        justify-content: flex-end !important;
      }

      #app.calendar-fixed .cal-actions button {
        font-size: 14px !important;
        padding: 11px 16px !important;
        border-radius: 12px !important;
        min-width: 0 !important;
        line-height: 1.2 !important;
      }

      #app.calendar-fixed .cal-day {
        border-radius: 16px !important;
        margin-bottom: 18px !important;
      }

      #app.calendar-fixed .cal-day-head {
        padding: 16px 20px !important;
        gap: 16px !important;
      }

      #app.calendar-fixed .cal-day-head h3 {
        font-size: 22px !important;
        line-height: 1.1 !important;
        margin: 0 0 5px !important;
      }

      #app.calendar-fixed .cal-day-head p {
        font-size: 14px !important;
        margin: 0 !important;
      }

      #app.calendar-fixed .cal-row {
        grid-template-columns: 96px minmax(260px, 1.35fr) minmax(140px, .8fr) minmax(170px, .8fr) !important;
        gap: 14px !important;
        padding: 14px 20px !important;
      }

      #app.calendar-fixed .cal-time {
        font-size: 21px !important;
        line-height: 1 !important;
      }

      #app.calendar-fixed .cal-row b {
        font-size: 17px !important;
        line-height: 1.2 !important;
      }

      #app.calendar-fixed .cal-row span {
        font-size: 13px !important;
        line-height: 1.25 !important;
        margin-top: 3px !important;
      }

      #app.calendar-fixed .cal-row em {
        font-size: 13px !important;
        padding: 6px 10px !important;
        border-radius: 999px !important;
        display: inline-block !important;
        max-width: 100% !important;
      }

      @media (max-width: 900px) {
        #app.calendar-fixed { grid-template-columns: 1fr !important; }
        #app.calendar-fixed .fix-sidebar { position: static !important; width: auto !important; height: auto !important; }
        #app.calendar-fixed .fix-note { position: static !important; margin-top: 12px !important; }
        #app.calendar-fixed .cal-title { flex-direction: column !important; }
        #app.calendar-fixed .cal-row { grid-template-columns: 80px 1fr !important; }
      }
    `;
  }

  function run() {
    install();
    if (location.hash === '#/calendar' || location.hash.endsWith('/calendar')) {
      document.documentElement.style.fontSize = '16px';
      document.body.style.zoom = '1';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
  window.addEventListener('hashchange', run);
  setInterval(run, 2000);
})();
