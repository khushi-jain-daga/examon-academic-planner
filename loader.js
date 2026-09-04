async function gunzipText(path) {
  const response = await fetch(`/${path}?v=3`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('This browser does not support DecompressionStream. Please use a current version of Chrome, Edge, Safari, or Firefox.');
  }
  const stream = response.body.pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).text();
}

(async () => {
  try {
    const css = await gunzipText('styles.bundle');
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const js = await gunzipText('app.bundle');
    (0, eval)(js);
  } catch (error) {
    console.error(error);
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `<div style="font-family:Arial,sans-serif;max-width:760px;margin:60px auto;padding:24px;border:1px solid #ddd;border-radius:16px"><h2>Unable to load Examon Academic Planner</h2><p>${String(error.message || error)}</p><p>The app bundle could not be loaded. Please refresh once after the latest Vercel deployment finishes.</p></div>`;
    }
  }
})();
