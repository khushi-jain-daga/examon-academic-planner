async function loadText(path) {
  const response = await fetch(`/${path}?v=4`, { cache: 'no-store' });
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
  } catch (error) {
    console.error(error);
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `<div style="font-family:Arial,sans-serif;max-width:760px;margin:60px auto;padding:24px;border:1px solid #ddd;border-radius:16px;background:white"><h2>Unable to load Examon Academic Planner</h2><p>${String(error.message || error)}</p><p>Please refresh after the latest Vercel deployment completes.</p></div>`;
    }
  }
})();
