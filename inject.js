window.addEventListener('message', event => {
  if (event.source !== window) return;
  const source = event.data?.source;
  const table = document.querySelector('.vxe-table');
  let vue = table?.__vue__;
  let safety = 20;
  while (vue && !vue.tableFullData && safety-- > 0) vue = vue.$parent;
  if (!vue || !vue.tableFullData) return;

  const data = vue.tableFullData;
  window.__tableFullData = data;

  if (source === 'run-vue-stats') {
    const monthly = {}, yearly = {};
    data.forEach(row => {
      const raw = row.CreateDate;
      const str = typeof raw === 'string' ? raw : raw?.toISOString?.() ?? '';
      const ym = str.slice(0, 7);
      if (ym) {
        monthly[ym] = (monthly[ym] || 0) + 1;
        const y = ym.slice(0, 4);
        yearly[y] = (yearly[y] || 0) + 1;
      }
    });
    window.postMessage({ source: 'vue-stats', monthly, yearly }, '*');
  }

  if (source === 'run-vue-export') {
    window.postMessage({ source: 'vue-export', data }, '*');
  }

  if (source === 'run-vue-export-all') {
    window.postMessage({ source: 'vue-export-all', data }, '*');
  }

  if (source === 'run-vue-panel') {
    window.postMessage({ source: 'vue-panel-data', data }, '*');
  }
});