
((app) => {
  const DEFAULT_WEBHOOK_URL = 'https://580.blias.com/daobo/files.php?format=json';
    
  function saveWebhookSetting(url) {
    try { localStorage.setItem('furniture-helper-webhook-url', url); } catch (e) { console.error('儲存設定失敗:', e); }
  }
  
  function loadWebhookSetting() {
    try { return localStorage.getItem('furniture-helper-webhook-url') || DEFAULT_WEBHOOK_URL; } catch (e) { return DEFAULT_WEBHOOK_URL; }
  }
  
  function getCurrentWebhookUrl() {
    return loadWebhookSetting();
  }

  function isValidUrl(string) {
    try { new URL(string); return true; } catch (_) { return false; }
  }

  async function testWebhookConnection(url) {
    const testBtn = document.getElementById('test-webhook-btn');
    const originalText = testBtn.textContent;
    testBtn.textContent = '測試中...';
    testBtn.disabled = true;
    try {
      const response = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
      if (response.ok) {
        const data = await response.json();
        app.showNotification(`連線成功！找到 ${Array.isArray(data) ? data.length : 0} 筆資料`, 'success');
      } else {
        app.showNotification(`連線失敗：${response.status} ${response.statusText}`, 'error');
      }
    } catch (error) {
      app.showNotification(`連線錯誤：${error.message}`, 'error');
    } finally {
      testBtn.textContent = originalText;
      testBtn.disabled = false;
    }
  }

  function showSettingsPanel() {
    const panelId = 'settings-panel';
    if (document.getElementById(panelId)) document.getElementById(panelId).remove();
    const panel = document.createElement('div');
    panel.id = panelId;
    panel.style.cssText = app.applyComponentVariant('panel', 'wide');
    panel.innerHTML = `
      <h2 style="${app.UI_COMPONENTS.panel.header}"><span>系統設定</span><button id="close-settings-panel" style="${app.UI_COMPONENTS.closeButton.white}">X</button></h2>
      <div style="padding:20px;">
        <label style="display:block;margin-bottom:8px;font-weight:bold;">遠端匯入 Webhook 網址：</label>
        <input type="url" id="webhook-url-input" style="${app.UI_COMPONENTS.input.url}" value="${getCurrentWebhookUrl()}">
        <div style="margin-top:8px;font-size:12px;color:#666;">預設值：${DEFAULT_WEBHOOK_URL}</div>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">
          <button id="reset-webhook-btn" style="${app.applyComponentVariant('button', 'default', 'secondary')}">重置</button>
          <button id="save-webhook-btn" style="${app.applyComponentVariant('button', 'default', 'primary')}">儲存</button>
        </div>
        <div style="margin-top:20px;padding-top:20px;border-top:1px solid #eee;"><button id="test-webhook-btn" style="${app.applyComponentVariant('button', 'fullWidth', 'success')}">測試連線</button></div>
        <div style="margin-top:20px;padding-top:20px;border-top:1px solid #eee;"><button id="open-files-page-btn" style="${app.applyComponentVariant('button', 'fullWidth', 'purple')}">開啟 Files.php</button></div>
        <div style="margin-top:20px;padding-top:20px;border-top:1px solid #eee;">
          <button id="open-official-site-btn" style="${app.applyComponentVariant('button', 'fullWidth', 'info')}">官方發布網頁</button>
        </div>
        <div style="margin-top:10px;">
          <button id="open-github-btn" style="${app.applyComponentVariant('button', 'fullWidth', 'secondary')}">GitHub 專案頁面</button>
        </div>
      </div>`;
    document.body.appendChild(panel);
    document.getElementById('close-settings-panel').onclick = () => panel.remove();
    document.getElementById('save-webhook-btn').onclick = () => { const url = document.getElementById('webhook-url-input').value.trim(); if(isValidUrl(url)){ saveWebhookSetting(url); app.showNotification('設定已儲存', 'success'); } else { app.showNotification('請輸入有效的網址格式', 'error'); } };
    document.getElementById('reset-webhook-btn').onclick = () => { document.getElementById('webhook-url-input').value = DEFAULT_WEBHOOK_URL; saveWebhookSetting(DEFAULT_WEBHOOK_URL); app.showNotification('已重置為預設值', 'success'); };
    document.getElementById('test-webhook-btn').onclick = () => { const url = document.getElementById('webhook-url-input').value.trim(); if(isValidUrl(url)) testWebhookConnection(url); else app.showNotification('請輸入有效的網址格式', 'error'); };
    document.getElementById('open-files-page-btn').onclick = () => { const url = new URL(getCurrentWebhookUrl()); window.open(`${url.protocol}//${url.host}${url.pathname}`, '_blank'); };
    document.getElementById('open-official-site-btn').onclick = () => { window.open('https://580.blias.com/install/', '_blank'); };
    document.getElementById('open-github-btn').onclick = () => { window.open('https://github.com/AnimeggUnity/furniture-helper', '_blank'); };
  }

  app.showSettingsPanel = showSettingsPanel;
  app.getCurrentWebhookUrl = getCurrentWebhookUrl;
})(window.FurnitureHelper = window.FurnitureHelper || {});
