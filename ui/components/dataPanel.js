
((app) => {
  /**
   * 取得競標狀態HTML - 重構為使用統一狀態機
   * @param {Object} item - 商品物件
   * @returns {string} 競標狀態HTML
   */
  function getBidStatusHTML(item) {
    return app.BID_STATUS_SYSTEM.generateBidDisplay(item, 'block');
  }

  function buildPanel(data = []) {
    const panelId = 'furniture-panel';
    const existingPanel = document.getElementById(panelId);
    if (existingPanel) existingPanel.remove();

    const newPanel = document.createElement('div');
    newPanel.id = panelId;
    newPanel.style.cssText = app.applyComponentVariant('panel', 'default');

    const header = document.createElement('h2');
    header.style.cssText = app.UI_COMPONENTS.panel.header;

    const titleSpan = document.createElement('span');
    titleSpan.textContent = '匯出家具資料';

    const closeButton = document.createElement('button');
    closeButton.id = 'close-panel';
    closeButton.textContent = 'X';
    closeButton.style.cssText = 'background: none; border: none; color: white; font-size: 16px; cursor: pointer;';
    closeButton.onclick = () => newPanel.remove();

    header.appendChild(titleSpan);
    header.appendChild(closeButton);
    newPanel.appendChild(header);

    const batchControlsContainer = document.createElement('div');
    batchControlsContainer.style.cssText = 'padding: 10px; background: #f8f9fa; border-bottom: 1px solid #dee2e6; display: flex; flex-direction: column; gap: 10px;';

    const selectAllContainer = document.createElement('div');
    selectAllContainer.style.cssText = 'display: flex; align-items: center; gap: 8px; flex-wrap: wrap;';

    // 全選按鈕
    const selectAllBtn = document.createElement('button');
    selectAllBtn.textContent = '全選';
    selectAllBtn.style.cssText = app.applyComponentVariant('button', 'default', 'primary') + 'font-size: 12px; padding: 4px 10px;';
    selectAllBtn.onclick = () => {
      const itemCheckboxes = newPanel.querySelectorAll('.item-checkbox');
      itemCheckboxes.forEach(cb => cb.checked = true);
      updateSelectedCount();
    };

    // 全不選按鈕
    const selectNoneBtn = document.createElement('button');
    selectNoneBtn.textContent = '全不選';
    selectNoneBtn.style.cssText = app.applyComponentVariant('button', 'default', 'secondary') + 'font-size: 12px; padding: 4px 10px;';
    selectNoneBtn.onclick = () => {
      const itemCheckboxes = newPanel.querySelectorAll('.item-checkbox');
      itemCheckboxes.forEach(cb => cb.checked = false);
      updateSelectedCount();
    };

    // 只選無競標按鈕
    const selectNoBidsBtn = document.createElement('button');
    selectNoBidsBtn.textContent = '只選無競標';
    selectNoBidsBtn.style.cssText = app.applyComponentVariant('button', 'default', 'warning') + 'font-size: 12px; padding: 4px 10px;';
    selectNoBidsBtn.onclick = () => {
      const itemCheckboxes = newPanel.querySelectorAll('.item-checkbox');
      itemCheckboxes.forEach(cb => {
        const item = JSON.parse(cb.dataset.itemData);
        const bidState = app.BID_STATUS_SYSTEM.determineState(item);
        cb.checked = bidState === 'noBids';
      });
      updateSelectedCount();
    };

    selectAllContainer.appendChild(selectAllBtn);
    selectAllContainer.appendChild(selectNoneBtn);
    selectAllContainer.appendChild(selectNoBidsBtn);

    const selectedCountSpan = document.createElement('div');
    selectedCountSpan.id = 'selected-count';
    selectedCountSpan.textContent = `已選 0 項`;
    selectedCountSpan.style.cssText = 'color: #6c757d; font-size: 13px; font-weight: 600;';

    const actionsContainer = document.createElement('div');
    actionsContainer.style.cssText = 'display: flex; gap: 10px;';

    const batchExportBtn = document.createElement('button');
    batchExportBtn.textContent = '批次匯出';
    batchExportBtn.style.cssText = app.applyComponentVariant('button', 'default', 'primary') + 'font-weight: bold;';
    batchExportBtn.onclick = () => {
      const selectedItems = getSelectedItems();
      if (selectedItems.length === 0) {
        app.showNotification('請至少選擇一個項目', 'warning');
        return;
      }
      app.showDownloadSettingsWarning(() => {
        app.downloadMultipleFiles(selectedItems);
      });
    };

    const batchImportBtn = document.createElement('button');
    batchImportBtn.textContent = '批次匯入';
    batchImportBtn.style.cssText = app.applyComponentVariant('button', 'default', 'success') + 'font-weight: bold;';
    batchImportBtn.onclick = () => app.showImportModal();

    const batchDeleteBtn = document.createElement('button');
    batchDeleteBtn.textContent = '批次刪除';
    batchDeleteBtn.style.cssText = app.applyComponentVariant('button', 'default', 'danger') + 'font-weight: bold;';
    batchDeleteBtn.onclick = () => {
      const selectedItems = getSelectedItems();
      if (selectedItems.length === 0) {
        app.showNotification('請至少選擇一個項目進行刪除', 'warning');
        return;
      }
      app.showDeleteConfirmationModal(selectedItems);
    };

    actionsContainer.appendChild(batchExportBtn);
    actionsContainer.appendChild(batchImportBtn);
    actionsContainer.appendChild(batchDeleteBtn);

    batchControlsContainer.appendChild(selectAllContainer);
    batchControlsContainer.appendChild(selectedCountSpan);
    batchControlsContainer.appendChild(actionsContainer);
    newPanel.appendChild(batchControlsContainer);

    function updateSelectedCount() {
      const itemCheckboxes = newPanel.querySelectorAll('.item-checkbox');
      const checkedCount = Array.from(itemCheckboxes).filter(cb => cb.checked).length;
      selectedCountSpan.textContent = `已選 ${checkedCount} 項`;
    }

    function getSelectedItems() {
      const selectedItems = [];
      const itemCheckboxes = newPanel.querySelectorAll('.item-checkbox:checked');
      itemCheckboxes.forEach(cb => {
        const itemIndex = parseInt(cb.dataset.itemIndex);
        selectedItems.push(data[itemIndex]);
      });
      return selectedItems;
    }

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'panel-search';
    searchInput.placeholder = '輸入 AutoID 搜尋';
    searchInput.style.cssText = app.UI_COMPONENTS.input.search;
    searchInput.onkeyup = (e) => {
      const inputValue = e.target.value.trim();
      const items = newPanel.querySelectorAll('[data-autoid]');
      if (!inputValue) {
        items.forEach(item => { item.style.background = ''; });
        return;
      }
      const targetItem = newPanel.querySelector(`[data-autoid="${inputValue}"]`);
      items.forEach(item => { item.style.background = ''; });
      if (targetItem) {
        app.safeScrollIntoView(targetItem, { behavior: 'smooth', block: 'center' });
        targetItem.style.background = '#e6f3ff';
        setTimeout(() => { if(targetItem) targetItem.style.background = ''; }, app.APP_CONSTANTS.TIMING.HIGHLIGHT_RESET_DELAY);
      }
    };
    newPanel.appendChild(searchInput);

    data.sort((a, b) => b.AutoID - a.AutoID);
    data.forEach((item, i) => {
      const div = document.createElement('div');
      div.dataset.autoid = item.AutoID;
      div.style = `padding: 10px; border-bottom: 1px solid #eee; font-size: 14px; background-color: ${i % 2 === 0 ? '#ffffff' : '#f0f2f5'};`;

      const topRow = document.createElement('div');
      topRow.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';

      const leftContainer = document.createElement('div');
      leftContainer.style.cssText = 'display: flex; align-items: center; gap: 8px; flex-grow: 1;';

      const itemCheckbox = document.createElement('input');
      itemCheckbox.type = 'checkbox';
      itemCheckbox.className = 'item-checkbox';
      const bidState = app.BID_STATUS_SYSTEM.determineState(item);
      // 只勾選「無競標」狀態，其他都不勾選
      itemCheckbox.checked = bidState === 'noBids';
      itemCheckbox.dataset.itemIndex = i;
      itemCheckbox.dataset.itemData = JSON.stringify(item);
      itemCheckbox.style.cssText = 'transform: scale(1.1);';
      itemCheckbox.onchange = () => updateSelectedCount();

      const nameContainer = document.createElement('span');
      const photoIcon = document.createElement('span');
      photoIcon.className = 'photo-preview-icon';
      photoIcon.style.cursor = 'pointer';
      photoIcon.textContent = '[IMG]';
      photoIcon.onclick = () => app.showPhotoPreview(item.Photos);

      const nameStrong = document.createElement('strong');
      nameStrong.textContent = ` ${item.Name || '未命名'}`;

      nameContainer.appendChild(photoIcon);
      nameContainer.appendChild(nameStrong);

      leftContainer.appendChild(itemCheckbox);
      leftContainer.appendChild(nameContainer);

      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = 'display: flex; gap: 5px; flex-shrink: 0;';

      const packageBtn = document.createElement('button');
      packageBtn.className = 'package-download-btn';
      packageBtn.style.cssText = app.applyComponentVariant('button', 'default', 'primary');
      packageBtn.dataset.index = i;
      packageBtn.textContent = 'PACK';
      packageBtn.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const { Photos, ...restOfItem } = item;
        packageBtn.textContent = '處理中...';
        packageBtn.disabled = true;
        packageBtn.style.background = '#6c757d';
        try {
          const photosWithBase64 = [];
          if (Photos && Array.isArray(Photos) && Photos.length > 0) {
            for (const photo of Photos) {
              const photoUrl = photo.Photo.startsWith('http') ? photo.Photo : location.origin + photo.Photo;
              try {
                const base64 = await app.convertImageToBase64(photoUrl);
                photosWithBase64.push({ ...photo, Photo: base64, PhotoUrl: photoUrl });
              } catch (error) {
                photosWithBase64.push({ ...photo, PhotoUrl: photoUrl, Error: '圖片轉換失敗' });
              }
            }
          }
          const dataToExport = { ...restOfItem, Photos: photosWithBase64, ExportInfo: { ExportDate: new Date().toISOString(), ExportType: 'PackageDownload' } };
          const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${item.Name || `item_${item.AutoID}`}_package.json`;
          a.click();
          URL.revokeObjectURL(url);
        } catch (error) {
          app.ERROR_HANDLER.handle(error, 'file-processing', { fallbackMessage: '打包下載失敗，請稍後再試' });
        } finally {
          packageBtn.textContent = 'PACK';
          packageBtn.disabled = false;
          packageBtn.style.background = '#007baf';
        }
      };

      const downloadBtn = document.createElement('button');
      downloadBtn.className = 'download-btn';
      downloadBtn.style.cssText = app.applyComponentVariant('button', 'default', 'success');
      downloadBtn.dataset.index = i;
      downloadBtn.textContent = 'DL';
      downloadBtn.onclick = () => {
        const { Photos, ...restOfItem } = item;
        const blob = new Blob([JSON.stringify(restOfItem, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${item.Name || `item_${item.AutoID}`}.json`;
        a.click();
        URL.revokeObjectURL(url);
        (Photos || []).forEach((p, j) => {
          const imgA = document.createElement('a');
          imgA.href = p.Photo.startsWith('http') ? p.Photo : location.origin + p.Photo;
          imgA.download = `${item.Name || `item_${item.AutoID}`}_${j + 1}.jpg`;
          imgA.click();
        });
      };

      buttonContainer.appendChild(packageBtn);
      buttonContainer.appendChild(downloadBtn);

      topRow.appendChild(leftContainer);
      topRow.appendChild(buttonContainer);

      const bottomRow = document.createElement('div');
      bottomRow.style.cssText = 'color: #666; font-size: 13px; margin-top: 4px;';
      bottomRow.innerHTML = `ID: ${item.AutoID} | 日期: ${(item.CreateDate || '').split('T')[0]} ${getBidStatusHTML(item)}`;

      div.appendChild(topRow);
      div.appendChild(bottomRow);
      newPanel.appendChild(div);
    });

    updateSelectedCount();
    document.body.appendChild(newPanel);
  }

  app.buildPanel = buildPanel;
})(window.FurnitureHelper = window.FurnitureHelper || {});
