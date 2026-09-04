async function fetchWithFallback(path) {
  const localUrl = `/${path}`;
  const rawUrl = `https://raw.githubusercontent.com/khushi-jain-daga/examon-academic-planner/main/${path}`;

  try {
    const response = await fetch(localUrl, { cache: 'no-store' });
    if (response.ok) return response;
  } catch (_) {}

  const fallback = await fetch(rawUrl, { cache: 'no-store' });
  if (!fallback.ok) throw new Error(`Failed to load ${path}: ${fallback.status}`);
  return fallback;
}

async function gunzipText(path) {
  const response = await fetchWithFallback(path);
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('This browser does not support DecompressionStream. Please use a current version of Chrome, Edge, Safari, or Firefox.');
  }
  const stream = response.body.pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).text();
}

(async () => {
  try {
    const css = await gunzipText('styles.css.gz');
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const js = await gunzipText('app.js.gz');
    (0, eval)(js);
  } catch (error) {
    console.error(error);
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `<div style="font-family:Arial,sans-serif;max-width:760px;margin:60px auto;padding:24px;border:1px solid #ddd;border-radius:16px"><h2>Unable to load Examon Academic Planner</h2><p>${String(error.message || error)}</p><p>Please hard-refresh the page. If the issue continues, redeploy the latest main branch on Vercel.</p></div>`;
    }
  }
})();
