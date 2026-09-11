/*
  Examon Academic Planner Cloud Sync
  Supabase-backed shared workspace sync.

  This keeps localStorage working, but merges browser data with cloud data so
  batches created on different browsers can come together instead of replacing
  each other.
*/
(function () {
  const STORAGE_KEY = "examonAcademicPlannerV1";
  const config = window.EXAMON_SUPABASE || {};

  function setStatus(status, detail) {
    window.EXAMON_CLOUD_STATUS = { status, detail: detail || "", at: new Date().toISOString() };
    try { window.dispatchEvent(new CustomEvent("examon-cloud-status", { detail: window.EXAMON_CLOUD_STATUS })); } catch (_) {}
  }

  function configured() {
    return !!(config.enabled && config.url && config.anonKey && config.storeKey);
  }

  function baseUrl() {
    return String(config.url || "").replace(/\/$/, "");
  }

  function endpoint() {
    return `${baseUrl()}/rest/v1/planner_store?store_key=eq.${encodeURIComponent(config.storeKey)}&select=store_key,data,updated_at`;
  }

  function headers(extra) {
    return Object.assign({
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
      Accept: "application/json"
    }, extra || {});
  }

  function parseSafe(value) {
    if (!value) return null;
    try { return typeof value === "string" ? JSON.parse(value) : value; } catch (_) { return null; }
  }

  function newerTime(a, b) {
    const at = Date.parse(a || 0) || 0;
    const bt = Date.parse(b || 0) || 0;
    return at >= bt;
  }

  function mergeById(localArr, cloudArr) {
    const map = new Map();
    (cloudArr || []).forEach(item => item && item.id && map.set(item.id, item));
    (localArr || []).forEach(item => {
      if (!item || !item.id) return;
      const existing = map.get(item.id);
      if (!existing) map.set(item.id, item);
      else map.set(item.id, newerTime(item.updatedAt || item.createdAt, existing.updatedAt || existing.createdAt) ? item : existing);
    });
    return Array.from(map.values());
  }

  function mergePlannerData(localData, cloudData) {
    if (!localData && !cloudData) return null;
    if (!localData) return cloudData;
    if (!cloudData) return localData;

    const merged = Object.assign({}, cloudData, localData);
    merged.faculty = mergeById(localData.faculty, cloudData.faculty);
    merged.subjects = mergeById(localData.subjects, cloudData.subjects);
    merged.templates = mergeById(localData.templates, cloudData.templates);
    merged.plans = mergeById(localData.plans, cloudData.plans);
    merged.settings = Object.assign({}, cloudData.settings || {}, localData.settings || {});
    return merged;
  }

  async function pushParsedToCloud(parsed) {
    if (!configured() || !parsed) return false;
    const res = await fetch(`${baseUrl()}/rest/v1/planner_store`, {
      method: "POST",
      headers: headers({
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal"
      }),
      body: JSON.stringify({ store_key: config.storeKey, data: parsed, updated_at: new Date().toISOString() })
    });
    if (!res.ok) {
      const detail = res.status === 401
        ? "Cloud save failed: 401. Run supabase-schema.sql in Supabase SQL Editor and confirm anon policies are active."
        : `Cloud save failed: ${res.status}`;
      throw new Error(detail);
    }
    return true;
  }

  async function pullFromCloud() {
    if (!configured()) {
      setStatus("local", "Cloud sync not configured. Saving in this browser only.");
      return;
    }
    try {
      setStatus("syncing", "Loading and merging cloud data...");
      const res = await fetch(endpoint(), { headers: headers(), cache: "no-store" });
      if (!res.ok) {
        const detail = res.status === 401
          ? "Cloud pull failed: 401. Run supabase-schema.sql in Supabase SQL Editor and make sure the anon key is correct."
          : `Cloud pull failed: ${res.status}`;
        throw new Error(detail);
      }

      const rows = await res.json();
      const cloudData = Array.isArray(rows) && rows[0] && rows[0].data ? rows[0].data : null;
      const localData = parseSafe(localStorage.getItem(STORAGE_KEY));
      const merged = mergePlannerData(localData, cloudData);

      if (merged) {
        const mergedString = JSON.stringify(merged);
        localStorage.setItem(STORAGE_KEY, mergedString);
        await pushParsedToCloud(merged);
      }

      setStatus("cloud", "Cloud data merged. All browsers should show the same batches after refresh.");
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
        const parsed = parseSafe(value);
        await pushParsedToCloud(parsed);
        setStatus("cloud", "Saved to cloud.");
      } catch (err) {
        console.error("Examon cloud push failed", err);
        setStatus("error", String(err.message || err));
      }
    }, 450);
  }

  const originalSetItem = Storage.prototype.setItem;
  if (!Storage.prototype.__examonCloudPatched) {
    Storage.prototype.__examonCloudPatched = true;
    Storage.prototype.setItem = function (key, value) {
      const result = originalSetItem.apply(this, arguments);
      if (this === localStorage && key === STORAGE_KEY) pushToCloud(value);
      return result;
    };
  }

  window.EXAMON_CLOUD_READY_PROMISE = pullFromCloud();
  window.examonCloudSyncNow = function () {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value) pushToCloud(value);
  };
})();
