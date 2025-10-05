
((app) => {
  // 批次下載前的設定提醒對話框
  function showDownloadSettingsWarning(callback) {
    const existingWarning = document.getElementById('download-settings-warning');
    if (existingWarning) {
      existingWarning.remove();
    }

    const warningModal = document.createElement('div');
    warningModal.id = 'download-settings-warning';
    warningModal.style.cssText = app.applyComponentVariant('modal', 'default') + 'z-index: 10001; max-width: 600px;';

    warningModal.innerHTML = `
      <h3 style="margin: 0 0 15px 0; color: #d63384; font-size: 20px;">⚠️ 批次下載前必須設定</h3>

      <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin-bottom: 15px;">
        <p style="margin: 0 0 10px 0; font-weight: bold; font-size: 16px;">為了避免按到死，請先設定瀏覽器自動儲存：</p>
        <ol style="margin: 0; padding-left: 20px; font-size: 16px;">
          <li>打開 Chrome 設定 (chrome://settings/)</li>
          <li>搜尋「下載」或點選左側「進階」→「下載」</li>
          <li><strong>關閉</strong>「下載前詢問儲存位置」選項</li>
          <li>設定好預設下載資料夾</li>
        </ol>
      </div>

      <div style="background: #d1ecf1; border: 1px solid #b8daff; padding: 10px; border-radius: 4px; margin-bottom: 15px;">
        <p style="margin: 0; font-size: 16px;">
          <strong>說明：</strong>批次下載會產生多個檔案，如果沒有設定自動儲存，
          每個檔案都會跳出儲存對話框，非常麻煩。
        </p>
      </div>

      <div style="text-align: right; display: flex; gap: 10px; justify-content: flex-end;">
        <button id="cancel-download" style="${app.applyComponentVariant('button', 'default', 'secondary')}">
          取消下載
        </button>
        <button id="confirm-download" style="${app.applyComponentVariant('button', 'default', 'primary')}">
          我已設定完成，開始下載
        </button>
      </div>
    `;

    document.body.appendChild(warningModal);

    document.getElementById('cancel-download').onclick = () => {
      warningModal.remove();
    };

    document.getElementById('confirm-download').onclick = () => {
      warningModal.remove();
      if (callback && typeof callback === 'function') {
        callback();
      }
    };

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        warningModal.remove();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
  }

  // 多檔案順序下載功能
  async function downloadMultipleFiles(selectedItems) {
    if (!selectedItems || selectedItems.length === 0) {
      app.showNotification('沒有選擇任何項目', 'warning');
      return;
    }

    const timestamp = new Date().toISOString().slice(0,19).replace(/:/g,'-');
    const exportPrefix = `furniture_export_${timestamp}`;

    const manifest = {
      exportInfo: {
        exportDate: new Date().toISOString(),
        exportType: 'BatchExport',
        totalItems: selectedItems.length,
        exportPrefix: exportPrefix
      },
      itemList: selectedItems.map(item => ({
        autoID: item.AutoID,
        filename: `${exportPrefix}_item_${item.AutoID}.json`,
        name: item.Name || '未命名',
        hasPhotos: item.Photos && item.Photos.length > 0,
        createDate: item.CreateDate
      }))
    };

    const filesToDownload = [];

    filesToDownload.push({
      name: `${exportPrefix}_manifest.json`,
      content: JSON.stringify(manifest, null, 2),
      type: 'application/json'
    });

    for (const item of selectedItems) {
      try {
        const { Photos, ...restOfItem } = item;
        const photosWithBase64 = [];

        if (Photos && Array.isArray(Photos) && Photos.length > 0) {
          for (const photo of Photos) {
            const photoUrl = photo.Photo.startsWith('http') ? photo.Photo : location.origin + photo.Photo;
            try {
              const base64 = await app.convertImageToBase64(photoUrl);
              photosWithBase64.push({ ...photo, Photo: base64, PhotoUrl: photoUrl });
            } catch (error) {
              console.warn(`圖片轉換失敗 ${photoUrl}:`, error);
              photosWithBase64.push({ ...photo, PhotoUrl: photoUrl, Error: '圖片轉換失敗' });
            }
          }
        }

        const itemData = {
          ...restOfItem,
          Photos: photosWithBase64,
          ExportInfo: {
            ExportDate: new Date().toISOString(),
            ExportType: 'BatchExportItem',
            OriginalIndex: selectedItems.indexOf(item)
          }
        };

        filesToDownload.push({
          name: `${exportPrefix}_item_${item.AutoID}.json`,
          content: JSON.stringify(itemData, null, 2),
          type: 'application/json'
        });

      } catch (error) {
        console.error(`處理項目 ${item.AutoID} 時發生錯誤:`, error);
        app.ERROR_HANDLER.handle(error, 'file-processing');
      }
    }

    app.showNotification(`開始下載 ${filesToDownload.length} 個檔案...`, 'info', 3000);

    for (let i = 0; i < filesToDownload.length; i++) {
      const file = filesToDownload[i];
      setTimeout(() => {
        try {
          const blob = new Blob([file.content], { type: file.type });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.name;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          if (i === filesToDownload.length - 1) {
            setTimeout(() => {
              app.showNotification('所有檔案下載完成！', 'success', 3000);
            }, 500);
          }
        } catch (error) {
          console.error(`下載檔案 ${file.name} 失敗:`, error);
          app.ERROR_HANDLER.handle(error, 'file-download');
        }
      }, i * 200);
    }
  }

  function showImportModal() {
    const importModal = document.createElement('div');
    importModal.id = 'import-modal';
    importModal.style.cssText = app.applyComponentVariant('modal', 'wide') + 'z-index: 10002;';

    importModal.innerHTML = `
      <h3 style="margin: 0 0 20px 0; color: #28a745; font-size: 18px;">📁 批次匯入資料</h3>

      <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #d73502; font-size: 16px;">📁 請選擇整個匯出目錄的所有檔案</p>
        <input type="file" id="manifest-file-input" accept=".json" multiple
               style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;">
        <div style="margin: 10px 0 0 0; font-size: 14px; color: #155724;">
          <p style="margin: 0 0 5px 0; font-weight: bold;">操作方法：</p>
          <ol style="margin: 0; padding-left: 20px;">
            <li><strong>Ctrl+A</strong> 全選目錄中的所有 .json 檔案</li>
            <li>或按住 <strong>Ctrl 鍵</strong>，依序選擇所有檔案</li>
          </ol>
          <p style="margin: 5px 0 0 0; color: #856404; background: #fff3cd; padding: 5px; border-radius: 3px;">
            <strong>重點：</strong>manifest.json 和所有 item_*.json 檔案都在同一個目錄，一次選完即可
          </p>
        </div>
      </div>

      <div id="import-items-container" style="display: none;">
        <div style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; border-radius: 4px; margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h4 style="margin: 0; color: #495057; font-size: 16px;">選擇要匯入的項目：</h4>
            <div style="display: flex; gap: 10px;">
              <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                <input type="checkbox" id="select-all-import" checked style="transform: scale(1.1);">
                <span style="font-weight: bold;">全選</span>
              </label>
              <span id="import-selected-count" style="color: #6c757d; font-size: 14px;"></span>
            </div>
          </div>
          <div id="import-items-list" style="max-height: 300px; overflow-y: auto; border: 1px solid #dee2e6; border-radius: 4px; background: white;">
          </div>
        </div>

        <div style="background: #e7f3ff; border: 1px solid #b3d9ff; padding: 15px; border-radius: 4px; margin-bottom: 15px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
            <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; font-weight: bold; font-size: 16px;">
              <input type="checkbox" id="override-dates-checkbox" style="transform: scale(1.2);">
              <span>覆寫競標日期</span>
            </label>
          </div>
          <div id="date-override-options" style="display: none; padding-left: 10px; border-left: 3px solid #007baf;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="font-size: 14px; color: #495057;">競標</span>
              <input type="number" id="batch-auction-duration" value="14" min="1" max="90"
                     style="width: 60px; padding: 4px 8px; border: 1px solid #ced4da; border-radius: 4px; font-size: 14px;">
              <span style="font-size: 14px; color: #495057;">天（1-90天）</span>
            </div>
            <div id="date-preview" style="font-size: 13px; color: #6c757d; padding: 8px; background: #f8f9fa; border-radius: 4px; margin-top: 8px;">
              開始日期：<span id="preview-start-date"></span><br>
              結束日期：<span id="preview-end-date"></span>
            </div>
          </div>
        </div>

        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 4px; margin-bottom: 15px;">
          <p style="margin: 0; font-size: 14px;">
            <strong>注意：</strong>請確保所有相關的項目檔案都在同一個資料夾中，匯入時會自動尋找對應的檔案。
          </p>
        </div>

        <div style="text-align: right;">
          <button id="start-import" style="${app.applyComponentVariant('button', 'default', 'success')}" disabled>
            開始匯入到系統
          </button>
        </div>
      </div>

      <div style="text-align: right; margin-top: 20px;">
        <button id="cancel-import" style="${app.applyComponentVariant('button', 'default', 'secondary')}">
          取消
        </button>
      </div>
    `;

    document.body.appendChild(importModal);
    setupImportModalEvents(importModal);
  }

  function setupImportModalEvents(modal) {
    const manifestInput = modal.querySelector('#manifest-file-input');
    const itemsContainer = modal.querySelector('#import-items-container');
    const itemsList = modal.querySelector('#import-items-list');
    const selectAllImport = modal.querySelector('#select-all-import');
    const selectedCountSpan = modal.querySelector('#import-selected-count');
    const startImportBtn = modal.querySelector('#start-import');
    const cancelBtn = modal.querySelector('#cancel-import');
    const overrideDatesCheckbox = modal.querySelector('#override-dates-checkbox');
    const dateOverrideOptions = modal.querySelector('#date-override-options');
    const batchDurationInput = modal.querySelector('#batch-auction-duration');
    const previewStartDate = modal.querySelector('#preview-start-date');
    const previewEndDate = modal.querySelector('#preview-end-date');

    let manifestData = null;
    let itemFiles = {};

    // 日期預覽更新函數
    function updateDatePreview() {
      const duration = parseInt(batchDurationInput.value) || 14;
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + duration, 0, 0, 0, 0);

      const formatDisplayDate = (date) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      };

      previewStartDate.textContent = formatDisplayDate(startDate);
      previewEndDate.textContent = `${formatDisplayDate(endDate)} (${duration}天)`;
    }

    // 覆寫日期 checkbox 變更
    if (overrideDatesCheckbox) {
      overrideDatesCheckbox.onchange = () => {
        if (overrideDatesCheckbox.checked) {
          dateOverrideOptions.style.display = 'block';
          updateDatePreview();
        } else {
          dateOverrideOptions.style.display = 'none';
        }
      };
    }

    // 天數輸入框變更
    if (batchDurationInput) {
      batchDurationInput.oninput = (e) => {
        const value = parseInt(e.target.value);
        if (isNaN(value) || value < 1 || value > 90) {
          e.target.style.borderColor = '#dc3545';
          e.target.title = '請輸入 1-90 之間的數字';
        } else {
          e.target.style.borderColor = '#28a745';
          e.target.title = '';
          updateDatePreview();
        }
      };
    }

    manifestInput.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      try {
        const manifestFile = files.find(file => file.name.includes('manifest.json'));
        if (!manifestFile) {
          throw new Error('請選擇包含 manifest.json 的檔案');
        }

        const text = await manifestFile.text();
        manifestData = JSON.parse(text);

        if (!manifestData.itemList || !Array.isArray(manifestData.itemList)) {
          throw new Error('無效的 manifest 檔案格式');
        }

        itemFiles = {};
        files.forEach(file => {
          console.log('載入檔案:', file.name);
          itemFiles[file.name] = file;
        });

        console.log('itemFiles 中的檔案:', Object.keys(itemFiles));

        displayImportItems(manifestData.itemList, itemsList, selectedCountSpan);
        itemsContainer.style.display = 'block';

        startImportBtn.disabled = false;
        startImportBtn.textContent = '開始匯入到系統';

        app.showNotification(`已載入 ${files.length} 個檔案，包含 ${manifestData.itemList.length} 個項目`, 'success');

      } catch (error) {
        console.error('讀取檔案失敗:', error);
        app.showNotification('讀取檔案失敗: ' + error.message, 'error');
      }
    };

    selectAllImport.onchange = () => {
      const itemCheckboxes = itemsList.querySelectorAll('.import-item-checkbox');
      itemCheckboxes.forEach(cb => cb.checked = selectAllImport.checked);
      updateImportSelectedCount();
    };

    function updateImportSelectedCount() {
      const itemCheckboxes = itemsList.querySelectorAll('.import-item-checkbox');
      const checkedCount = Array.from(itemCheckboxes).filter(cb => cb.checked).length;
      selectedCountSpan.textContent = `(已選 ${checkedCount} 項)`;
    }

    startImportBtn.onclick = async () => {
      const selectedItems = getSelectedImportItems();
      if (selectedItems.length === 0) {
        app.showNotification('請至少選擇一個項目', 'warning');
        return;
      }

      const missingFiles = selectedItems.filter(item => !itemFiles[item.filename]);
      if (missingFiles.length > 0) {
        const missingNames = missingFiles.map(item => item.filename);
        app.showNotification(`缺少檔案：${missingNames.join(', ')}，請確認已選擇所有相關檔案`, 'warning', 8000);
        return;
      }

      // 收集日期覆寫設定
      const dateOverrideSettings = {
        enabled: overrideDatesCheckbox && overrideDatesCheckbox.checked,
        duration: batchDurationInput ? parseInt(batchDurationInput.value) || 14 : 14
      };

      modal.remove();
      await processImportedItems(selectedItems, itemFiles, dateOverrideSettings);
    };

    cancelBtn.onclick = () => modal.remove();

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);

    function getSelectedImportItems() {
      const selectedItems = [];
      const itemCheckboxes = itemsList.querySelectorAll('.import-item-checkbox:checked');
      itemCheckboxes.forEach(cb => {
        const itemData = JSON.parse(cb.dataset.itemData);
        selectedItems.push(itemData);
      });
      return selectedItems;
    }
  }

  function displayImportItems(items, container, countSpan) {
    container.innerHTML = '';

    items.forEach((item, index) => {
      const itemDiv = document.createElement('div');
      itemDiv.style.cssText = `
        padding: 10px;
        border-bottom: 1px solid #dee2e6;
        display: flex;
        align-items: center;
        gap: 10px;
        background: ${index % 2 === 0 ? '#ffffff' : '#f8f9fa'};
      `;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'import-item-checkbox';
      checkbox.checked = true;
      checkbox.dataset.itemData = JSON.stringify(item);
      checkbox.style.cssText = 'transform: scale(1.1);';
      checkbox.onchange = () => {
        const allCheckboxes = container.querySelectorAll('.import-item-checkbox');
        const checkedCount = Array.from(allCheckboxes).filter(cb => cb.checked).length;
        countSpan.textContent = `(已選 ${checkedCount} 項)`;

        const selectAll = document.getElementById('select-all-import');
        if (checkedCount === 0) {
          selectAll.indeterminate = false;
          selectAll.checked = false;
        } else if (checkedCount === allCheckboxes.length) {
          selectAll.indeterminate = false;
          selectAll.checked = true;
        } else {
          selectAll.indeterminate = true;
        }
      };

      const itemInfo = document.createElement('div');
      itemInfo.style.cssText = 'flex-grow: 1;';
      itemInfo.innerHTML = `
        <div style="font-weight: bold; color: #495057; font-size: 16px;">${item.name}</div>
        <div style="font-size: 14px; color: #6c757d;">
          ID: ${item.autoID} | 檔案: ${item.filename} |
          ${item.hasPhotos ? '包含圖片' : '無圖片'} |
          ${item.createDate ? item.createDate.split('T')[0] : '無日期'}
        </div>
      `;

      itemDiv.appendChild(checkbox);
      itemDiv.appendChild(itemInfo);
      container.appendChild(itemDiv);
    });

    const checkedCount = items.length;
    countSpan.textContent = `(已選 ${checkedCount} 項)`;
  }

  async function processImportedItems(selectedItems, itemFiles, dateOverrideSettings = {}) {
    const { enabled: overrideDates, duration: customDuration } = dateOverrideSettings;

    if (overrideDates) {
      app.showNotification(`開始批次匯入 ${selectedItems.length} 個項目（競標 ${customDuration} 天）...`, 'info');
    } else {
      app.showNotification(`開始批次匯入 ${selectedItems.length} 個項目到系統...`, 'info');
    }

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < selectedItems.length; i++) {
      const item = selectedItems[i];
      try {
        app.showNotification(`正在匯入項目 ${i + 1}/${selectedItems.length}: ${item.name}`, 'info', 2000);

        console.log('查找檔案:', item.filename);
        console.log('可用檔案:', Object.keys(itemFiles));

        const file = itemFiles[item.filename];
        if (!file) {
          console.warn(`檔案不存在: ${item.filename}`);
          console.warn(`可用的檔案名稱:`, Object.keys(itemFiles));
          errorCount++;
          continue;
        }

        const text = await file.text();
        const itemData = JSON.parse(text);

        if (itemData.AutoID !== item.autoID) {
          console.warn(`檔案內容不匹配: ${item.filename}`);
          errorCount++;
          continue;
        }

        // 日期覆寫處理
        if (overrideDates) {
          const now = new Date();
          const createDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
          const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + customDuration, 0, 0, 0, 0);

          const formatDate = (date) => {
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T00:00:00.00`;
          };

          itemData.StartDate = formatDate(createDate);
          itemData.EndDate = formatDate(endDate);

          console.log(`📅 覆寫日期: ${itemData.StartDate} → ${itemData.EndDate}`);
        }

        await app.directSubmitToAPI(itemData);
        successCount++;

        console.log(`✅ 項目 ${item.name} (${item.autoID}) 匯入成功`);

        if (i < selectedItems.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`處理項目 ${item.filename} 時發生錯誤:`, error);
        errorCount++;
        app.showNotification(`項目 ${item.name} 匯入失敗: ${error.message}`, 'error', 3000);
      }
    }

    const message = `批次匯入完成！成功: ${successCount} 項，失敗: ${errorCount} 項`;
    if (errorCount === 0) {
      app.showNotification(message, 'success', 5000);
    } else if (successCount === 0) {
      app.showNotification(message, 'error', 5000);
    } else {
      app.showNotification(message, 'warning', 5000);
    }

    if (successCount > 0) {
      setTimeout(() => {
        const queryBtn = Array.from(document.querySelectorAll('button.el-button')).find(b => /查\s*詢/.test(b.textContent));
        if (queryBtn) {
          try {
            if (queryBtn.__vue__ && queryBtn.__vue__.$emit) {
              queryBtn.__vue__.$emit('click');
            } else {
              const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
              queryBtn.dispatchEvent(clickEvent);
            }
            console.log('批次匯入完成，已刷新資料');
          } catch (error) {
            console.error('刷新資料時發生錯誤:', error);
          }
        }
      }, 2000);
    }
  }

  app.showDownloadSettingsWarning = showDownloadSettingsWarning;
  app.downloadMultipleFiles = downloadMultipleFiles;
  app.showImportModal = showImportModal;
  app.setupImportModalEvents = setupImportModalEvents;
  app.displayImportItems = displayImportItems;
  app.processImportedItems = processImportedItems;

  async function handleRemoteQuickImport(e) {
    e.preventDefault(); e.stopPropagation();
    const processingMsg = document.createElement('div');
    processingMsg.textContent = '正在獲取資料...';
    processingMsg.style.cssText = app.UI_COMPONENTS.processing.base;
    document.body.appendChild(processingMsg);
    try {
      const webhookUrl = app.getCurrentWebhookUrl();
      const response = await fetch(webhookUrl);
      if (!response.ok) throw new Error(`無法獲取檔案清單: ${response.statusText}`);
      const filesToImport = await response.json();
      if (!filesToImport || !filesToImport.length) {
        app.showNotification('遠端沒有需要匯入的檔案', 'info');
      } else {
        buildRemoteImportSelectionPanel(filesToImport);
      }
    } catch (error) {
      app.ERROR_HANDLER.handle(error, 'remote-import');
    } finally {
      processingMsg.remove();
    }
  }

  function buildRemoteImportSelectionPanel(files = []) {
    const panelId = 'remote-import-selection-panel';
    if(document.getElementById(panelId)) document.getElementById(panelId).remove();
    const newPanel = document.createElement('div');
    newPanel.id = panelId;
    newPanel.style.cssText = app.applyComponentVariant('panel', 'custom');
    newPanel.innerHTML = `<h2 style="${app.UI_COMPONENTS.panel.header}"><span>選擇遠端匯入資料</span><button id="close-remote-import-panel" style="${app.UI_COMPONENTS.closeButton.white}">X</button></h2><div style="padding:5px 20px;display:flex;align-items:center;gap:8px;font-size:13px;"><span>競標</span><input type="number" id="auction-duration-input" placeholder="14" min="1" max="90" style="width:50px;padding:2px 4px;border:1px solid #ddd;border-radius:3px;" value="14"><span>天 (預設14)</span></div><input type="text" id="remote-panel-search" placeholder="輸入名稱或價格搜尋" style="${app.UI_COMPONENTS.input.search}"><div id="remote-import-list-container"></div>`;
    const listContainer = newPanel.querySelector('#remote-import-list-container');
    files.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    files.forEach((fileInfo, i) => {
      const div = document.createElement('div');
      div.style = `padding:10px;border-bottom:1px solid #eee;font-size:14px;background-color:${i % 2 === 0 ? '#fff' : '#f0f2f5'};`;
      div.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;"><strong>${fileInfo.title || '未命名'}</strong><button class="import-single-remote-btn" style="${app.applyComponentVariant('button', 'default', 'success')}">匯入</button></div><div style="color:#666;font-size:13px;margin-top:4px;">價格: ${fileInfo.price} | 日期: ${fileInfo.date.split(' ')[0]}</div>`;
      const importBtn = div.querySelector('.import-single-remote-btn');
      if (importBtn) importBtn.onclick = () => handleSingleRemoteImport(fileInfo);
      listContainer.appendChild(div);
    });
    document.body.appendChild(newPanel);
    document.getElementById('close-remote-import-panel').onclick = () => newPanel.remove();

    const durationInput = document.getElementById('auction-duration-input');
    if (durationInput) {
      durationInput.oninput = (e) => {
        const value = parseInt(e.target.value);
        if (isNaN(value) || value < 1 || value > 90) {
          e.target.style.borderColor = '#ff4757';
          e.target.title = '請輸入1-90之間的數字';
        } else {
          e.target.style.borderColor = '#2ed573';
          e.target.title = '';
        }
      };
    }
    document.getElementById('remote-panel-search').onkeyup = (e) => {
      const inputValue = e.target.value.trim().toLowerCase();
      listContainer.querySelectorAll('div[data-title]').forEach(item => {
        const title = item.dataset.title.toLowerCase();
        const price = item.dataset.price.toLowerCase();
        item.style.display = (title.includes(inputValue) || price.includes(inputValue)) ? '' : 'none';
      });
    };
  }

  async function handleSingleRemoteImport(fileInfo) {
    const progressDiv = createCancellableProgress(fileInfo.title);
    const progressText = progressDiv.querySelector('.progress-text');
    const progressFill = progressDiv.querySelector('.progress-fill');
    try {
      progressText.textContent = '正在下載檔案...';
      progressFill.style.width = '10%';
      const baseUrl = app.getCurrentWebhookUrl().split('?')[0];
      const downloadUrl = `${baseUrl}?action=download&file=${fileInfo.filename}`;
      const fileContentResponse = await fetch(downloadUrl);
      if (!fileContentResponse.ok) throw new Error(`無法下載檔案: ${fileContentResponse.statusText}`);
      const jsonData = await fileContentResponse.json();
      progressFill.style.width = app.APP_CONSTANTS.UI_COMPONENTS.PROGRESS.INITIAL;
      if (jsonData.Photos && Array.isArray(jsonData.Photos) && jsonData.Photos.length > 0) {
        const processedPhotos = [];
        for (let i = 0; i < jsonData.Photos.length; i++) {
          progressText.textContent = `處理圖片中... ${i + 1}/${jsonData.Photos.length}`;
          progressFill.style.width = `${app.APP_CONSTANTS.UI_COMPONENTS.PROGRESS.PROCESSING_BASE + Math.round(((i+1) / jsonData.Photos.length) * app.APP_CONSTANTS.UI_COMPONENTS.PROGRESS.PROCESSING_RANGE)}%`;
          const photo = jsonData.Photos[i];
          if (photo.Photo && photo.Photo.startsWith('data:image')) {
            const imageFile = app.optimizedBase64ToFile(photo.Photo, photo.filename || `image_${i + 1}.jpg`);
            const uploadResult = await app.uploadImage(imageFile);
            processedPhotos.push({ ...photo, Photo: uploadResult.FilePath || uploadResult, uploaded: true });
          } else { processedPhotos.push(photo); }
          await new Promise(resolve => setTimeout(resolve, app.APP_CONSTANTS.TIMING.API_RETRY_DELAY));
        }
        jsonData.Photos = processedPhotos;
      }
      progressText.textContent = '更新日期資訊...';
      progressFill.style.width = '85%';
      const now = new Date();
      const createDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const durationInput = document.getElementById('auction-duration-input');
      let customDuration = app.APP_CONSTANTS.BUSINESS.DEFAULT_AUCTION_DURATION_DAYS;
      if (durationInput) {
        const inputValue = parseInt(durationInput.value);
        customDuration = (inputValue >= 1 && inputValue <= 90) ? inputValue : app.APP_CONSTANTS.BUSINESS.DEFAULT_AUCTION_DURATION_DAYS;
      }
      const modifyDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + customDuration, 0, 0, 0, 0);
      const formatDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T00:00:00.00`;
      jsonData.StartDate = formatDate(createDate);
      jsonData.EndDate = formatDate(modifyDate);
      progressText.textContent = '正在送出資料...';
      progressFill.style.width = app.APP_CONSTANTS.UI_COMPONENTS.PROGRESS.FINAL;
      await app.directSubmitToAPI(jsonData);
      progressText.textContent = '匯入完成！';
      progressFill.style.width = app.APP_CONSTANTS.UI_COMPONENTS.PROGRESS.COMPLETE;
      setTimeout(() => progressDiv.remove(), app.APP_CONSTANTS.TIMING.PROGRESS_CLEANUP_DELAY);
    } catch (error) {
      progressDiv.remove();
      app.ERROR_HANDLER.handle(error, 'remote-import', { fallbackMessage: `匯入檔案 ${fileInfo.title} 失敗` });
    }
  }

  function createCancellableProgress(title) {
    const div = document.createElement('div');
    div.innerHTML = `<div class="progress-modal" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:10000;min-width:300px;text-align:center;"><h3 style="margin:0 0 15px 0;color:#007baf;">處理中: ${title}</h3><div class="progress-bar" style="width:100%;height:20px;background:#f0f0f0;border-radius:10px;margin:15px 0;overflow:hidden;"><div class="progress-fill" style="height:100%;background:#007baf;width:0%;transition:width 0.3s;"></div></div><p class="progress-text" style="margin:10px 0;font-size:14px;color:#666;">準備中...</p><button class="cancel-btn" onclick="this.parentElement.parentElement.remove()" style="background:#dc3545;color:white;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;margin-top:10px;font-size:12px;">取消</button></div>`;
    document.body.appendChild(div);
    return div;
  }

  app.handleRemoteQuickImport = handleRemoteQuickImport;

})(window.FurnitureHelper = window.FurnitureHelper || {});

