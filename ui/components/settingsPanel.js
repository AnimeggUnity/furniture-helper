
((app) => {
  const DEFAULT_WEBHOOK_URL = 'https://580.blias.com/daobo/files.php?format=json';
  const DEFAULT_CONTACTS_API_URL = 'https://580.blias.com/daobo/contacts.php'; // 預設聯絡人 API (HTTPS)
  const DEFAULT_API_KEY = 'furniture-helper-2024-secret'; // 預設 API Key

  function saveWebhookSetting(url) {
    try { localStorage.setItem('furniture-helper-webhook-url', url); } catch (e) { console.error('儲存設定失敗:', e); }
  }

  function loadWebhookSetting() {
    try { return localStorage.getItem('furniture-helper-webhook-url') || DEFAULT_WEBHOOK_URL; } catch (e) { return DEFAULT_WEBHOOK_URL; }
  }

  function getCurrentWebhookUrl() {
    return loadWebhookSetting();
  }

  // === 聯絡人 API 設定 ===
  function saveContactsApiSetting(url, apiKey) {
    try {
      localStorage.setItem('furniture-helper-contacts-api-url', url);
      localStorage.setItem('furniture-helper-contacts-api-key', apiKey);
    } catch (e) {
      console.error('儲存聯絡人 API 設定失敗:', e);
    }
  }

  function loadContactsApiSetting() {
    try {
      return {
        url: localStorage.getItem('furniture-helper-contacts-api-url') || DEFAULT_CONTACTS_API_URL,
        apiKey: localStorage.getItem('furniture-helper-contacts-api-key') || DEFAULT_API_KEY
      };
    } catch (e) {
      return { url: DEFAULT_CONTACTS_API_URL, apiKey: DEFAULT_API_KEY };
    }
  }

  function getContactsApiUrl() {
    return loadContactsApiSetting().url;
  }

  function getContactsApiKey() {
    return loadContactsApiSetting().apiKey;
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

  async function testContactsApiConnection(url, apiKey) {
    const testBtn = document.getElementById('test-contacts-api-btn');
    const originalText = testBtn.textContent;
    testBtn.textContent = '測試中...';
    testBtn.disabled = true;
    try {
      const response = await fetch(`${url}?action=get_contacts&apiKey=${encodeURIComponent(apiKey)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          app.showNotification(`✅ 連線成功！找到 ${data.contacts?.length || 0} 位聯絡人`, 'success');
        } else {
          app.showNotification(`⚠️ API 回應錯誤：${data.error}`, 'warning');
        }
      } else {
        app.showNotification(`❌ 連線失敗：${response.status} ${response.statusText}`, 'error');
      }
    } catch (error) {
      app.showNotification(`❌ 連線錯誤：${error.message}`, 'error');
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

    const contactsApiSettings = loadContactsApiSetting();

    panel.innerHTML = `
      <h2 style="${app.UI_COMPONENTS.panel.header}"><span>系統設定</span><button id="close-settings-panel" style="${app.UI_COMPONENTS.closeButton.white}">X</button></h2>
      <div style="padding:20px;max-height:calc(100vh - 120px);overflow-y:auto;">

        <!-- 遠端匯入 Webhook 設定 -->
        <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:20px;">
          <h3 style="margin:0 0 15px 0;color:#333;font-size:16px;">📦 遠端匯入 Webhook</h3>
          <label style="display:block;margin-bottom:8px;font-weight:bold;">Webhook 網址：</label>
          <input type="url" id="webhook-url-input" style="${app.UI_COMPONENTS.input.url}" value="${getCurrentWebhookUrl()}">
          <div style="margin-top:8px;font-size:12px;color:#666;">預設值：${DEFAULT_WEBHOOK_URL}</div>
          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:15px;">
            <button id="reset-webhook-btn" style="${app.applyComponentVariant('button', 'default', 'secondary')}">重置</button>
            <button id="save-webhook-btn" style="${app.applyComponentVariant('button', 'default', 'primary')}">儲存</button>
          </div>
          <div style="margin-top:15px;">
            <button id="test-webhook-btn" style="${app.applyComponentVariant('button', 'fullWidth', 'success')}">測試 Webhook 連線</button>
          </div>
        </div>

        <!-- 聯絡人 API 設定 -->
        <div style="background:#fff3cd;padding:15px;border-radius:8px;margin-bottom:20px;">
          <h3 style="margin:0 0 15px 0;color:#333;font-size:16px;">👤 聯絡人 API 設定</h3>

          <label style="display:block;margin-bottom:8px;font-weight:bold;">API 網址：</label>
          <input type="url" id="contacts-api-url-input" style="${app.UI_COMPONENTS.input.url}" value="${contactsApiSettings.url}">
          <div style="margin-top:8px;font-size:12px;color:#666;">預設值：${DEFAULT_CONTACTS_API_URL}</div>

          <label style="display:block;margin:15px 0 8px 0;font-weight:bold;">API Key：</label>
          <input type="text" id="contacts-api-key-input" style="${app.UI_COMPONENTS.input.url}" value="${contactsApiSettings.apiKey}">
          <div style="margin-top:8px;font-size:12px;color:#666;">預設值：${DEFAULT_API_KEY}</div>

          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:15px;">
            <button id="reset-contacts-api-btn" style="${app.applyComponentVariant('button', 'default', 'secondary')}">重置</button>
            <button id="save-contacts-api-btn" style="${app.applyComponentVariant('button', 'default', 'primary')}">儲存</button>
          </div>
          <div style="margin-top:15px;">
            <button id="test-contacts-api-btn" style="${app.applyComponentVariant('button', 'fullWidth', 'success')}">測試聯絡人 API 連線</button>
          </div>
        </div>

        <!-- 快速連結 -->
        <div style="background:#e7f3ff;padding:15px;border-radius:8px;">
          <h3 style="margin:0 0 15px 0;color:#333;font-size:16px;">🔗 快速連結</h3>
          <button id="open-files-page-btn" style="${app.applyComponentVariant('button', 'fullWidth', 'purple')}margin-bottom:10px;">開啟 Files.php</button>
          <button id="open-contacts-page-btn" style="${app.applyComponentVariant('button', 'fullWidth', 'warning')}margin-bottom:10px;">開啟聯絡人管理</button>
          <button id="open-official-site-btn" style="${app.applyComponentVariant('button', 'fullWidth', 'info')}margin-bottom:10px;">官方發布網頁</button>
          <button id="open-github-btn" style="${app.applyComponentVariant('button', 'fullWidth', 'secondary')}">GitHub 專案頁面</button>
        </div>

      </div>`;
    document.body.appendChild(panel);

    // 關閉按鈕
    document.getElementById('close-settings-panel').onclick = () => panel.remove();

    // === Webhook 設定 ===
    document.getElementById('save-webhook-btn').onclick = () => {
      const url = document.getElementById('webhook-url-input').value.trim();
      if (isValidUrl(url)) {
        saveWebhookSetting(url);
        app.showNotification('Webhook 設定已儲存', 'success');
      } else {
        app.showNotification('請輸入有效的網址格式', 'error');
      }
    };

    document.getElementById('reset-webhook-btn').onclick = () => {
      document.getElementById('webhook-url-input').value = DEFAULT_WEBHOOK_URL;
      saveWebhookSetting(DEFAULT_WEBHOOK_URL);
      app.showNotification('Webhook 已重置為預設值', 'success');
    };

    document.getElementById('test-webhook-btn').onclick = () => {
      const url = document.getElementById('webhook-url-input').value.trim();
      if (isValidUrl(url)) testWebhookConnection(url);
      else app.showNotification('請輸入有效的網址格式', 'error');
    };

    // === 聯絡人 API 設定 ===
    document.getElementById('save-contacts-api-btn').onclick = () => {
      const url = document.getElementById('contacts-api-url-input').value.trim();
      const apiKey = document.getElementById('contacts-api-key-input').value.trim();

      if (!isValidUrl(url)) {
        app.showNotification('請輸入有效的 API 網址', 'error');
        return;
      }

      if (!apiKey) {
        app.showNotification('請輸入 API Key', 'error');
        return;
      }

      saveContactsApiSetting(url, apiKey);
      app.showNotification('✅ 聯絡人 API 設定已儲存', 'success');

      // 通知 SheetSync 重新載入設定
      if (app.SheetSync && app.SheetSync.reloadSettings) {
        app.SheetSync.reloadSettings();
      }
    };

    document.getElementById('reset-contacts-api-btn').onclick = () => {
      document.getElementById('contacts-api-url-input').value = DEFAULT_CONTACTS_API_URL;
      document.getElementById('contacts-api-key-input').value = DEFAULT_API_KEY;
      saveContactsApiSetting(DEFAULT_CONTACTS_API_URL, DEFAULT_API_KEY);
      app.showNotification('聯絡人 API 已重置為預設值', 'success');

      // 通知 SheetSync 重新載入設定
      if (app.SheetSync && app.SheetSync.reloadSettings) {
        app.SheetSync.reloadSettings();
      }
    };

    document.getElementById('test-contacts-api-btn').onclick = () => {
      const url = document.getElementById('contacts-api-url-input').value.trim();
      const apiKey = document.getElementById('contacts-api-key-input').value.trim();

      if (!isValidUrl(url)) {
        app.showNotification('請輸入有效的網址格式', 'error');
        return;
      }

      if (!apiKey) {
        app.showNotification('請輸入 API Key', 'error');
        return;
      }

      testContactsApiConnection(url, apiKey);
    };

    // === 快速連結 ===
    document.getElementById('open-files-page-btn').onclick = () => {
      const url = new URL(getCurrentWebhookUrl());
      window.open(`${url.protocol}//${url.host}${url.pathname}`, '_blank');
    };

    document.getElementById('open-contacts-page-btn').onclick = () => {
      const apiUrl = getContactsApiUrl();
      window.open(apiUrl, '_blank');
    };

    document.getElementById('open-official-site-btn').onclick = () => {
      window.open('https://580.blias.com/install/', '_blank');
    };

    document.getElementById('open-github-btn').onclick = () => {
      window.open('https://github.com/AnimeggUnity/furniture-helper', '_blank');
    };
  }

  // 匯出函數
  app.showSettingsPanel = showSettingsPanel;
  app.getCurrentWebhookUrl = getCurrentWebhookUrl;
  app.getContactsApiUrl = getContactsApiUrl;
  app.getContactsApiKey = getContactsApiKey;
})(window.FurnitureHelper = window.FurnitureHelper || {});
