// Replaces the old Revision study-plan type with Theory + Question Practice.
(function () {
  const OLD_LABEL = 'Revision';
  const NEW_LABEL = 'Theory + Question Practice';
  const STORAGE_KEY = 'examonAcademicPlannerV1';

  function updateState() {
    if (!window.state) return;

    (window.state.plans || []).forEach(plan => {
      if (plan.planType === OLD_LABEL) plan.planType = NEW_LABEL;
    });

    (window.state.templates || []).forEach(template => {
      if (template.type === OLD_LABEL) template.type = NEW_LABEL;
    });

    try {
      if (typeof window.save === 'function') window.save();
      else localStorage.setItem(STORAGE_KEY, JSON.stringify(window.state));
      if (typeof window.examonCloudSyncNow === 'function') window.examonCloudSyncNow();
    } catch (error) {
      console.error('Plan type patch save failed', error);
    }
  }

  function updateSelectsAndText() {
    document.querySelectorAll('select').forEach(select => {
      Array.from(select.options).forEach(option => {
        if ((option.textContent || '').trim() === OLD_LABEL || option.value === OLD_LABEL) {
          option.textContent = NEW_LABEL;
          option.value = NEW_LABEL;
        }
      });
      if (select.value === OLD_LABEL) select.value = NEW_LABEL;
    });

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      if (node.nodeValue && node.nodeValue.includes(OLD_LABEL)) {
        node.nodeValue = node.nodeValue.replaceAll(OLD_LABEL, NEW_LABEL);
      }
    });
  }

  function run() {
    updateState();
    updateSelectsAndText();
  }

  const observer = new MutationObserver(() => updateSelectsAndText());

  function boot() {
    run();
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    window.addEventListener('hashchange', () => setTimeout(run, 80));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
