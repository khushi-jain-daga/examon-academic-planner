async function loadText(path) {
  const response = await fetch(`/${path}?v=5`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
  return response.text();
}

(async () => {
  try {
    const cssParts = await Promise.all([
      'chunks/styles-1.txt',
      'chunks/styles-2.txt',
      'chunks/styles-3.txt'
    ].map(loadText));
    const style = document.createElement('style');
    style.textContent = cssParts.join('');
    document.head.appendChild(style);

    const jsParts = await Promise.all([
      'chunks/app-1.txt',
      'chunks/app-2.txt',
      'chunks/app-3.txt'
    ].map(loadText));
    (0, eval)(jsParts.join(''));

    // The app bundle is loaded after the browser's native window.load event.
    // Trigger the first render explicitly so the dashboard appears immediately.
    if (typeof window.render === 'function') {
      window.render();
    } else if (typeof render === 'function') {
      render();
    } else {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
  } catch (error) {
    console.error(error);
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `<div style="font-family:Arial,sans-serif;max-width:760px;margin:60px auto;padding:24px;border:1px solid #ddd;border-radius:16px;background:white"><h2>Unable to load Examon Academic Planner</h2><p>${String(error.message || error)}</p><p>Please refresh after the latest Vercel deployment completes.</p></div>`;
    }
  }
})();
