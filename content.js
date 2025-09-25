(function () {

  // ===================================================================
  // 依賴檔案: constants.js, utils.js, api.js
  // 此檔案依賴以上三個檔案提供的全域變數和函數
  // ===================================================================

  // 注入 inject.js 到頁面
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('inject.js');
  document.documentElement.appendChild(script);


  // 訊息處理查找表
  const messageHandlers = {
    'vue-stats': (msg) => {
      if (!msg.hierarchicalStats) {
        showNotification('數據格式錯誤', 'error');
        return;
      }
      showHierarchicalModal(msg.hierarchicalStats);
    },
    'vue-panel-data': (msg) => buildPanel(msg.data || []),
    'vue-print': (msg) => printTable(msg.data || []),
    'vue-panel-for-print': (msg) => {
      hidePrintProgress(); // 完成時隱藏進度條
      printTable(msg.data || []);
    },
    'print-progress': (msg) => updatePrintProgress(msg.current, msg.total, msg.detail)
  };

  window.addEventListener('message', event => {
    if (event.source !== window || event.origin !== window.location.origin) return;
    
    const msg = event.data;
    if (!msg || !msg.source) {
      console.error('無效的消息格式', msg);
      return;
    }

    const handler = messageHandlers[msg.source];
    if (handler) {
      handler(msg);
    }
  });

  // 新的階層式統計顯示函數
  function showHierarchicalModal(hierarchicalStats) {
    let modal = document.getElementById('vue-stats-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'vue-stats-modal';

      // 使用變體系統：統計模態框變體
      modal.style.cssText = applyComponentVariant('modal', 'stats');
      modal.innerHTML = `
        <span style="${UI_COMPONENTS.closeButton.base}"
              onclick="this.parentNode.style.display='none'">X</span>
        <h3 style="font-size:24px; margin-top:0; text-align:center; color:#333;">📊 統計資料總覽</h3>
        <div style="text-align: center; margin-bottom: 20px; padding: 0 20px;">
          <label style="margin-right: 20px; font-size: 14px; color: #333;">
            <input type="radio" name="stats-mode" value="detailed" checked style="margin-right: 5px;">
            詳細樹狀
          </label>
          <label style="font-size: 14px; color: #333;">
            <input type="radio" name="stats-mode" value="quarterly" style="margin-right: 5px;">
            季報摘要
          </label>
        </div>
        <div style="max-height: 70vh; overflow-y: auto; padding: 10px;">
          <div id="hierarchical-stats-container"></div>
        </div>
      `;
      document.body.appendChild(modal);
    } else {
      // Modal 已存在，重置單選按鈕狀態為預設值
      const detailedRadio = modal.querySelector('input[value="detailed"]');
      const quarterlyRadio = modal.querySelector('input[value="quarterly"]');
      if (detailedRadio) detailedRadio.checked = true;
      if (quarterlyRadio) quarterlyRadio.checked = false;
    }

    const container = modal.querySelector('#hierarchical-stats-container');

    // 渲染統計內容的函數
    function renderStatsContent(mode) {
      container.innerHTML = '';

      if (mode === 'quarterly') {
        // 季報摘要模式
        if (hierarchicalStats.createDate) {
          const createDateSection = generateQuarterlyView(hierarchicalStats.createDate, '📅 建立時間分布', '#007baf');
          container.appendChild(createDateSection);
        }

        if (hierarchicalStats.endDate) {
          const endDateSection = generateQuarterlyView(hierarchicalStats.endDate, '🎯 競標結束時間分布', '#ff6b35');
          container.appendChild(endDateSection);
        }
      } else {
        // 詳細樹狀模式 (原有功能)
        if (hierarchicalStats.createDate) {
          const createDateSection = createStatsTree(hierarchicalStats.createDate, '📅 建立時間分布 (CreateDate)', '#007baf');
          container.appendChild(createDateSection);
        }

        if (hierarchicalStats.endDate) {
          const endDateSection = createStatsTree(hierarchicalStats.endDate, '🎯 競標結束時間分布 (EndDate)', '#ff6b35');
          container.appendChild(endDateSection);
        }
      }
    }

    // 綁定模式切換事件
    const modeRadios = modal.querySelectorAll('input[name="stats-mode"]');
    modeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        renderStatsContent(e.target.value);
      });
    });

    // 初始渲染 (總是從詳細樹狀模式開始)
    renderStatsContent('detailed');

    modal.style.display = 'block';
  }

  // ===================================================================
  // 統計樹系統 - 拆分200行怪獸函數，遵循單一職責原則
  // ===================================================================

  /**
   * 統計樹工廠 - 主函數，負責協調各個子元件
   * @param {Object} dateData - 日期統計資料
   * @param {string} title - 標題
   * @param {string} color - 主題顏色
   * @returns {HTMLElement} 統計樹DOM元素
   */
  function createStatsTree(dateData, title, color) {
    const section = createStatsSection(title, color);
    const content = section.querySelector('.stats-content');

    // 按年份排序並處理
    const sortedYears = Object.keys(dateData).sort((a, b) => b - a);
    sortedYears.forEach(year => {
      const yearSection = createYearSection(dateData[year], year, color);
      content.appendChild(yearSection);
    });

    return section;
  }

  /**
   * 創建統計區段基礎結構 - 單一職責：區段框架
   * @param {string} title - 區段標題
   * @param {string} color - 主題顏色
   * @returns {HTMLElement} 區段DOM元素
   */
  function createStatsSection(title, color) {
    const section = document.createElement('div');
    section.style.cssText = 'margin-bottom: 30px; border: 1px solid #e0e0e0; border-radius: 8px; background: #f8f9fa;';

    const header = document.createElement('div');
    header.style.cssText = `background: ${color}; color: white; padding: 12px; font-size: 16px; font-weight: bold; border-radius: 7px 7px 0 0; cursor: pointer;`;
    header.innerHTML = `${title} <span class="section-toggle">▶</span>`;

    const content = document.createElement('div');
    content.className = 'stats-content';
    content.style.cssText = 'padding: 15px; display: none;';

    // 區段展開/收合邏輯
    header.onclick = () => {
      const isHidden = content.style.display === 'none';
      content.style.display = isHidden ? 'block' : 'none';
      header.querySelector('.section-toggle').textContent = isHidden ? '▼' : '▶';
    };

    section.appendChild(header);
    section.appendChild(content);
    return section;
  }

  /**
   * 創建年份區塊 - 單一職責：年份層級處理
   * @param {Object} yearData - 年份資料
   * @param {string} year - 年份
   * @param {string} color - 主題顏色
   * @returns {HTMLElement} 年份DOM元素
   */
  function createYearSection(yearData, year, color) {
    const yearDiv = document.createElement('div');
    yearDiv.style.cssText = 'margin-bottom: 15px; border-left: 3px solid #ddd; padding-left: 10px;';

    // 計算年度總計 - 使用輔助函數
    const yearTotal = calculateYearTotal(yearData);

    const yearHeader = document.createElement('div');
    yearHeader.style.cssText = 'font-weight: bold; font-size: 14px; color: #333; cursor: pointer; padding: 5px 0; user-select: none;';
    yearHeader.innerHTML = `<span class="toggle">▶</span> ${year}年: ${yearTotal}筆`;

    const yearContent = document.createElement('div');
    yearContent.style.cssText = 'margin-left: 15px; display: none;';

    // 年份展開/收合
    yearHeader.onclick = (e) => {
      e.stopPropagation();
      const isHidden = yearContent.style.display === 'none';
      yearContent.style.display = isHidden ? 'block' : 'none';
      yearHeader.querySelector('.toggle').textContent = isHidden ? '▼' : '▶';
    };

    // 按月份排序並處理
    const sortedMonths = Object.keys(yearData).sort((a, b) => b.localeCompare(a));
    sortedMonths.forEach(month => {
      const monthSection = createMonthSection(yearData[month], month, color);
      yearContent.appendChild(monthSection);
    });

    yearDiv.appendChild(yearHeader);
    yearDiv.appendChild(yearContent);
    return yearDiv;
  }

  /**
   * 計算年度總計 - 單一職責：統計計算
   * @param {Object} yearData - 年份資料
   * @returns {number} 年度總計
   */
  function calculateYearTotal(yearData) {
    let total = 0;
    Object.keys(yearData).forEach(month => {
      Object.keys(yearData[month]).forEach(day => {
        total += yearData[month][day].length;
      });
    });
    return total;
  }

  /**
   * 創建月份區塊 - 單一職責：月份層級處理
   * @param {Object} monthData - 月份資料
   * @param {string} month - 月份
   * @param {string} color - 主題顏色
   * @returns {HTMLElement} 月份DOM元素
   */
  function createMonthSection(monthData, month, color) {
    const monthDiv = document.createElement('div');
    monthDiv.style.cssText = 'margin-bottom: 10px; border-left: 2px solid #ccc; padding-left: 10px;';

    // 計算月度總計
    const monthTotal = Object.keys(monthData).reduce((total, day) => total + monthData[day].length, 0);

    const monthHeader = document.createElement('div');
    monthHeader.style.cssText = 'font-weight: 600; font-size: 13px; color: #555; cursor: pointer; padding: 3px 0; user-select: none;';
    monthHeader.innerHTML = `<span class="toggle">▶</span> ${month}: ${monthTotal}筆`;

    const monthContent = document.createElement('div');
    monthContent.style.cssText = 'margin-left: 15px; display: none;';

    // 月份展開/收合
    monthHeader.onclick = (e) => {
      e.stopPropagation();
      const isHidden = monthContent.style.display === 'none';
      monthContent.style.display = isHidden ? 'block' : 'none';
      monthHeader.querySelector('.toggle').textContent = isHidden ? '▼' : '▶';
    };

    // 按日期排序並處理
    const sortedDays = Object.keys(monthData).sort((a, b) => b.localeCompare(a));
    sortedDays.forEach(day => {
      const daySection = createDaySection(monthData[day], day, color);
      monthContent.appendChild(daySection);
    });

    monthDiv.appendChild(monthHeader);
    monthDiv.appendChild(monthContent);
    return monthDiv;
  }

  /**
   * 創建日期區塊 - 單一職責：日期層級處理
   * @param {Array} dayItems - 當日商品列表
   * @param {string} day - 日期
   * @param {string} color - 主題顏色
   * @returns {HTMLElement} 日期DOM元素
   */
  function createDaySection(dayItems, day, color) {
    const dayDiv = document.createElement('div');
    dayDiv.style.cssText = 'margin-bottom: 8px; padding-left: 10px;';

    const dayHeader = document.createElement('div');
    dayHeader.style.cssText = 'font-size: 12px; color: #666; cursor: pointer; padding: 2px 0; user-select: none;';
    dayHeader.innerHTML = `<span class="toggle">▶</span> ${day}: ${dayItems.length}筆`;

    const dayContent = document.createElement('div');
    dayContent.style.cssText = 'margin-left: 15px; display: none; max-height: 200px; overflow-y: auto;';

    // 日期展開/收合並顯示商品列表
    dayHeader.onclick = (e) => {
      e.stopPropagation();
      const isHidden = dayContent.style.display === 'none';
      if (isHidden && dayContent.innerHTML === '') {
        // 首次展開時載入商品列表
        const sortedItems = dayItems.sort((a, b) => b.AutoID - a.AutoID);
        sortedItems.forEach(item => {
          const itemElement = formatItemDisplay(item, color);
          dayContent.appendChild(itemElement);
        });
      }
      dayContent.style.display = isHidden ? 'block' : 'none';
      dayHeader.querySelector('.toggle').textContent = isHidden ? '▼' : '▶';
    };

    dayDiv.appendChild(dayHeader);
    dayDiv.appendChild(dayContent);
    return dayDiv;
  }

  /**
   * 格式化商品顯示 - 單一職責：商品項目渲染
   * @param {Object} item - 商品物件
   * @param {string} color - 主題顏色
   * @returns {HTMLElement} 商品DOM元素
   */
  function formatItemDisplay(item, color) {
    const itemDiv = document.createElement('div');
    itemDiv.style.cssText = 'font-size: 13px; color: #333; padding: 6px 10px; margin: 3px 0; background: #fff; border-radius: 4px; border-left: 3px solid ' + color + '; line-height: 1.2; font-family: monospace;';

    // 建立一行顯示的結構化內容
    const itemContainer = document.createElement('div');
    itemContainer.style.cssText = 'display: flex; align-items: center; gap: 12px;';

    // ID 欄位
    const idPart = document.createElement('span');
    idPart.style.cssText = 'min-width: 70px; font-weight: 600; color: #007baf;';
    idPart.textContent = `ID:${item.AutoID}`;

    // 商品名稱
    const namePart = document.createElement('span');
    namePart.style.cssText = 'flex: 1; font-weight: 500; word-wrap: break-word;';
    namePart.textContent = item.Name;

    // 狀態欄位 - 使用統一狀態系統
    const statusPart = document.createElement('span');
    statusPart.style.cssText = 'min-width: 80px; font-weight: 600; text-align: center;';
    statusPart.innerHTML = ITEM_STATUS_SYSTEM.generateStatusHTML(item.IsPay, item.IsGet);

    // 競標資訊 - 使用統一競標狀態機
    const bidPart = document.createElement('span');
    bidPart.style.cssText = 'min-width: 200px; font-size: 12px; white-space: nowrap;';
    bidPart.innerHTML = BID_STATUS_SYSTEM.generateBidDisplay(item, 'inline');

    // 應用容器背景樣式
    BID_STATUS_SYSTEM.applyContainerStyle(itemDiv, item);

    // 組裝所有部分
    itemContainer.appendChild(idPart);
    itemContainer.appendChild(namePart);
    itemContainer.appendChild(statusPart);
    itemContainer.appendChild(bidPart);

    itemDiv.appendChild(itemContainer);

    // 使用統一狀態系統應用樣式
    ITEM_STATUS_SYSTEM.applyStatusStyle(itemDiv, item.IsPay, item.IsGet);

    return itemDiv;
  }

  // 生成季報摘要視圖
  function generateQuarterlyView(dateData, title, color) {
    const section = document.createElement('div');
    section.style.cssText = 'margin-bottom: 30px; border: 1px solid #e0e0e0; border-radius: 8px; background: #f8f9fa;';

    const header = document.createElement('div');
    header.style.cssText = `background: ${color}; color: white; padding: 12px; font-size: 16px; font-weight: bold; border-radius: 7px 7px 0 0;`;
    header.textContent = title;

    const content = document.createElement('div');
    content.style.cssText = 'padding: 20px;';

    // 按年份排序（新的在前）
    const sortedYears = Object.keys(dateData).sort((a, b) => b - a);

    sortedYears.forEach(year => {
      const yearData = dateData[year];

      // 建立年份標題
      const yearHeader = document.createElement('div');
      yearHeader.style.cssText = 'font-size: 18px; font-weight: bold; color: #333; margin-bottom: 15px; margin-top: 20px;';
      yearHeader.textContent = `${year}年`;
      if (year === sortedYears[0]) yearHeader.style.marginTop = '0';

      // 計算年度總計
      let yearTotal = 0;
      Object.keys(yearData).forEach(month => {
        Object.keys(yearData[month]).forEach(day => {
          yearTotal += yearData[month][day].length;
        });
      });

      const yearTotalSpan = document.createElement('span');
      yearTotalSpan.style.cssText = 'font-size: 14px; color: #666; font-weight: normal; margin-left: 10px;';
      yearTotalSpan.textContent = `(總計: ${yearTotal}筆)`;
      yearHeader.appendChild(yearTotalSpan);

      // 建立月份資料網格
      const monthGrid = document.createElement('div');
      monthGrid.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;';

      // 按月份排序 (01-12)
      const sortedMonths = Object.keys(yearData).sort((a, b) => a.localeCompare(b));

      sortedMonths.forEach(month => {
        const monthData = yearData[month];

        // 計算月份總計
        let monthTotal = 0;
        Object.keys(monthData).forEach(day => {
          monthTotal += monthData[day].length;
        });

        const monthBox = document.createElement('div');
        monthBox.style.cssText = `
          background: white;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 12px;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        `;

        const monthLabel = document.createElement('div');
        monthLabel.style.cssText = 'font-size: 14px; color: #666; margin-bottom: 5px;';
        monthLabel.textContent = month;

        const monthCount = document.createElement('div');
        monthCount.style.cssText = `font-size: 20px; font-weight: bold; color: ${color};`;
        monthCount.textContent = `${monthTotal}筆`;

        monthBox.appendChild(monthLabel);
        monthBox.appendChild(monthCount);
        monthGrid.appendChild(monthBox);
      });

      content.appendChild(yearHeader);
      content.appendChild(monthGrid);
    });

    section.appendChild(header);
    section.appendChild(content);
    return section;
  }

  function exportToCSV(data = []) {
    const keys = ['AutoID', 'Name', 'DistName', 'CreateDate'];
    const headers = ['編號', '名稱', '行政區', '建立日期'];
    const rows = [headers.join(',')];
    data.sort((a, b) => b.AutoID - a.AutoID);
    data.forEach(row => {
      const line = keys.map(k => {
        const value = k === 'CreateDate' ? (row[k] ?? '').slice(0, 10) : (row[k] ?? '');
        return `"${value.toString().replace(/"/g, '""')}"`;
      }).join(',');
      rows.push(line);
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `furniture-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportAllToCSV(data = []) {
    const keys = ['AutoID', 'Name', 'CategoryName', 'DistName', 'CreateDate', 'Description', 'Length', 'Width', 'Height', 'DeliveryAddress', 'InitPrice', 'OriginPrice'];
    const headers = ['編號', '名稱', '類別', '行政區', '建立日期', '產品描述', '長', '寬', '高', '交貨地點', '起標價格', '原價'];
    const rows = [headers.join(',')];
    data.sort((a, b) => b.AutoID - a.AutoID);
    data.forEach(row => {
      const line = keys.map(k => {
        const value = k === 'CreateDate' ? (row[k] ?? '').slice(0, 10) : (row[k] ?? '');
        return `"${value.toString().replace(/"/g, '""')}"`;
      }).join(',');
      rows.push(line);
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `furniture-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function showPhotoPreview(photos) {
    let modal = document.getElementById('photo-preview-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'photo-preview-modal';

      // 使用變體系統：圖片預覽模態框變體
      modal.style.cssText = applyComponentVariant('modal', 'photo');
      modal.innerHTML = `
        <span style="${UI_COMPONENTS.closeButton.base}color:#666;"
              onclick="this.parentNode.style.display='none'">X</span>
        <h3 style="margin-top:0; margin-bottom:20px; color:#007baf; font-size:20px;">圖片預覽</h3>
        <div id="photo-preview-container" style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center;"></div>
      `;
      document.body.appendChild(modal);
    }

    const container = modal.querySelector('#photo-preview-container');
    container.innerHTML = '';
    if (photos && Array.isArray(photos) && photos.length > 0) {
      photos.forEach((photo, index) => {
        const imgWrapper = document.createElement('div');
        imgWrapper.style.cssText = `
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        `;
        
        const img = document.createElement('img');
        img.src = photo.Photo;
        img.style.cssText = `
          max-width: 400px;
          max-height: 400px;
          width: auto;
          height: auto;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          cursor: pointer;
        `;
        img.alt = `Photo ${index + 1}`;
        
        // 點擊圖片可以放大查看
        
        
        const imgLabel = document.createElement('div');
        imgLabel.textContent = `圖片 ${index + 1}`;
        imgLabel.style.cssText = `
          font-size: 12px;
          color: #666;
          font-weight: bold;
        `;
        
        imgWrapper.appendChild(img);
        imgWrapper.appendChild(imgLabel);
        container.appendChild(imgWrapper);
      });
    } else {
      container.innerHTML = '<p style="color:#666; font-size:16px;">無圖片可顯示</p>';
    }
    modal.style.display = 'block';
  }

  /**
   * 取得競標狀態HTML - 重構為使用統一狀態機
   * @param {Object} item - 商品物件
   * @returns {string} 競標狀態HTML
   */
  function getBidStatusHTML(item) {
    // 使用統一競標狀態機，零條件分支
    return BID_STATUS_SYSTEM.generateBidDisplay(item, 'block');
  }

  function buildPanel(data = []) {
    const panelId = 'furniture-panel';
    const existingPanel = document.getElementById(panelId);
    if (existingPanel) existingPanel.remove(); // 確保舊面板移除

    const newPanel = document.createElement('div');
    newPanel.id = panelId;
    // 使用變體系統：寬版面板變體（容納競標資訊）
    newPanel.style.cssText = applyComponentVariant('panel', 'wide');

    // --- 建立靜態頭部 ---
    const header = document.createElement('h2');
    header.style.cssText = UI_COMPONENTS.panel.header;

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

    // 批次操作控制區域
    const batchControlsContainer = document.createElement('div');
    batchControlsContainer.style.cssText = 'padding: 10px; background: #f8f9fa; border-bottom: 1px solid #dee2e6; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;';

    // 全選控制
    const selectAllContainer = document.createElement('div');
    selectAllContainer.style.cssText = 'display: flex; align-items: center; gap: 8px;';

    const selectAllCheckbox = document.createElement('input');
    selectAllCheckbox.type = 'checkbox';
    selectAllCheckbox.id = 'select-all-items';
    selectAllCheckbox.checked = true;
    selectAllCheckbox.style.cssText = 'transform: scale(1.2);';

    const selectAllLabel = document.createElement('label');
    selectAllLabel.htmlFor = 'select-all-items';
    selectAllLabel.textContent = '全選';
    selectAllLabel.style.cssText = 'font-weight: bold; cursor: pointer;';

    const selectedCountSpan = document.createElement('span');
    selectedCountSpan.id = 'selected-count';
    selectedCountSpan.textContent = `(已選 ${data.length} 項)`;
    selectedCountSpan.style.cssText = 'color: #6c757d; font-size: 14px;';

    selectAllContainer.appendChild(selectAllCheckbox);
    selectAllContainer.appendChild(selectAllLabel);
    selectAllContainer.appendChild(selectedCountSpan);

    // 操作按鈕容器
    const actionsContainer = document.createElement('div');
    actionsContainer.style.cssText = 'display: flex; gap: 10px;';

    // 批次匯出按鈕
    const batchExportBtn = document.createElement('button');
    batchExportBtn.textContent = '批次匯出';
    batchExportBtn.style.cssText = applyComponentVariant('button', 'default', 'primary') + 'font-weight: bold;';
    batchExportBtn.onclick = () => {
      const selectedItems = getSelectedItems();
      if (selectedItems.length === 0) {
        showNotification('請至少選擇一個項目', 'warning');
        return;
      }

      // 顯示下載設定警告，用戶確認後開始下載
      showDownloadSettingsWarning(() => {
        downloadMultipleFiles(selectedItems);
      });
    };

    // 批次匯入按鈕
    const batchImportBtn = document.createElement('button');
    batchImportBtn.textContent = '批次匯入';
    batchImportBtn.style.cssText = applyComponentVariant('button', 'default', 'success') + 'font-weight: bold;';
    batchImportBtn.onclick = () => showImportModal();

    // 批次刪除按鈕
    const batchDeleteBtn = document.createElement('button');
    batchDeleteBtn.textContent = '批次刪除';
    batchDeleteBtn.style.cssText = applyComponentVariant('button', 'default', 'danger') + 'font-weight: bold;';
    batchDeleteBtn.onclick = () => {
      const selectedItems = getSelectedItems();
      if (selectedItems.length === 0) {
        showNotification('請至少選擇一個項目進行刪除', 'warning');
        return;
      }
      showDeleteConfirmationModal(selectedItems);
    };

    actionsContainer.appendChild(batchExportBtn);
    actionsContainer.appendChild(batchImportBtn);
    actionsContainer.appendChild(batchDeleteBtn);

    batchControlsContainer.appendChild(selectAllContainer);
    batchControlsContainer.appendChild(actionsContainer);
    newPanel.appendChild(batchControlsContainer);

    // 全選功能
    selectAllCheckbox.onchange = () => {
      const itemCheckboxes = newPanel.querySelectorAll('.item-checkbox');
      if (selectAllCheckbox.checked) {
        // 全選時：使用建立時儲存的競標狀態，保持與預設選擇一致
        itemCheckboxes.forEach(cb => {
          const item = JSON.parse(cb.dataset.itemData);
          const bidState = BID_STATUS_SYSTEM.determineState(item);
          cb.checked = bidState !== 'hasBids'; // 只選擇無競標的項目
        });
      } else {
        // 取消全選：清空所有選擇
        itemCheckboxes.forEach(cb => {
          cb.checked = false;
        });
      }
      updateSelectedCount();
    };

    // 更新選中數量的函數
    function updateSelectedCount() {
      const itemCheckboxes = newPanel.querySelectorAll('.item-checkbox');
      const checkedCount = Array.from(itemCheckboxes).filter(cb => cb.checked).length;
      selectedCountSpan.textContent = `(已選 ${checkedCount} 項)`;

      // 更新全選 checkbox 狀態
      if (checkedCount === 0) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = false;
      } else if (checkedCount === itemCheckboxes.length) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = true;
      } else {
        selectAllCheckbox.indeterminate = true;
      }
    }

    // 獲取選中項目的函數
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
    searchInput.style.cssText = UI_COMPONENTS.input.search;
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
        safeScrollIntoView(targetItem, { behavior: 'smooth', block: 'center' });
        targetItem.style.background = '#e6f3ff';
        setTimeout(() => { if(targetItem) targetItem.style.background = ''; }, APP_CONSTANTS.TIMING.HIGHLIGHT_RESET_DELAY);
      }
    };
    newPanel.appendChild(searchInput);

    // --- 動態建立資料列表 ---
    data.sort((a, b) => b.AutoID - a.AutoID);
    data.forEach((item, i) => {
      const div = document.createElement('div');
      div.dataset.autoid = item.AutoID;
      div.style = `padding: 10px; border-bottom: 1px solid #eee; font-size: 14px; background-color: ${i % 2 === 0 ? '#ffffff' : '#f0f2f5'};`;

      const topRow = document.createElement('div');
      topRow.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';

      // 左側：選擇框 + 名稱資訊
      const leftContainer = document.createElement('div');
      leftContainer.style.cssText = 'display: flex; align-items: center; gap: 8px; flex-grow: 1;';

      // 項目選擇 checkbox
      const itemCheckbox = document.createElement('input');
      itemCheckbox.type = 'checkbox';
      itemCheckbox.className = 'item-checkbox';
      // 根據競標狀態設定預設選擇：有競標者時取消選取
      const bidState = BID_STATUS_SYSTEM.determineState(item);
      itemCheckbox.checked = bidState !== 'hasBids'; // 有競標時不選中
      itemCheckbox.dataset.itemIndex = i;
      // 儲存項目資料供全選功能使用，確保一致性
      itemCheckbox.dataset.itemData = JSON.stringify(item);
      itemCheckbox.style.cssText = 'transform: scale(1.1);';
      itemCheckbox.onchange = () => updateSelectedCount();

      const nameContainer = document.createElement('span');
      const photoIcon = document.createElement('span');
      photoIcon.className = 'photo-preview-icon';
      photoIcon.style.cursor = 'pointer';
      photoIcon.textContent = '[IMG]';
      photoIcon.onclick = () => showPhotoPreview(item.Photos);

      const nameStrong = document.createElement('strong');
      nameStrong.textContent = ` ${item.Name || '未命名'}`;

      nameContainer.appendChild(photoIcon);
      nameContainer.appendChild(nameStrong);

      // 左側容器組合：checkbox + 名稱
      leftContainer.appendChild(itemCheckbox);
      leftContainer.appendChild(nameContainer);

      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = 'display: flex; gap: 5px; flex-shrink: 0;';

      const packageBtn = document.createElement('button');
      packageBtn.className = 'package-download-btn';
      // 使用變體系統：預設按鈕 + 主要主題
      packageBtn.style.cssText = applyComponentVariant('button', 'default', 'primary');
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
                const base64 = await convertImageToBase64(photoUrl);
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
          ERROR_HANDLER.handle(error, 'file-processing', { fallbackMessage: '打包下載失敗，請稍後再試' });
        } finally {
          packageBtn.textContent = 'PACK';
          packageBtn.disabled = false;
          packageBtn.style.background = '#007baf';
        }
      };

      const downloadBtn = document.createElement('button');
      downloadBtn.className = 'download-btn';
      // 使用變體系統：預設按鈕 + 成功主題
      downloadBtn.style.cssText = applyComponentVariant('button', 'default', 'success');
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

    // 初始計算選中數量（扣掉有競標者）
    updateSelectedCount();

    document.body.appendChild(newPanel);
  }

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
      FurnitureHelper.setStatsTriggered(true);
      const queryBtn = Array.from(document.querySelectorAll('button.el-button')).find(b => /查\s*詢/.test(b.textContent));
      if (!queryBtn) {
        console.error('查詢按鈕未找到');
        alert('查詢按鈕未找到，請確認頁面已載入');
        FurnitureHelper.setStatsTriggered(false);
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
          FurnitureHelper.setStatsTriggered(false);
        }, 1000);
      } catch (error) {
        console.error('觸發查詢按鈕時發生錯誤:', error);
        setTimeout(() => {
          window.postMessage({ source: 'run-vue-stats' }, window.location.origin);
          FurnitureHelper.setStatsTriggered(false);
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
      // 顯示進度條
      showPrintProgress();
      // 使用與資料面板相同的 API 資料來源
      window.postMessage({ source: 'run-vue-panel-for-print' }, window.location.origin);
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
        processingMsg.style.cssText = UI_COMPONENTS.processing.base;
        document.body.appendChild(processingMsg);
        try {
          const text = await file.text();
          const jsonData = JSON.parse(text);
          const now = new Date();
          const createDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
          const modifyDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + APP_CONSTANTS.BUSINESS.DEFAULT_AUCTION_DURATION_DAYS, 0, 0, 0, 0);
          const formatDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T00:00:00.00`;
          jsonData.StartDate = formatDate(createDate);
          jsonData.EndDate = formatDate(modifyDate);
          await directSubmitToAPI(jsonData);
          processingMsg.remove();
        } catch (error) {
          processingMsg.remove();
          ERROR_HANDLER.handle(error, 'file-processing', { fallbackMessage: '直接匯入失敗，請檢查檔案格式' });
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
    remoteQuickImportBtn.onclick = handleRemoteQuickImport;

    const settingsBtn = document.createElement('button');
    settingsBtn.type = 'button';
    settingsBtn.textContent = '設定';
    settingsBtn.className = 'el-button el-button--info el-button--small';
    settingsBtn.style.marginLeft = '5px';
    settingsBtn.title = '設定 Webhook 網址';
    settingsBtn.onclick = showSettingsPanel;

    // --- 輔助函數定義 --- 
    
    function showSettingsPanel() {
      const panelId = 'settings-panel';
      if (document.getElementById(panelId)) document.getElementById(panelId).remove();
      const panel = document.createElement('div');
      panel.id = panelId;
      // 使用變體系統：寬版面板變體
      panel.style.cssText = applyComponentVariant('panel', 'wide');
      panel.innerHTML = `
        <h2 style="${UI_COMPONENTS.panel.header}"><span>系統設定</span><button id="close-settings-panel" style="${UI_COMPONENTS.closeButton.white}">X</button></h2>
        <div style="padding:20px;">
          <label style="display:block;margin-bottom:8px;font-weight:bold;">遠端匯入 Webhook 網址：</label>
          <input type="url" id="webhook-url-input" style="${UI_COMPONENTS.input.url}" value="${getCurrentWebhookUrl()}">
          <div style="margin-top:8px;font-size:12px;color:#666;">預設值：${DEFAULT_WEBHOOK_URL}</div>
          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">
            <button id="reset-webhook-btn" style="${applyComponentVariant('button', 'default', 'secondary')}">重置</button>
            <button id="save-webhook-btn" style="${applyComponentVariant('button', 'default', 'primary')}">儲存</button>
          </div>
          <div style="margin-top:20px;padding-top:20px;border-top:1px solid #eee;"><button id="test-webhook-btn" style="${applyComponentVariant('button', 'fullWidth', 'success')}">測試連線</button></div>
          <div style="margin-top:20px;padding-top:20px;border-top:1px solid #eee;"><button id="open-files-page-btn" style="${applyComponentVariant('button', 'fullWidth', 'purple')}">🔗 開啟 Files.php</button></div>
        </div>`;
      document.body.appendChild(panel);
      document.getElementById('close-settings-panel').onclick = () => panel.remove();
      document.getElementById('save-webhook-btn').onclick = () => { const url = document.getElementById('webhook-url-input').value.trim(); if(isValidUrl(url)){ saveWebhookSetting(url); showNotification('設定已儲存', 'success'); } else { showNotification('請輸入有效的網址格式', 'error'); } };
      document.getElementById('reset-webhook-btn').onclick = () => { document.getElementById('webhook-url-input').value = DEFAULT_WEBHOOK_URL; saveWebhookSetting(DEFAULT_WEBHOOK_URL); showNotification('已重置為預設值', 'success'); };
      document.getElementById('test-webhook-btn').onclick = () => { const url = document.getElementById('webhook-url-input').value.trim(); if(isValidUrl(url)) testWebhookConnection(url); else showNotification('請輸入有效的網址格式', 'error'); };
      document.getElementById('open-files-page-btn').onclick = () => { const url = new URL(getCurrentWebhookUrl()); window.open(`${url.protocol}//${url.host}${url.pathname}`, '_blank'); };
    }

    async function handleRemoteQuickImport(e) {
      e.preventDefault(); e.stopPropagation();
      const processingMsg = document.createElement('div');
      processingMsg.textContent = '正在獲取資料...';
      processingMsg.style.cssText = UI_COMPONENTS.processing.base;
      document.body.appendChild(processingMsg);
      try {
        const webhookUrl = getCurrentWebhookUrl();
        const response = await fetch(webhookUrl);
        if (!response.ok) throw new Error(`無法獲取檔案清單: ${response.statusText}`);
        const filesToImport = await response.json();
        if (!filesToImport || !filesToImport.length) {
          showNotification('遠端沒有需要匯入的檔案', 'info');
        } else {
          buildRemoteImportSelectionPanel(filesToImport);
        }
      } catch (error) {
        ERROR_HANDLER.handle(error, 'remote-import');
      } finally {
        processingMsg.remove();
      }
    }

    function buildRemoteImportSelectionPanel(files = []) {
      const panelId = 'remote-import-selection-panel';
      if(document.getElementById(panelId)) document.getElementById(panelId).remove();
      const newPanel = document.createElement('div');
      newPanel.id = panelId;
      // 使用變體系統：自定義寬度面板變體
      newPanel.style.cssText = applyComponentVariant('panel', 'custom');
      newPanel.innerHTML = `<h2 style="${UI_COMPONENTS.panel.header}"><span>選擇遠端匯入資料</span><button id="close-remote-import-panel" style="${UI_COMPONENTS.closeButton.white}">X</button></h2><div style="padding:5px 20px;display:flex;align-items:center;gap:8px;font-size:13px;"><span>競標</span><input type="number" id="auction-duration-input" placeholder="14" min="1" max="90" style="width:50px;padding:2px 4px;border:1px solid #ddd;border-radius:3px;" value="14"><span>天 (預設14)</span></div><input type="text" id="remote-panel-search" placeholder="輸入名稱或價格搜尋" style="${UI_COMPONENTS.input.search}"><div id="remote-import-list-container"></div>`;
      const listContainer = newPanel.querySelector('#remote-import-list-container');
      files.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      files.forEach((fileInfo, i) => {
        const div = document.createElement('div');
        div.style = `padding:10px;border-bottom:1px solid #eee;font-size:14px;background-color:${i % 2 === 0 ? '#fff' : '#f0f2f5'};`;
        div.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;"><strong>${fileInfo.title || '未命名'}</strong><button class="import-single-remote-btn" style="${applyComponentVariant('button', 'default', 'success')}">匯入</button></div><div style="color:#666;font-size:13px;margin-top:4px;">價格: ${fileInfo.price} | 日期: ${fileInfo.date.split(' ')[0]}</div>`;
        const importBtn = div.querySelector('.import-single-remote-btn');
        if (importBtn) importBtn.onclick = () => handleSingleRemoteImport(fileInfo);
        listContainer.appendChild(div);
      });
      document.body.appendChild(newPanel);
      document.getElementById('close-remote-import-panel').onclick = () => newPanel.remove();

      // 天數輸入框驗證
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
        const baseUrl = getCurrentWebhookUrl().split('?')[0];
        const downloadUrl = `${baseUrl}?action=download&file=${fileInfo.filename}`;
        const fileContentResponse = await fetch(downloadUrl);
        if (!fileContentResponse.ok) throw new Error(`無法下載檔案: ${fileContentResponse.statusText}`);
        const jsonData = await fileContentResponse.json();
        progressFill.style.width = APP_CONSTANTS.UI_COMPONENTS.PROGRESS.INITIAL;
        if (jsonData.Photos && Array.isArray(jsonData.Photos) && jsonData.Photos.length > 0) {
          const processedPhotos = [];
          for (let i = 0; i < jsonData.Photos.length; i++) {
            progressText.textContent = `處理圖片中... ${i + 1}/${jsonData.Photos.length}`;
            progressFill.style.width = `${APP_CONSTANTS.UI_COMPONENTS.PROGRESS.PROCESSING_BASE + Math.round(((i+1) / jsonData.Photos.length) * APP_CONSTANTS.UI_COMPONENTS.PROGRESS.PROCESSING_RANGE)}%`;
            const photo = jsonData.Photos[i];
            if (photo.Photo && photo.Photo.startsWith('data:image')) {
              const imageFile = optimizedBase64ToFile(photo.Photo, photo.filename || `image_${i + 1}.jpg`);
              const uploadResult = await uploadImage(imageFile);
              processedPhotos.push({ ...photo, Photo: uploadResult.FilePath || uploadResult, uploaded: true });
            } else { processedPhotos.push(photo); }
            await new Promise(resolve => setTimeout(resolve, APP_CONSTANTS.TIMING.API_RETRY_DELAY));
          }
          jsonData.Photos = processedPhotos;
        }
        progressText.textContent = '更新日期資訊...';
        progressFill.style.width = '85%';
        const now = new Date();
        const createDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        // 從輸入框讀取天數，如果無效則使用預設14天
        const durationInput = document.getElementById('auction-duration-input');
        let customDuration = APP_CONSTANTS.BUSINESS.DEFAULT_AUCTION_DURATION_DAYS;
        if (durationInput) {
          const inputValue = parseInt(durationInput.value);
          customDuration = (inputValue >= 1 && inputValue <= 90) ? inputValue : APP_CONSTANTS.BUSINESS.DEFAULT_AUCTION_DURATION_DAYS;
        }
        const modifyDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + customDuration, 0, 0, 0, 0);
        const formatDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T00:00:00.00`;
        jsonData.StartDate = formatDate(createDate);
        jsonData.EndDate = formatDate(modifyDate);
        progressText.textContent = '正在送出資料...';
        progressFill.style.width = APP_CONSTANTS.UI_COMPONENTS.PROGRESS.FINAL;
        await directSubmitToAPI(jsonData);
        progressText.textContent = '匯入完成！';
        progressFill.style.width = APP_CONSTANTS.UI_COMPONENTS.PROGRESS.COMPLETE;
        setTimeout(() => progressDiv.remove(), APP_CONSTANTS.TIMING.PROGRESS_CLEANUP_DELAY);
      } catch (error) {
        progressDiv.remove();
        ERROR_HANDLER.handle(error, 'remote-import', { fallbackMessage: `匯入檔案 ${fileInfo.title} 失敗` });
      }
    }

    function createCancellableProgress(title) {
      const div = document.createElement('div');
      div.innerHTML = `<div class="progress-modal" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:10000;min-width:300px;text-align:center;"><h3 style="margin:0 0 15px 0;color:#007baf;">處理中: ${title}</h3><div class="progress-bar" style="width:100%;height:20px;background:#f0f0f0;border-radius:10px;margin:15px 0;overflow:hidden;"><div class="progress-fill" style="height:100%;background:#007baf;width:0%;transition:width 0.3s;"></div></div><p class="progress-text" style="margin:10px 0;font-size:14px;color:#666;">準備中...</p><button class="cancel-btn" onclick="this.parentElement.parentElement.remove()" style="background:#dc3545;color:white;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;margin-top:10px;font-size:12px;">取消</button></div>`;
      document.body.appendChild(div);
      return div;
    }

    // --- 按鈕插入邏輯 ---
    addBtn.parentNode.insertBefore(statsBtn, addBtn.nextSibling);
    addBtn.parentNode.insertBefore(panelBtn, statsBtn.nextSibling);
    addBtn.parentNode.insertBefore(printBtn, panelBtn.nextSibling);
    addBtn.parentNode.insertBefore(quickImportBtn, printBtn.nextSibling);
    addBtn.parentNode.insertBefore(remoteQuickImportBtn, quickImportBtn.nextSibling);
    addBtn.parentNode.insertBefore(settingsBtn, remoteQuickImportBtn.nextSibling);

    console.log('已插入功能按鈕');
  }



  // 為編輯視窗添加匯入 JSON 按鈕


  function printTable(data = []) {
    if (!data.length) {
      showNotification('沒有資料可列印', 'warning');
      return;
    }

    // 格式化日期
    function formatDate(dateString) {
      if (!dateString) return '無';
      const date = new Date(dateString);
      return date.toISOString().slice(0, 10);
    }

    // 格式化金額
    function formatCurrency(amount) {
      if (!amount && amount !== 0) return '無';
      return new Intl.NumberFormat('zh-TW').format(amount);
    }

    // 取得應付金額
    function getTotalAmount(payment) {
      if (!payment || typeof payment !== 'object') return null;
      return payment.TotalAmount;
    }

    // 取得得標者資訊
    function getWinnerInfo(row) {
      if (!row.WinnerID) {
        // 沒有得標者，使用與資料面板完全相同的邏輯
        if (row.HasBids && row.BidPrice && row.Bidder) {
          // 使用與 BID_STATUS_SYSTEM.formatBidderName 相同的邏輯
          const bidderName = row.NickName && row.Bidder !== row.NickName ?
            `${row.Bidder}(${row.NickName})` :
            (row.Bidder || row.NickName || '未知用戶');
          return `${bidderName} - $${row.BidPrice} (競標中)`;
        } else {
          return '無競標者';
        }
      }

      // 有得標者，顯示得標者資訊
      const nickName = row.NickName || '';
      const account = row.Account || '';

      if (nickName && account) {
        return `${nickName}(${account}) - 已得標`;
      } else if (nickName) {
        return `${nickName} - 已得標`;
      } else if (account) {
        return `${account} - 已得標`;
      } else {
        return `ID: ${row.WinnerID} - 已得標`;
      }
    }

    // 準備列印資料
    const printData = data
      .sort((a, b) => b.AutoID - a.AutoID)
      .map(row => ({
        AutoID: row.AutoID || '無',
        Name: row.Name || '未命名',
        CategoryName: row.CategoryName || '無',
        DistName: row.DistName || '無',
        EndDate: formatDate(row.EndDate),
        TotalAmount: formatCurrency(getTotalAmount(row.Payment)),
        Winner: getWinnerInfo(row)
      }));

    // 建立列印頁面 HTML
    const printHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>新北市再生家具資料表</title>
    <style>
        @media print {
            body { margin: 0; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; }
            .no-print { display: none; }
        }
        
        body {
            font-family: 'Microsoft JhengHei', 'Segoe UI', sans-serif;
            margin: 20px;
            font-size: 12px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 18px;
            color: #333;
        }
        
        .header p {
            margin: 5px 0;
            color: #666;
            font-size: 11px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
            vertical-align: top;
        }
        
        th {
            background-color: #f5f5f5;
            font-weight: bold;
            font-size: 11px;
        }
        
        td {
            font-size: 11px;
        }
        
        .auto-id { width: 80px; }
        .name { width: 200px; }
        .category { width: 100px; }
        .district { width: 80px; }
        .end-date { width: 100px; }
        .total-amount { width: 100px; }
        .winner { width: 120px; }
        
        .no-print {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #007baf;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            z-index: 1000;
        }
    </style>
</head>
<body>
    <div class="no-print" onclick="window.print()">列印</div>
    
    <div class="header">
        <h1>新北市再生家具資料表</h1>
        <p>匯出時間：${new Date().toLocaleString('zh-TW')}</p>
        <p>資料筆數：${printData.length} 筆</p>
    </div>
    
    <table>
        <thead>
            <tr>
                <th class="auto-id">自動編號</th>
                <th class="name">家具名稱</th>
                <th class="category">類別名稱</th>
                <th class="district">行政區</th>
                <th class="end-date">結束日期</th>
                <th class="total-amount">應付金額</th>
                <th class="winner">得標者</th>
            </tr>
        </thead>
        <tbody>
            ${printData.map(row => `
                <tr>
                    <td>${row.AutoID}</td>
                    <td>${row.Name}</td>
                    <td>${row.CategoryName}</td>
                    <td>${row.DistName}</td>
                    <td>${row.EndDate}</td>
                    <td>${row.TotalAmount}</td>
                    <td>${row.Winner}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>`;

    // 開啟新視窗並列印
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printHTML);
    printWindow.document.close();
    
    // 等待頁面載入完成後自動列印
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  }

  // 添加Enter鍵支援，確保使用者可以正常查詢
  function addEnterKeySupport() {
    // 查找所有可能的輸入框
    const inputs = document.querySelectorAll('input[type="text"], input[type="search"], .el-input__inner');

    inputs.forEach(input => {
      // 避免重複綁定
      if (input.dataset.enterKeyBound) return;
      input.dataset.enterKeyBound = 'true';

      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault(); // 阻止預設行為

          // 查找查詢按鈕
          const queryBtn = Array.from(document.querySelectorAll('button.el-button'))
            .find(b => /查\s*詢/.test(b.textContent));

          if (queryBtn) {
            // 確保這不是統計按鈕觸發的
            if (!FurnitureHelper.isStatsTriggered()) {
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

  insertButtons();
  addEnterKeySupport();

  const buttonContainer = document.querySelector('.el-button-group') || document.body;
  new MutationObserver(() => {
    insertButtons();
    addEnterKeySupport(); // 頁面更新後重新綁定Enter鍵
  }).observe(buttonContainer, { childList: true, subtree: true });
  
  // 批次下載前的設定提醒對話框
  function showDownloadSettingsWarning(callback) {
    const existingWarning = document.getElementById('download-settings-warning');
    if (existingWarning) {
      existingWarning.remove();
    }

    const warningModal = document.createElement('div');
    warningModal.id = 'download-settings-warning';
    warningModal.style.cssText = applyComponentVariant('modal', 'default') + 'z-index: 10001; max-width: 600px;';

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
        <button id="cancel-download" style="${applyComponentVariant('button', 'default', 'secondary')}">
          取消下載
        </button>
        <button id="confirm-download" style="${applyComponentVariant('button', 'default', 'primary')}">
          我已設定完成，開始下載
        </button>
      </div>
    `;

    document.body.appendChild(warningModal);

    // 綁定按鈕事件
    document.getElementById('cancel-download').onclick = () => {
      warningModal.remove();
    };

    document.getElementById('confirm-download').onclick = () => {
      warningModal.remove();
      if (callback && typeof callback === 'function') {
        callback();
      }
    };

    // ESC 鍵關閉
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
      showNotification('沒有選擇任何項目', 'warning');
      return;
    }

    const timestamp = new Date().toISOString().slice(0,19).replace(/:/g,'-');
    const exportPrefix = `furniture_export_${timestamp}`;

    // 創建主索引檔案
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

    // 檔案下載佇列
    const filesToDownload = [];

    // 加入主索引檔案
    filesToDownload.push({
      name: `${exportPrefix}_manifest.json`,
      content: JSON.stringify(manifest, null, 2),
      type: 'application/json'
    });

    // 使用 PACK 方式處理每個項目（包含 base64 圖片）
    for (const item of selectedItems) {
      try {
        const { Photos, ...restOfItem } = item;
        const photosWithBase64 = [];

        if (Photos && Array.isArray(Photos) && Photos.length > 0) {
          for (const photo of Photos) {
            const photoUrl = photo.Photo.startsWith('http') ? photo.Photo : location.origin + photo.Photo;
            try {
              const base64 = await convertImageToBase64(photoUrl);
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
        ERROR_HANDLER.handle(error, 'file-processing');
      }
    }

    // 順序下載所有檔案（間隔 200ms 避免瀏覽器限制）
    showNotification(`開始下載 ${filesToDownload.length} 個檔案...`, 'info', 3000);

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
              showNotification('所有檔案下載完成！', 'success', 3000);
            }, 500);
          }
        } catch (error) {
          console.error(`下載檔案 ${file.name} 失敗:`, error);
          ERROR_HANDLER.handle(error, 'file-download');
        }
      }, i * 200);
    }
  }

  // 選擇性匯入功能
  function showImportModal() {
    const importModal = document.createElement('div');
    importModal.id = 'import-modal';
    importModal.style.cssText = applyComponentVariant('modal', 'wide') + 'z-index: 10002;';

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

        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 4px; margin-bottom: 15px;">
          <p style="margin: 0; font-size: 14px;">
            <strong>注意：</strong>請確保所有相關的項目檔案都在同一個資料夾中，匯入時會自動尋找對應的檔案。
          </p>
        </div>

        <div style="text-align: right;">
          <button id="start-import" style="${applyComponentVariant('button', 'default', 'success')}" disabled>
            開始匯入到系統
          </button>
        </div>
      </div>

      <div style="text-align: right; margin-top: 20px;">
        <button id="cancel-import" style="${applyComponentVariant('button', 'default', 'secondary')}">
          取消
        </button>
      </div>
    `;

    document.body.appendChild(importModal);

    // 綁定事件
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

    let manifestData = null;
    let itemFiles = {};

    // 處理多檔案選擇
    manifestInput.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      try {
        // 找出 manifest 檔案
        const manifestFile = files.find(file => file.name.includes('manifest.json'));
        if (!manifestFile) {
          throw new Error('請選擇包含 manifest.json 的檔案');
        }

        // 讀取 manifest
        const text = await manifestFile.text();
        manifestData = JSON.parse(text);

        if (!manifestData.itemList || !Array.isArray(manifestData.itemList)) {
          throw new Error('無效的 manifest 檔案格式');
        }

        // 建立檔案映射
        itemFiles = {};
        files.forEach(file => {
          console.log('載入檔案:', file.name);
          itemFiles[file.name] = file;
        });

        console.log('itemFiles 中的檔案:', Object.keys(itemFiles));

        displayImportItems(manifestData.itemList, itemsList, selectedCountSpan);
        itemsContainer.style.display = 'block';

        // 顯示項目列表後，允許用戶直接開始匯入
        startImportBtn.disabled = false;
        startImportBtn.textContent = '開始匯入到系統';

        showNotification(`已載入 ${files.length} 個檔案，包含 ${manifestData.itemList.length} 個項目`, 'success');

      } catch (error) {
        console.error('讀取檔案失敗:', error);
        showNotification('讀取檔案失敗: ' + error.message, 'error');
      }
    };

    // 移除不必要的項目檔案選擇邏輯

    // 全選功能
    selectAllImport.onchange = () => {
      const itemCheckboxes = itemsList.querySelectorAll('.import-item-checkbox');
      itemCheckboxes.forEach(cb => cb.checked = selectAllImport.checked);
      updateImportSelectedCount();
    };

    // 更新選中數量
    function updateImportSelectedCount() {
      const itemCheckboxes = itemsList.querySelectorAll('.import-item-checkbox');
      const checkedCount = Array.from(itemCheckboxes).filter(cb => cb.checked).length;
      selectedCountSpan.textContent = `(已選 ${checkedCount} 項)`;
    }

    // 開始匯入
    startImportBtn.onclick = async () => {
      const selectedItems = getSelectedImportItems();
      if (selectedItems.length === 0) {
        showNotification('請至少選擇一個項目', 'warning');
        return;
      }

      // 檢查是否有對應的項目檔案
      const missingFiles = selectedItems.filter(item => !itemFiles[item.filename]);
      if (missingFiles.length > 0) {
        const missingNames = missingFiles.map(item => item.filename);
        showNotification(`缺少檔案：${missingNames.join(', ')}，請確認已選擇所有相關檔案`, 'warning', 8000);
        return;
      }

      // 直接開始匯入
      modal.remove();
      await processImportedItems(selectedItems, itemFiles);
    };

    // 取消
    cancelBtn.onclick = () => modal.remove();

    // ESC 關閉
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

  // 刪除確認對話框
  function showDeleteConfirmationModal(selectedItems) {
    const deleteModal = document.createElement('div');
    deleteModal.id = 'delete-confirmation-modal';
    deleteModal.style.cssText = applyComponentVariant('modal', 'medium') + 'z-index: 10003;';

    deleteModal.innerHTML = `
      <h3 style="margin: 0 0 20px 0; color: #dc3545; font-size: 20px;">🗑️ 批次刪除確認</h3>

      <div style="background: #f8d7da; border: 1px solid #f5c2c7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
          <span style="font-size: 24px;">⚠️</span>
          <h4 style="margin: 0; color: #721c24; font-size: 18px;">危險操作警告</h4>
        </div>
        <p style="margin: 0 0 10px 0; color: #721c24; font-size: 16px; font-weight: bold;">
          您即將刪除 <span style="color: #dc3545; font-size: 20px;">${selectedItems.length}</span> 個項目
        </p>
        <p style="margin: 0; color: #721c24; font-size: 16px;">
          此操作<strong>無法撤銷</strong>，請確認您真的要執行此操作。
        </p>
      </div>

      <div style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; border-radius: 8px; margin-bottom: 20px; max-height: 300px; overflow-y: auto;">
        <h4 style="margin: 0 0 10px 0; color: #495057; font-size: 16px;">即將刪除的項目：</h4>
        <div id="delete-items-list">
          ${selectedItems.map((item, index) => `
            <div style="padding: 8px; border-bottom: 1px solid #dee2e6; display: flex; align-items: center; gap: 10px; background: ${index % 2 === 0 ? '#ffffff' : '#f8f9fa'};">
              <span style="color: #dc3545; font-weight: bold; font-size: 16px;">[${item.AutoID}]</span>
              <span style="flex: 1; font-size: 16px;">${item.Name || '未命名'}</span>
              <span style="font-size: 14px; color: #6c757d;">${item.CategoryName || ''}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 16px; color: #856404;">
          <strong>請再次確認：</strong>刪除後這些項目將從系統中永久移除，無法恢復。
        </p>
      </div>

      <div style="display: flex; justify-content: space-between; gap: 15px;">
        <button id="cancel-delete" style="${applyComponentVariant('button', 'default', 'secondary')}">
          取消
        </button>
        <button id="confirm-delete" style="${applyComponentVariant('button', 'default', 'danger')} font-weight: bold;">
          確認刪除 ${selectedItems.length} 個項目
        </button>
      </div>
    `;

    document.body.appendChild(deleteModal);

    // 綁定事件
    const confirmBtn = deleteModal.querySelector('#confirm-delete');
    const cancelBtn = deleteModal.querySelector('#cancel-delete');

    confirmBtn.onclick = async () => {
      deleteModal.remove();
      await processBatchDelete(selectedItems);
    };

    cancelBtn.onclick = () => deleteModal.remove();

    // ESC 關閉
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        deleteModal.remove();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
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

    // 初始化計數
    const checkedCount = items.length;
    countSpan.textContent = `(已選 ${checkedCount} 項)`;
  }

  async function processImportedItems(selectedItems, itemFiles) {
    showNotification(`開始批次匯入 ${selectedItems.length} 個項目到系統...`, 'info');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < selectedItems.length; i++) {
      const item = selectedItems[i];
      try {
        showNotification(`正在匯入項目 ${i + 1}/${selectedItems.length}: ${item.name}`, 'info', 2000);

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

        // 驗證資料完整性
        if (itemData.AutoID !== item.autoID) {
          console.warn(`檔案內容不匹配: ${item.filename}`);
          errorCount++;
          continue;
        }

        // 調用現有的 API 上傳功能
        await directSubmitToAPI(itemData);
        successCount++;

        console.log(`✅ 項目 ${item.name} (${item.autoID}) 匯入成功`);

        // 項目間隔 1 秒，避免 API 請求過於頻繁
        if (i < selectedItems.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`處理項目 ${item.filename} 時發生錯誤:`, error);
        errorCount++;
        showNotification(`項目 ${item.name} 匯入失敗: ${error.message}`, 'error', 3000);
      }
    }

    // 顯示最終結果
    const message = `批次匯入完成！成功: ${successCount} 項，失敗: ${errorCount} 項`;
    if (errorCount === 0) {
      showNotification(message, 'success', 5000);
    } else if (successCount === 0) {
      showNotification(message, 'error', 5000);
    } else {
      showNotification(message, 'warning', 5000);
    }

    // 刷新頁面資料
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

  // 顯示列印進度條
  function showPrintProgress() {
    // 移除舊的進度條
    const existingProgress = document.getElementById('print-progress-modal');
    if (existingProgress) {
      existingProgress.remove();
    }

    const progressModal = document.createElement('div');
    progressModal.id = 'print-progress-modal';
    progressModal.style.cssText = combineStyles(
      UI_COMPONENTS.modal.base,
      'z-index: 10003;'
    );

    progressModal.innerHTML = `
      <div style="background: white; padding: 30px; max-width: 400px; width: 90%; border-radius: 8px;">
        <h3 style="margin: 0 0 20px 0; color: #007baf; text-align: center;">📊 正在生成列印表格</h3>

        <div style="margin-bottom: 15px;">
          <div style="background: #f8f9fa; height: 20px; border-radius: 10px; overflow: hidden; border: 1px solid #dee2e6;">
            <div id="print-progress-bar" style="background: linear-gradient(45deg, #007baf, #28a745); height: 100%; width: 0%; transition: width 0.3s ease; border-radius: 10px;"></div>
          </div>
        </div>

        <div style="text-align: center;">
          <div id="print-progress-text" style="color: #6c757d; margin-bottom: 10px;">正在載入資料...</div>
          <div id="print-progress-detail" style="font-size: 12px; color: #adb5bd; margin-bottom: 15px;">請稍候，正在取得競標資訊</div>
          <button id="cancel-print-btn" style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px;">取消處理</button>
        </div>
      </div>
    `;

    document.body.appendChild(progressModal);

    // 加入取消按鈕事件
    const cancelBtn = document.getElementById('cancel-print-btn');
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        // 發送取消訊號
        window.postMessage({ source: 'cancel-print-process' }, window.location.origin);
        hidePrintProgress();
        showNotification('列印處理已取消', 'warning');
      };
    }
  }

  // 更新列印進度
  function updatePrintProgress(current, total, detail = '') {
    const progressBar = document.getElementById('print-progress-bar');
    const progressText = document.getElementById('print-progress-text');
    const progressDetail = document.getElementById('print-progress-detail');

    if (progressBar && progressText) {
      const percentage = Math.round((current / total) * 100);
      progressBar.style.width = percentage + '%';
      progressText.textContent = `處理中... ${current}/${total} (${percentage}%)`;

      if (progressDetail && detail) {
        progressDetail.textContent = detail;
      }
    }
  }

  // 隱藏列印進度條
  function hidePrintProgress() {
    const progressModal = document.getElementById('print-progress-modal');
    if (progressModal) {
      progressModal.remove();
    }
  }

  // 暴露進度條函數到全域
  window.showPrintProgress = showPrintProgress;
  window.updatePrintProgress = updatePrintProgress;
  window.hidePrintProgress = hidePrintProgress;

})();