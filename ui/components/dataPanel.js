
((app) => {
  /**
   * 取得競標狀態HTML - 重構為使用統一狀態機
   * @param {Object} item - 商品物件
   * @returns {string} 競標狀態HTML
   */
  function getBidStatusHTML(item) {
    return app.BID_STATUS_SYSTEM.generateBidDisplay(item, 'inline');
  }

  function buildPanel(data = []) {
    const panelId = 'furniture-panel';
    const existingPanel = document.getElementById(panelId);
    if (existingPanel) existingPanel.remove();

    // 移除舊的拖曳邊框 (如果存在)
    const existingHandle = document.getElementById('furniture-panel-resize-handle');
    if (existingHandle) existingHandle.remove();

    // 讀取儲存的寬度偏好
    const savedWidth = localStorage.getItem('furniture-panel-width') || '450';
    const panelWidth = Math.max(350, Math.min(800, parseInt(savedWidth)));

    const newPanel = document.createElement('div');
    newPanel.id = panelId;
    newPanel.style.cssText = app.applyComponentVariant('panel', 'default') + `width: ${panelWidth}px;`;

    // 建立拖曳邊框
    const resizeHandle = document.createElement('div');
    resizeHandle.id = 'furniture-panel-resize-handle';
    resizeHandle.style.cssText = `
      position: fixed;
      right: ${panelWidth - 5}px;
      top: 80px;
      width: 5px;
      height: calc(100% - 100px);
      cursor: ew-resize;
      background: transparent;
      z-index: 100000;
    `;
    resizeHandle.title = '拖曳調整寬度 | 雙擊重置';

    // 拖曳邏輯
    let isResizing = false;
    let startX = 0;
    let startWidth = 0;

    resizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startX = e.clientX;
      startWidth = newPanel.offsetWidth;
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const deltaX = startX - e.clientX; // 反向,因為 panel 在右側
      const newWidth = Math.max(350, Math.min(800, startWidth + deltaX));
      newPanel.style.width = `${newWidth}px`;
      resizeHandle.style.right = `${newWidth - 5}px`; // 同步更新拖曳邊框位置
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        // 儲存寬度偏好
        localStorage.setItem('furniture-panel-width', newPanel.offsetWidth);
      }
    });

    // 雙擊重置
    resizeHandle.addEventListener('dblclick', () => {
      newPanel.style.width = '450px';
      resizeHandle.style.right = '445px'; // 450 - 5
      localStorage.setItem('furniture-panel-width', '450');
      app.showNotification('Panel 寬度已重置為 450px', 'info');
    });

    const header = document.createElement('h2');
    header.style.cssText = app.UI_COMPONENTS.panel.header;

    const titleSpan = document.createElement('span');
    titleSpan.textContent = '匯出家具資料';

    const closeButton = document.createElement('button');
    closeButton.id = 'close-panel';
    closeButton.textContent = 'X';
    closeButton.style.cssText = 'background: none; border: none; color: white; font-size: 16px; cursor: pointer;';
    closeButton.onclick = () => {
      newPanel.remove();
      resizeHandle.remove();
    };

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

    // 列印按鈕
    const printBtn = document.createElement('button');
    printBtn.textContent = '列印';
    printBtn.style.cssText = app.applyComponentVariant('button', 'default', 'primary') + 'font-size: 12px; padding: 4px 10px;';
    printBtn.onclick = () => {
      const selectedItems = getSelectedItems();
      if (selectedItems.length === 0) {
        app.showNotification('請至少選擇一個項目', 'warning');
        return;
      }
      printSelectedItems(selectedItems);
    };

    // 得標者分組按鈕
    let isSortedByWinner = false; // 排序狀態
    const sortByWinnerBtn = document.createElement('button');
    sortByWinnerBtn.textContent = '得標者分組';
    sortByWinnerBtn.style.cssText = app.applyComponentVariant('button', 'default', 'secondary') + 'font-size: 12px; padding: 4px 10px;';
    sortByWinnerBtn.onclick = () => {
      isSortedByWinner = !isSortedByWinner;
      sortByWinnerBtn.textContent = isSortedByWinner ? '恢復原始排序' : '得標者分組';
      sortByWinnerBtn.style.cssText = app.applyComponentVariant('button', 'default', isSortedByWinner ? 'primary' : 'secondary') + 'font-size: 12px; padding: 4px 10px;';
      renderItems();
    };

    selectAllContainer.appendChild(selectAllBtn);
    selectAllContainer.appendChild(selectNoneBtn);
    selectAllContainer.appendChild(selectNoBidsBtn);
    selectAllContainer.appendChild(printBtn);
    selectAllContainer.appendChild(sortByWinnerBtn);

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

    function printSelectedItems(items) {
      // 構建列印內容
      let printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>列印家具清單</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 8px; margin: 0; }
            h1 { text-align: center; color: #4A90E2; margin: 8px 0 12px 0; font-size: 18px; }
            .container { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .item {
              page-break-inside: avoid;
              border: 1px solid #ddd;
              padding: 8px;
              background: #fff;
              min-height: 145px;
            }
            .item-header {
              font-size: 13px;
              font-weight: bold;
              margin-bottom: 4px;
              color: #4A90E2;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .item-info { font-size: 11px; color: #666; margin-bottom: 6px; }
            .photos { display: flex; gap: 6px; justify-content: center; }
            .photo-wrapper { text-align: center; flex: 1; }
            .photo-wrapper img {
              width: 100%;
              max-width: 120px;
              height: 95px;
              object-fit: cover;
              border: 1px solid #ddd;
              border-radius: 3px;
            }
            .photo-label { font-size: 9px; color: #999; margin-top: 2px; }
            .no-photos { color: #999; font-style: italic; font-size: 11px; text-align: center; }
            @media print {
              body { padding: 5px; }
              .item { page-break-inside: avoid; }
              @page { margin: 10mm; }
            }
          </style>
        </head>
        <body>
          <h1>家具清單</h1>
          <div class="container">
      `;

      items.forEach(item => {
        printContent += `
          <div class="item">
            <div class="item-header">${item.Name || '未命名'}</div>
            <div class="item-info">編號: ${item.AutoID}</div>
            <div class="photos">
        `;

        // 取前兩張照片
        if (item.Photos && Array.isArray(item.Photos) && item.Photos.length > 0) {
          const photosToShow = item.Photos.slice(0, 2);
          photosToShow.forEach((photo, index) => {
            const photoUrl = photo.Photo.startsWith('http') ? photo.Photo : location.origin + photo.Photo;
            printContent += `
              <div class="photo-wrapper">
                <img src="${photoUrl}" alt="照片 ${index + 1}">
                <div class="photo-label">照片 ${index + 1}</div>
              </div>
            `;
          });
        } else {
          printContent += `<div class="no-photos">無照片</div>`;
        }

        printContent += `
            </div>
          </div>
        `;
      });

      printContent += `
          </div>
        </body>
        </html>
      `;

      // 開啟新視窗並列印
      const printWindow = window.open('', '_blank');
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }

    // 建立項目容器（必須在搜尋框之前創建）
    const itemsContainer = document.createElement('div');
    itemsContainer.id = 'items-container';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'panel-search';
    searchInput.placeholder = '輸入 AutoID 搜尋';
    searchInput.style.cssText = app.UI_COMPONENTS.input.search;
    searchInput.onkeyup = (e) => {
      const inputValue = e.target.value.trim();
      const items = itemsContainer.querySelectorAll('[data-autoid]');
      if (!inputValue) {
        items.forEach(item => { item.style.background = ''; });
        return;
      }
      const targetItem = itemsContainer.querySelector(`[data-autoid="${inputValue}"]`);
      items.forEach(item => { item.style.background = ''; });
      if (targetItem) {
        app.safeScrollIntoView(targetItem, { behavior: 'smooth', block: 'center' });
        targetItem.style.background = '#e6f3ff';
        setTimeout(() => { if (targetItem) targetItem.style.background = ''; }, app.APP_CONSTANTS.TIMING.HIGHLIGHT_RESET_DELAY);
      }
    };
    newPanel.appendChild(searchInput);
    newPanel.appendChild(itemsContainer);

    // 排序函數（三層優先級）
    function sortByWinner(items) {
      return items.sort((a, b) => {
        // 判斷項目狀態
        const aHasWinner = !!(a.WinnerID || a.NickName);
        const bHasWinner = !!(b.WinnerID || b.NickName);
        const aIsBidding = !aHasWinner && (a.HasBids || a.Bidder);
        const bIsBidding = !bHasWinner && (b.HasBids || b.Bidder);

        // 第一層：已得標 > 競標中 > 無競標
        if (aHasWinner && !bHasWinner) return -1;
        if (!aHasWinner && bHasWinner) return 1;
        if (aIsBidding && !bIsBidding && !bHasWinner) return -1;
        if (!aIsBidding && bIsBidding && !aHasWinner) return 1;

        // 第二層：相同狀態下，按得標者/競標者分組
        if (aHasWinner && bHasWinner) {
          const aWinner = String(a.WinnerID || a.NickName || '');
          const bWinner = String(b.WinnerID || b.NickName || '');
          if (aWinner === bWinner) {
            return a.AutoID - b.AutoID; // 相同得標者，按 AutoID 排序
          }
          return aWinner.localeCompare(bWinner, 'zh-TW'); // 不同得標者，按暱稱排序
        }

        // 第三層：競標中和無競標，按 AutoID 排序
        return b.AutoID - a.AutoID;
      });
    }

    // 渲染項目函數
    function renderItems() {
      // 清空容器
      itemsContainer.innerHTML = '';

      // 複製並排序資料
      let sortedData = [...data];
      if (isSortedByWinner) {
        sortedData = sortByWinner(sortedData);
      } else {
        sortedData.sort((a, b) => b.AutoID - a.AutoID);
      }

      let previousState = null; // 追蹤前一個項目的狀態

      sortedData.forEach((item, i) => {
        // 如果是按得標者排序，添加狀態分隔線
        if (isSortedByWinner) {
          const hasWinner = !!(item.WinnerID || item.NickName);
          const isBidding = !hasWinner && (item.HasBids || item.Bidder);
          const currentWinner = hasWinner ? String(item.WinnerID || item.NickName || '') : null;

          // 判斷當前項目的狀態
          let currentState;
          if (hasWinner) {
            currentState = `winner_${currentWinner}`;
          } else if (isBidding) {
            currentState = 'bidding';
          } else {
            currentState = 'noBids';
          }

          // 如果狀態改變，添加分隔線
          if (currentState !== previousState) {
            const divider = document.createElement('div');

            if (hasWinner) {
              // 藍色分隔線（有得標者）
              divider.style.cssText = `
                height: 3px;
                background: linear-gradient(90deg, #4A90E2 0%, #67A3E8 100%);
                margin: ${previousState === null ? '0' : '8px'} 0 8px 0;
                border-radius: 2px;
              `;
            } else if (isBidding) {
              // 橙色分隔線（競標中）
              divider.style.cssText = `
                height: 3px;
                background: linear-gradient(90deg, #FF9800 0%, #FFB74D 100%);
                margin: 8px 0;
                border-radius: 2px;
              `;
            } else {
              // 灰色分隔線（無競標）
              divider.style.cssText = `
                height: 3px;
                background: linear-gradient(90deg, #999 0%, #bbb 100%);
                margin: 8px 0;
                border-radius: 2px;
              `;
            }

            itemsContainer.appendChild(divider);
            previousState = currentState;
          }
        }

        const originalIndex = data.findIndex(d => d.AutoID === item.AutoID);

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
        itemCheckbox.dataset.itemIndex = originalIndex;
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
        packageBtn.dataset.index = originalIndex;
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
            packageBtn.style.background = '#4A90E2';
          }
        };

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-btn';
        downloadBtn.style.cssText = app.applyComponentVariant('button', 'default', 'success') + 'width: 20px; padding: 4px;';
        downloadBtn.dataset.index = originalIndex;
        downloadBtn.innerHTML = '&nbsp;';
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
        bottomRow.style.cssText = 'color: #666; font-size: 13px; margin-top: 4px; overflow: hidden; text-overflow: ellipsis;';

        // 日期格式化函數：只顯示月/日
        const formatMonthDay = (dateStr) => {
          if (!dateStr) return '無';
          const parts = dateStr.split('T')[0].split('-');
          if (parts.length === 3) {
            return `${parts[1]}/${parts[2]}`;
          }
          return '無';
        };

        // 構建資訊陣列
        const trackCountText = item.TrackCount > 0
          ? `<span style="color: #dc3545; font-weight: 600;">追蹤: ${item.TrackCount}</span>`
          : `追蹤: 0`;

        const infoItems = [
          `ID: ${item.AutoID}`,
          `建立: ${formatMonthDay(item.CreateDate)}`,
          `結束: ${formatMonthDay(item.EndDate)}`,
          trackCountText,
          app.ITEM_STATUS_SYSTEM.generateStatusHTML(item.IsPay, item.IsGet),
          getBidStatusHTML(item)
        ];

        bottomRow.innerHTML = infoItems.join(' | ');

        div.appendChild(topRow);
        div.appendChild(bottomRow);
        itemsContainer.appendChild(div);
      });

      updateSelectedCount();
    }

    // 初始渲染
    renderItems();
    document.body.appendChild(newPanel);
    document.body.appendChild(resizeHandle); // 附加到 body,確保 fixed 定位正確
  }

  app.buildPanel = buildPanel;
})(window.FurnitureHelper = window.FurnitureHelper || {});
