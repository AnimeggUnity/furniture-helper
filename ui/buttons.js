
((app) => {
  function insertButtons() {
    const addBtn = document.querySelector('button.el-button.el-button--success');
    if (!addBtn || document.querySelector('#tm-stats-btn')) return;

    if (!addBtn.parentNode) {
      console.error('父節點未找到');
      return;
    }

    addBtn.onclick = null; // 載入表單功能已廢棄

    const statsBtn = document.createElement('button');
    statsBtn.type = 'button';
    statsBtn.id = 'tm-stats-btn';
    statsBtn.textContent = '年度統計';
    statsBtn.className = 'el-button el-button--primary el-button--small';
    statsBtn.style.marginLeft = '5px';
    statsBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      app.setStatsTriggered(true);
      const queryBtn = Array.from(document.querySelectorAll('button.el-button')).find(b => /查\s*詢/.test(b.textContent));
      if (!queryBtn) {
        console.error('查詢按鈕未找到');
        alert('查詢按鈕未找到，請確認頁面已載入');
        app.setStatsTriggered(false);
        return;
      }
      try {
        if (queryBtn.__vue__ && queryBtn.__vue__.$emit) {
          queryBtn.__vue__.$emit('click');
        } else {
          const clickEvent = new MouseEvent('click', { bubbles: false, cancelable: true, view: window });
          queryBtn.dispatchEvent(clickEvent);
        }
        setTimeout(() => {
          window.postMessage({ source: 'run-vue-stats' }, window.location.origin);
          app.setStatsTriggered(false);
        }, 1000);
      } catch (error) {
        console.error('觸發查詢按鈕時發生錯誤:', error);
        setTimeout(() => {
          window.postMessage({ source: 'run-vue-stats' }, window.location.origin);
          app.setStatsTriggered(false);
        }, 500);
      }
    };

    const panelBtn = document.createElement('button');
    panelBtn.type = 'button';
    panelBtn.textContent = '資料面板';
    panelBtn.className = 'el-button el-button--info el-button--small';
    panelBtn.style.marginLeft = '5px';
    panelBtn.onclick = () => {
      const panel = document.getElementById('furniture-panel');
      if (panel) {
        panel.remove();
      } else {
        window.postMessage({ source: 'run-vue-panel' }, window.location.origin);
      }
    };

    const printBtn = document.createElement('button');
    printBtn.type = 'button';
    printBtn.textContent = '列印表格';
    printBtn.className = 'el-button el-button--success el-button--small';
    printBtn.style.marginLeft = '5px';
    printBtn.onclick = () => {
      window.postMessage({ source: 'run-vue-print' }, window.location.origin);
    };

    const quickImportBtn = document.createElement('button');
    quickImportBtn.type = 'button';
    quickImportBtn.textContent = '直接匯入';
    quickImportBtn.className = 'el-button el-button--danger el-button--small';
    quickImportBtn.style.marginLeft = '5px';
    quickImportBtn.title = '選擇包含 Base64 圖片的 JSON 檔案，直接送到伺服器';
    quickImportBtn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.style.display = 'none';
      input.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const processingMsg = document.createElement('div');
        processingMsg.textContent = '正在處理資料，請稍候...';
        processingMsg.style.cssText = app.UI_COMPONENTS.processing.base;
        document.body.appendChild(processingMsg);
        try {
          const text = await file.text();
          const jsonData = JSON.parse(text);
          const now = new Date();
          const createDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
          const modifyDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + app.APP_CONSTANTS.BUSINESS.DEFAULT_AUCTION_DURATION_DAYS, 0, 0, 0, 0);
          const formatDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T00:00:00.00`;
          jsonData.StartDate = formatDate(createDate);
          jsonData.EndDate = formatDate(modifyDate);
          await app.directSubmitToAPI(jsonData);
          processingMsg.remove();
        } catch (error) {
          processingMsg.remove();
          app.ERROR_HANDLER.handle(error, 'file-processing', { fallbackMessage: '直接匯入失敗，請檢查檔案格式' });
        }
        document.body.removeChild(input);
      });
      document.body.appendChild(input);
      input.click();
    };

    const remoteQuickImportBtn = document.createElement('button');
    remoteQuickImportBtn.type = 'button';
    remoteQuickImportBtn.textContent = '遠端匯入';
    remoteQuickImportBtn.className = 'el-button el-button--danger el-button--small';
    remoteQuickImportBtn.style.marginLeft = '5px';
    remoteQuickImportBtn.title = '從遠端 files.php 獲取 JSON 清單並循序匯入';
    remoteQuickImportBtn.onclick = app.handleRemoteQuickImport;

    const settingsBtn = document.createElement('button');
    settingsBtn.type = 'button';
    settingsBtn.textContent = '設定';
    settingsBtn.className = 'el-button el-button--info el-button--small';
    settingsBtn.style.marginLeft = '5px';
    settingsBtn.title = '設定 Webhook 網址';
    settingsBtn.onclick = app.showSettingsPanel;

    addBtn.parentNode.insertBefore(statsBtn, addBtn.nextSibling);
    addBtn.parentNode.insertBefore(panelBtn, statsBtn.nextSibling);
    addBtn.parentNode.insertBefore(printBtn, panelBtn.nextSibling);
    addBtn.parentNode.insertBefore(quickImportBtn, printBtn.nextSibling);
    addBtn.parentNode.insertBefore(remoteQuickImportBtn, quickImportBtn.nextSibling);
    addBtn.parentNode.insertBefore(settingsBtn, remoteQuickImportBtn.nextSibling);

    console.log('已插入功能按鈕');
  }

  function addEnterKeySupport() {
    const inputs = document.querySelectorAll('input[type="text"], input[type="search"], .el-input__inner');

    inputs.forEach(input => {
      if (input.dataset.enterKeyBound) return;
      input.dataset.enterKeyBound = 'true';

      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();

          const queryBtn = Array.from(document.querySelectorAll('button.el-button'))
            .find(b => /查\s*詢/.test(b.textContent));

          if (queryBtn) {
            if (!app.isStatsTriggered()) {
              try {
                if (queryBtn.__vue__ && queryBtn.__vue__.$emit) {
                  queryBtn.__vue__.$emit('click');
                } else {
                  const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                  });
                  queryBtn.dispatchEvent(clickEvent);
                }
                console.log('Enter鍵觸發查詢成功');
              } catch (error) {
                console.error('Enter鍵觸發查詢失敗:', error);
              }
            }
          }
        }
      });
    });
  }

  app.insertButtons = insertButtons;
  app.addEnterKeySupport = addEnterKeySupport;
})(window.FurnitureHelper = window.FurnitureHelper || {});
