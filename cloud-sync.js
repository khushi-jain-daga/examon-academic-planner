/*
  Examon Academic Planner Cloud Sync
  Free backend target: Supabase Free Plan.

  This script wraps LocalStorage so the existing app can keep working locally,
  while also syncing the main planner data online when Supabase is configured.
*/
(function () {
  const STORAGE_KEY = "examonAcademicPlannerV1";
  const config = window.EXAMON_SUPABASE || {};
  const statusKey = "examonCloudSyncStatus";

  function setStatus(status, detail) {
    window.EXAMON_CLOUD_STATUS = { status, detail: detail || "", at: new Date().toISOString() };
    try { window.dispatchEvent(new CustomEvent("examon-cloud-status", { detail: window.EXAMON_CLOUD_STATUS })); } catch (_) {}
  }

  function configured() {
    return !!(config.enabled && config.url && config.anonKey && config.storeKey);
  }

  function endpoint() {
    return `${String(config.url).replace(/\/$/, "")}/rest/v1/planner_store?store_key=eq.${encodeURIComponent(config.storeKey)}&select=store_key,data,updated_at`;
  }

  async function pullFromCloud() {
    if (!configured()) {
      setStatus("local", "Cloud sync not configured. Saving in this browser only.");
      return;
    }
    try {
      setStatus("syncing", "Loading cloud data...");
      const res = await fetch(endpoint(), {
        headers: {
          apikey: config.anonKey,
          Authorization: `Bearer ${config.anonKey}`,
          Accept: "application/json"
        },
        cache: "no-store"
      });
      if (!res.ok) throw new Error(`Cloud pull failed: ${res.status}`);
      const rows = await res.json();
      if (Array.isArray(rows) && rows[0] && rows[0].data) {
        const cloudString = JSON.stringify(rows[0].data);
        const localString = localStorage.getItem(STORAGE_KEY);
        if (cloudString && cloudString !== localString) {
          localStorage.setItem(STORAGE_KEY, cloudString);
        }
      }
      setStatus("cloud", "Cloud data loaded.");
    } catch (err) {
      console.error("Examon cloud pull failed", err);
      setStatus("error", String(err.message || err));
    }
  }

  let pushTimer = null;
  async function pushToCloud(value) {
    if (!configured() || !value) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(async () => {
      try {
        setStatus("syncing", "Saving to cloud...");
        const parsed = JSON.parse(value);
        const res = await fetch(`${String(config.url).replace(/\/$/, "")}/rest/v1/planner_store`, {
          method: "POST",
          headers: {
            apikey: config.anonKey,
            Authorization: `Bearer ${config.anonKey}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates,return=minimal"
          },
          body: JSON.stringify({ store_key: config.storeKey, data: parsed, updated_at: new Date().toISOString() })
        });
        if (!res.ok) throw new Error(`Cloud save failed: ${res.status}`);
        setStatus("cloud", "Saved to cloud.");
      } catch (err) {
        console.error("Examon cloud push failed", err);
        setStatus("error", String(err.message || err));
      }
    }, 450);
  }

  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    const result = originalSetItem.apply(this, arguments);
    if (this === localStorage && key === STORAGE_KEY) pushToCloud(value);
    return result;
  };

  window.EXAMON_CLOUD_READY_PROMISE = pullFromCloud();
  window.examonCloudSyncNow = function () {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value) pushToCloud(value);
  };
})();
