(function () {

  // 安全的滾動函數，避免觸發選擇機制
  function safeScrollIntoView(element, options = {}) {
    try {
      // 先清除任何現有的選擇
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      }
      
      // 嘗試使用 scrollIntoView
      if (element && element.scrollIntoView) {
        element.scrollIntoView(options);
      } else {
        // 如果沒有 scrollIntoView 方法，使用替代方案
        element.scrollIntoView();
      }
    } catch (error) {
      console.warn('滾動操作失敗，使用替代方案:', error);
      // 使用替代的滾動方法
      try {
        element.scrollIntoView();
      } catch (fallbackError) {
        console.error('所有滾動方法都失敗:', fallbackError);
      }
    }
  }

  // 統一樣式常數
  const COMMON_STYLES = {
    modal: {
      position: 'fixed', 
      top: '20%', 
      left: '50%', 
      transform: 'translateX(-50%)',
      background: '#fff', 
      border: '0.5px solid #ddd', 
      padding: '24px', 
      zIndex: '9999',
      width: 'auto', 
      maxWidth: '90%', 
      maxHeight: '80%', 
      overflow: 'auto',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)', 
      borderRadius: '6px'
    },
    closeButton: 'position:absolute; top:12px; right:16px; cursor:pointer; font-size:24px;',
    panel: `position: fixed; top: 80px; right: 0; width: 320px; height: calc(100% - 100px); overflow-y: auto; background: white; border-left: 2px solid #007baf; box-shadow: -2px 0 5px rgba(0,0,0,0.2); font-family: 'Segoe UI', 'Noto Sans TC', sans-serif; z-index: 99999;`,
    panelHeader: 'margin: 0; background: #007baf; color: white; padding: 12px; font-size: 16px; display: flex; justify-content: space-between;',
    searchInput: 'width: calc(100% - 20px); padding: 8px; margin: 10px; border: 1px solid #ccc; border-radius: 4px;',
    button: 'border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px; font-size: 12px;',
    buttonBlue: 'background: #007baf; color: white;',
    buttonGreen: 'background: #28a745; color: white;',
    processingMsg: 'position:fixed;top:30px;right:30px;background:#fff;padding:16px 32px;border-radius:8px;box-shadow:0 2px 8px #0002;z-index:9999;font-size:18px;',
    notification: 'position:fixed;top:20px;right:20px;padding:12px 20px;border-radius:6px;z-index:10000;box-shadow:0 4px 12px rgba(0,0,0,0.15);font-size:14px;',
    notifySuccess: 'background:#28a745;color:white;',
    notifyError: 'background:#E53E3E;color:white;',
    notifyWarning: 'background:#FF6B35;color:white;'
  };
  
  // 類別映射表 (對應 webhook.php 的 CATEGORY_MAPPING)
  const CATEGORY_MAPPING = {
    '茶几': 6,
    '沙發': 39,
    '收納櫃': 9,
    '鞋架': 10,
    '鞋櫃': 10,
    '玄關櫃': 11,
    '電視櫃': 12,
    '椅子': 40,
    '書櫃': 14,
    '書桌': 15,
    '家飾': 28,
    '燈具': 29,
    '燈飾': 29,
    '家用電器': 30,
    '腳踏車': 31,
    '其他': 32
  };
  
  // 統一通知系統
  function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.style.cssText = COMMON_STYLES.notification + 
      (type === 'success' ? COMMON_STYLES.notifySuccess : 
       type === 'error' ? COMMON_STYLES.notifyError : 
       type === 'warning' ? COMMON_STYLES.notifyWarning : 
       'background:#667eea;color:white;');
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, duration);
  }
  
  // 注入 inject.js 到頁面
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('inject.js');
  document.documentElement.appendChild(script);

  // 將圖片轉換為 Base64 的函數
  async function convertImageToBase64(imageUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // 處理跨域問題
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // 設定 canvas 尺寸
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          
          // 繪製圖片到 canvas
          ctx.drawImage(img, 0, 0);
          
          // 轉換為 Base64
          const base64 = canvas.toDataURL('image/jpeg', 0.8); // 使用 JPEG 格式，品質 0.8
          resolve(base64);
        } catch (error) {
          reject(new Error(`Canvas 轉換失敗: ${error.message}`));
        }
      };
      
      img.onerror = () => {
        reject(new Error(`圖片載入失敗: ${imageUrl}`));
      };
      
      // 設定圖片來源
      img.src = imageUrl;
    });
  }

  /**
   * 將 Base64 字串轉換為 File 物件。
   * @param {string} base64String - 包含 data URI scheme 的 Base64 字串 (e.g., "data:image/png;base64,...")
   * @param {string} filename - 轉換後的檔案名稱
   * @returns {File} - 可用於上傳的 File 物件
   */
  function base64ToFile(base64String, filename = 'image.jpg') {
    try {
      const arr = base64String.split(',');
      const mime = arr[0].match(/:(.*?);/)[1]; // 從 "data:image/png;base64" 中提取 "image/png"
      const bstr = atob(arr[1]); // 解碼 Base64
      let n = bstr.length;
      const u8arr = new Uint8Array(n);

      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }

      const file = new File([u8arr], filename, { type: mime });
      return file;
    } catch (error) {
      throw error;
    }
  }

  // 優化的 Base64 轉 File 函數
  function optimizedBase64ToFile(base64String, filename = 'image.jpg') {
    try {
      // 檢查 Base64 大小
      const base64Size = base64String.length;
      const estimatedFileSize = Math.ceil(base64Size * 0.75);
      
      console.log(` Base64 大小: ${(base64Size / 1024).toFixed(1)}KB`);
      console.log(` 預估檔案大小: ${(estimatedFileSize / 1024).toFixed(1)}KB`);
      
      // 如果檔案太大，給出警告
      if (estimatedFileSize > 2 * 1024 * 1024) { // 2MB
        console.warn(`警告: 圖片檔案較大: ${(estimatedFileSize / 1024 / 1024).toFixed(1)}MB`);
      }
      
      const arr = base64String.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      
      // 使用 Uint8Array 優化記憶體使用
      const u8arr = new Uint8Array(bstr.length);
      for (let i = 0; i < bstr.length; i++) {
        u8arr[i] = bstr.charCodeAt(i);
      }
      
      const file = new File([u8arr], filename, { type: mime });
      console.log(` 轉換成功: ${filename} (${file.size} bytes)`);
      
      // 清理變數，幫助垃圾回收
      u8arr.fill(0);
      
      return file;
      
    } catch (error) {
      console.error(` Base64 轉換失敗: ${error.message}`);
      throw error;
    }
  }

  /**
   * 上傳單張圖片檔案到新北市再生家具的伺服器。
   * 這個 API 是一個純粹的檔案上傳接口，它接收圖片並回傳一個包含路徑的 JSON。
   *
   * @param {File} imageFile - 使用者透過 <input type="file"> 選擇的圖片檔案物件。
   * @returns {Promise<object>} - 伺服器回傳的 JSON 物件，預期包含 FilePath 等欄位。
   *                              例如: { FilePath: "/Static/Image/Upload/Product/uuid.jpg", ... }
   */
  async function uploadImage(imageFile) {
    const apiUrl = 'https://recycledstuff.ntpc.gov.tw/BidMgr/api/Product/UploadFile';


    // 1. 建立一個 FormData 物件。
    const formData = new FormData();

    // 2. 將圖片檔案附加到 FormData 中。
    //    根據 Payload 分析，後端接收的欄位名是 "file"。
    formData.append('file', imageFile, imageFile.name);

    // 3. 使用 fetch 發起 POST 請求。
    //    當 body 是 FormData 時，瀏覽器會自動設定正確的 Content-Type (包含 boundary)，
    //    並且會自動附加當前網域的 cookie 用於認證。
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`伺服器錯誤: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // 4. 解析伺服器回傳的 JSON 資料並回傳。
      const result = await response.json();
      return result;

    } catch (error) {
      throw error; // 將錯誤向上拋出，以便呼叫者可以處理
    }
  }



  window.addEventListener('message', event => {
    if (event.source !== window || event.origin !== window.location.origin) return;
    const msg = event.data;
    if (!msg || !msg.source) {
      console.error('無效的消息格式', msg);
      return;
    }
    if (msg.source === 'vue-stats') {
      if (!msg.hierarchicalStats) {
        showNotification('數據格式錯誤', 'error');
        return;
      }
      showHierarchicalModal(msg.hierarchicalStats);
    }
    if (msg.source === 'vue-export') {
      exportToCSV(msg.data || []);
    }
    if (msg.source === 'vue-export-all') {
      exportAllToCSV(msg.data || []);
    }
    if (msg.source === 'vue-panel-data') {
      buildPanel(msg.data || []);
    }
    if (msg.source === 'vue-print') {
      printTable(msg.data || []);
    }
  });

  // 新的階層式統計顯示函數
  function showHierarchicalModal(hierarchicalStats) {
    let modal = document.getElementById('vue-stats-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'vue-stats-modal';
      Object.assign(modal.style, COMMON_STYLES.modal);
      modal.style.width = '1000px';
      modal.style.maxWidth = '95vw';
      modal.innerHTML = `
        <span style="${COMMON_STYLES.closeButton}"
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

  // 建立統計樹的輔助函數
  function createStatsTree(dateData, title, color) {
    const section = document.createElement('div');
    section.style.cssText = 'margin-bottom: 30px; border: 1px solid #e0e0e0; border-radius: 8px; background: #f8f9fa;';
    
    const header = document.createElement('div');
    header.style.cssText = `background: ${color}; color: white; padding: 12px; font-size: 16px; font-weight: bold; border-radius: 7px 7px 0 0; cursor: pointer;`;
    header.innerHTML = `${title} <span style="float: right;">▶</span>`;
    
    const content = document.createElement('div');
    content.style.cssText = 'padding: 15px; display: none;';
    
    // 點擊標題展開/收合整個區塊
    header.onclick = () => {
      const isHidden = content.style.display === 'none';
      content.style.display = isHidden ? 'block' : 'none';
      header.querySelector('span').textContent = isHidden ? '▼' : '▶';
    };

    // 按年份排序（新的在前）
    const sortedYears = Object.keys(dateData).sort((a, b) => b - a);
    
    sortedYears.forEach(year => {
      const yearData = dateData[year];
      const yearDiv = document.createElement('div');
      yearDiv.style.cssText = 'margin-bottom: 15px; border-left: 3px solid #ddd; padding-left: 10px;';
      
      // 計算年度總計
      let yearTotal = 0;
      Object.keys(yearData).forEach(month => {
        Object.keys(yearData[month]).forEach(day => {
          yearTotal += yearData[month][day].length;
        });
      });
      
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
      
      // 按月份排序（新的在前）
      const sortedMonths = Object.keys(yearData).sort((a, b) => b.localeCompare(a));
      
      sortedMonths.forEach(month => {
        const monthData = yearData[month];
        const monthDiv = document.createElement('div');
        monthDiv.style.cssText = 'margin-bottom: 10px; border-left: 2px solid #ccc; padding-left: 10px;';
        
        // 計算月度總計
        let monthTotal = 0;
        Object.keys(monthData).forEach(day => {
          monthTotal += monthData[day].length;
        });
        
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
        
        // 按日期排序（新的在前）
        const sortedDays = Object.keys(monthData).sort((a, b) => b.localeCompare(a));
        
        sortedDays.forEach(day => {
          const dayItems = monthData[day];
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
              // 首次展開時才載入商品列表，按 AutoID 降序排列
              const sortedItems = dayItems.sort((a, b) => b.AutoID - a.AutoID);
              sortedItems.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.style.cssText = 'font-size: 13px; color: #333; padding: 6px 10px; margin: 3px 0; background: #fff; border-radius: 4px; border-left: 3px solid ' + color + '; line-height: 1.2; font-family: monospace;';
                
                // 建立一行顯示的結構化內容
                const itemContainer = document.createElement('div');
                itemContainer.style.cssText = 'display: flex; align-items: center; gap: 12px;';
                
                // ID 欄位 (8字元)
                const idPart = document.createElement('span');
                idPart.style.cssText = 'min-width: 70px; font-weight: 600; color: #007baf;';
                idPart.textContent = `ID:${item.AutoID}`;
                
                // 商品名稱 (不截斷)
                const namePart = document.createElement('span');
                namePart.style.cssText = 'flex: 1; font-weight: 500; word-wrap: break-word;';
                namePart.textContent = item.Name;
                
                // 狀態欄位 (8字元)
                const statusPart = document.createElement('span');
                const payStatus = item.IsPay ? '已付' : '未付';
                const getStatus = item.IsGet ? '已取' : '未取';
                const statusText = `${payStatus}/${getStatus}`;
                
                // 根據狀態設定顏色
                let statusColor = '#6c757d'; // 預設灰色
                if (item.IsPay && item.IsGet) {
                  statusColor = '#28a745'; // 綠色 - 完成
                } else if (item.IsPay && !item.IsGet) {
                  statusColor = '#ffc107'; // 橙色 - 待取貨
                } else if (!item.IsPay && item.IsGet) {
                  statusColor = '#dc3545'; // 紅色 - 異常
                }
                
                statusPart.style.cssText = `min-width: 80px; color: ${statusColor}; font-weight: 600; text-align: center;`;
                statusPart.textContent = statusText;
                
                // 競標資訊 (不截斷暱稱和ID)
                const bidPart = document.createElement('span');
                bidPart.style.cssText = 'min-width: 200px; font-size: 12px; white-space: nowrap;';
                
                if (item.HasBids && item.BidPrice && item.Bidder) {
                  // 同時顯示暱稱和得標者ID，完整顯示不截斷
                  let displayName = '';
                  
                  if (item.NickName && item.Bidder) {
                    // 有暱稱時顯示：暱稱(ID)
                    displayName = `${item.NickName}(${item.Bidder})`;
                  } else if (item.NickName) {
                    // 只有暱稱時
                    displayName = item.NickName;
                  } else {
                    // 只有得標者ID時
                    displayName = item.Bidder;
                  }
                  
                  bidPart.innerHTML = `<span style="color: #0056b3; font-weight: 600;">${item.BidPrice}元</span><span style="color: #666;"> / ${displayName}</span>`;
                  itemDiv.style.cssText += ' background: #f8f9ff;';
                } else if (item.HasBids === false) {
                  bidPart.style.cssText += ' color: #856404;';
                  bidPart.textContent = '無競標';
                } else {
                  bidPart.style.cssText += ' color: #6c757d;';
                  bidPart.textContent = '查詢中...';
                  itemDiv.style.cssText += ' background: #f8f9fa;';
                }
                
                // 組裝所有部分
                itemContainer.appendChild(idPart);
                itemContainer.appendChild(namePart);
                itemContainer.appendChild(statusPart);
                itemContainer.appendChild(bidPart);
                
                itemDiv.appendChild(itemContainer);
                
                // 根據付款和取貨狀態調整樣式
                if (item.IsPay && item.IsGet) {
                  // 已付款且已取貨 - 完成狀態，使用綠色調
                  itemDiv.style.cssText += ' border-left-color: #28a745;';
                } else if (item.IsPay && !item.IsGet) {
                  // 已付款但未取貨 - 使用橙色調
                  itemDiv.style.cssText += ' border-left-color: #ffc107;';
                } else if (!item.IsPay && item.IsGet) {
                  // 未付款但已取貨 - 異常狀態，使用紅色調
                  itemDiv.style.cssText += ' border-left-color: #dc3545;';
                }
                
                dayContent.appendChild(itemDiv);
              });
            }
            dayContent.style.display = isHidden ? 'block' : 'none';
            dayHeader.querySelector('.toggle').textContent = isHidden ? '▼' : '▶';
          };
          
          dayDiv.appendChild(dayHeader);
          dayDiv.appendChild(dayContent);
          monthContent.appendChild(dayDiv);
        });
        
        monthDiv.appendChild(monthHeader);
        monthDiv.appendChild(monthContent);
        yearContent.appendChild(monthDiv);
      });
      
      yearDiv.appendChild(yearHeader);
      yearDiv.appendChild(yearContent);
      content.appendChild(yearDiv);
    });

    section.appendChild(header);
    section.appendChild(content);
    return section;
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
      Object.assign(modal.style, COMMON_STYLES.modal);
      modal.style.top = '10%';
      modal.style.border = '2px solid #007baf';
      modal.style.zIndex = '10000';
      modal.style.minWidth = '600px';
      modal.style.maxWidth = '90vw';
      modal.innerHTML = `
        <span style="${COMMON_STYLES.closeButton} color:#666;"
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

  function buildPanel(data = []) {

    const panelId = 'furniture-panel';
    const panel = document.getElementById(panelId);
    if (panel) panel.remove(); // 確保舊面板移除

    const newPanel = document.createElement('div');
    newPanel.id = panelId;
    newPanel.style.cssText = COMMON_STYLES.panel;
    newPanel.innerHTML = `
      <h2 style="${COMMON_STYLES.panelHeader}">
        <span>匯出家具資料</span>
        <button id="close-panel" style="background: none; border: none; color: white; font-size: 16px; cursor: pointer;">X</button>
      </h2>
      <input type="text" id="panel-search" placeholder="輸入 AutoID 搜尋" style="${COMMON_STYLES.searchInput}">
    `;

    data.sort((a, b) => b.AutoID - a.AutoID);
    data.forEach((item, i) => {
      const div = document.createElement('div');
      div.dataset.autoid = item.AutoID; // 新增 data-autoid 屬性
      // 根據索引設定明顯的色差
      const backgroundColor = i % 2 === 0 ? '#ffffff' : '#f0f2f5';
      div.style = `padding: 10px; border-bottom: 1px solid #eee; font-size: 14px; background-color: ${backgroundColor};`;
      div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>
            <span class="photo-preview-icon" style="cursor: pointer;">[IMG]</span>
            <strong>${item.Name || '未命名'}</strong>
          </span>
          <div style="display: flex; gap: 5px;">
            <button class="package-download-btn" style="${COMMON_STYLES.button} ${COMMON_STYLES.buttonBlue}" data-index="${i}">PACK</button>
            <button class="download-btn" style="${COMMON_STYLES.button} ${COMMON_STYLES.buttonGreen}" data-index="${i}">DL</button>
          </div>
        </div>
        <div style="color: #666; font-size: 13px; margin-top: 4px;">
          ID: ${item.AutoID} | 日期: ${(item.CreateDate || '').split('T')[0]}
          ${item.BidChecked ? 
            (item.HasBids ? 
              `<br><span style="background-color: #ffebee; padding: 2px 4px; border-radius: 3px;">最高競標價: ${item.BidPrice} 元<br>最高出價者: ${item.Bidder}</span>` : 
              '<br>無競標資料'
            ) : 
            '<br>競標資料讀取中...'
          }
        </div>
      `;
      // 使用 setTimeout 將事件綁定推遲到下一個事件循環
      // 以確保 innerHTML 創建的元素已經被 DOM 解析和渲染
      setTimeout(() => {
        const photoIcon = div.querySelector('.photo-preview-icon');
        if (photoIcon) {
          photoIcon.addEventListener('click', () => showPhotoPreview(item.Photos));
        }

        const downloadBtn = div.querySelector('.download-btn');
        if (downloadBtn) {
          downloadBtn.onclick = () => {
            const { Photos, ...restOfItem } = item;
            const dataToExport = restOfItem;
            
            const name = item.Name || `item_${item.AutoID}`;
            const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${name}.json`;
            a.click();
            URL.revokeObjectURL(url);

            const base = location.origin;
            (Photos || []).forEach((p, j) => {
              const imgA = document.createElement('a');
              imgA.href = p.Photo.startsWith('http') ? p.Photo : base + p.Photo;
              imgA.download = `${name}_${j + 1}.jpg`;
              imgA.click();
            });
          };
        }

        
        const packageBtn = div.querySelector('.package-download-btn');
        if (packageBtn) {
          packageBtn.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const {
              AutoID, Name, CategoryName, CategoryID, DistName, CreateDate, Description,
              Length, Width, Height, DeliveryAddress, InitPrice, OriginPrice, Photos
            } = item;
            
            // 顯示載入提示
            const btn = div.querySelector('.package-download-btn');
            const originalText = btn.textContent;
            btn.textContent = '處理中...';
            btn.disabled = true;
            btn.style.background = '#6c757d';
            
            try {
              // PACK功能：將圖片轉 Base64 打包在 JSON 內
              const photosWithBase64 = [];
              if (Photos && Array.isArray(Photos) && Photos.length > 0) {
                for (let j = 0; j < Photos.length; j++) {
                  const photo = Photos[j];
                  const photoUrl = photo.Photo.startsWith('http') ? photo.Photo : location.origin + photo.Photo;
                  
                  try {
                    const base64 = await convertImageToBase64(photoUrl);
                    photosWithBase64.push({
                      ...photo,
                      Photo: base64,
                      PhotoUrl: photoUrl // 保留原始URL作為參考
                    });
                  } catch (error) {
                    console.error(`轉換圖片 ${j + 1} 失敗:`, error);
                    // 如果轉換失敗，保留原始資料
                    photosWithBase64.push({
                      ...photo,
                      PhotoUrl: photoUrl,
                      Error: '圖片轉換失敗'
                    });
                  }
                }
              }
              
              // 建立包含 Base64 圖片的完整資料
              const dataToExport = {
                AutoID,
                Name,
                CategoryName,
                CategoryID,
                DistName,
                CreateDate,
                Description,
                Length,
                Width,
                Height,
                DeliveryAddress,
                InitPrice,
                OriginPrice,
                Photos: photosWithBase64,
                ExportInfo: {
                  ExportDate: new Date().toISOString(),
                  ExportType: 'PackageDownload',
                  ImageFormat: 'Base64',
                  TotalImages: photosWithBase64.length
                }
              };
              
              // 下載 JSON 檔案
              const name = Name || `item_${AutoID}`;
              const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${name}_package.json`;
              a.click();
              URL.revokeObjectURL(url);
              
              console.log(`打包下載完成: ${name} (${photosWithBase64.length} 張圖片)`);
              
            } catch (error) {
              console.error('打包下載失敗:', error);
              alert('打包下載失敗，請稍後再試');
            } finally {
              // 恢復按鈕狀態
              btn.textContent = originalText;
              btn.disabled = false;
              btn.style.background = '#28a745';
            }
          };
        }
      }, 0);
      
      newPanel.appendChild(div);
    });

    document.body.appendChild(newPanel);
    document.getElementById('close-panel').onclick = () => {
      newPanel.remove(); // 銷毀面板
    };

    // 搜尋功能
    document.getElementById('panel-search').onkeyup = (e) => {
      const inputValue = e.target.value.trim();
      if (!inputValue) {
        // 清除高亮
        newPanel.querySelectorAll('[data-autoid]').forEach(item => {
          item.style.background = '';
        });
        return;
      }
      const item = newPanel.querySelector(`[data-autoid="${inputValue}"]`);
      if (item) {
        // 清除其他高亮
        newPanel.querySelectorAll('[data-autoid]').forEach(other => {
          if (other !== item) other.style.background = '';
        });
        // 滾動並高亮（使用安全的滾動函數）
        safeScrollIntoView(item, { behavior: 'smooth', block: 'center' });
        item.style.background = '#e6f3ff';
        setTimeout(() => item.style.background = '', 2000); // 2 秒後移除高亮
      } else {
        console.log('無匹配 AutoID:', inputValue);
      }
    };
  }

  function insertButtons() {
    const addBtn = document.querySelector('button.el-button.el-button--success');
    if (!addBtn || document.querySelector('#tm-stats-btn')) return;

    if (!addBtn.parentNode) {
      console.error('父節點未找到');
      return;
    }

    addBtn.onclick = () => {
      setTimeout(() => {
        const modal = document.querySelector('.vxe-modal--box');
        if (!modal) {
          console.log('未找到 vxe-modal--box');
          return;
        }

        const header = modal.querySelector('.vxe-modal--header');
        const title = header && header.querySelector('.vxe-modal--title');
        if (!header || !title || title.textContent !== '編輯視窗') {
          console.log('未找到 header 或標題不是「編輯視窗」', { header, title: title?.textContent });
          return;
        }

        setTimeout(() => {
          const modal = document.querySelector('.vxe-modal--box');
          if (!modal) {
            console.log('未找到 vxe-modal--box');
            return;
          }

          const header = modal.querySelector('.vxe-modal--header');
          if (!header || header.querySelector('#import-json-btn')) {
            console.log('未找到 header 或按鈕已存在');
            return;
          }

          // 插入載入表單按鈕
          const importButton = document.createElement('button');
          importButton.type = 'button';
          importButton.id = 'import-json-btn';
          importButton.innerHTML = '📝 載入表單';
          importButton.className = 'el-button el-button--warning el-button--small';
          importButton.style.marginLeft = '10px';
          importButton.onclick = () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                  try {
                    const json = JSON.parse(e.target.result);
                    fillForm(json);
                  } catch (error) {
                    alert('JSON 解析失敗: ' + error.message);
                  }
                };
                reader.readAsText(file);
              }
            };
            input.click();
          };
          
          header.appendChild(importButton);
          console.log('📝 載入表單按鈕已插入到編輯視窗 header');
        }, 1000);
      }, 1000);
    };

    const statsBtn = document.createElement('button');
    statsBtn.type = 'button';
    statsBtn.id = 'tm-stats-btn';
    statsBtn.textContent = '年度統計';
    statsBtn.className = 'el-button el-button--primary el-button--small';
    statsBtn.style.marginLeft = '5px';
    statsBtn.onclick = (e) => {
      // 防止事件冒泡和預設行為
      e.preventDefault();
      e.stopPropagation();

      // 設定標記：這是統計按鈕主動觸發的查詢
      window.__statsButtonTriggered = true;

      const queryBtn = Array.from(document.querySelectorAll('button.el-button'))
        .find(b => /查\s*詢/.test(b.textContent));
      if (!queryBtn) {
        console.error('查詢按鈕未找到');
        alert('查詢按鈕未找到，請確認頁面已載入');
        window.__statsButtonTriggered = false;
        return;
      }

      // 使用更安全的方式觸發查詢按鈕
      try {
        // 先嘗試直接觸發 Vue 事件
        if (queryBtn.__vue__ && queryBtn.__vue__.$emit) {
          queryBtn.__vue__.$emit('click');
        } else {
          // 關鍵修復：禁用事件冒泡，避免干擾其他事件處理
          const clickEvent = new MouseEvent('click', {
            bubbles: false,  // 修復：設為 false 避免事件污染
            cancelable: true,
            view: window
          });
          queryBtn.dispatchEvent(clickEvent);
        }

        // 延遲發送統計請求，並清除標記
        setTimeout(() => {
          window.postMessage({ source: 'run-vue-stats' }, window.location.origin);
          window.__statsButtonTriggered = false; // 清除標記
        }, 1000);
      } catch (error) {
        console.error('觸發查詢按鈕時發生錯誤:', error);
        // 如果觸發查詢按鈕失敗，直接嘗試獲取統計數據
        setTimeout(() => {
          window.postMessage({ source: 'run-vue-stats' }, window.location.origin);
          window.__statsButtonTriggered = false; // 清除標記
        }, 500);
      }
    };

    const exportBtn = document.createElement('button');
    exportBtn.type = 'button';
    exportBtn.textContent = '匯出';
    exportBtn.className = 'el-button el-button--warning el-button--small';
    exportBtn.style.marginLeft = '5px';
    exportBtn.onclick = () => {
      window.postMessage({ source: 'run-vue-export' }, window.location.origin);
    };

    const exportAllBtn = document.createElement('button');
    exportAllBtn.type = 'button';
    exportAllBtn.textContent = '全部匯出';
    exportAllBtn.className = 'el-button el-button--warning el-button--small';
    exportAllBtn.style.marginLeft = '5px';
    exportAllBtn.onclick = () => {
      window.postMessage({ source: 'run-vue-export-all' }, window.location.origin);
    };

    const panelBtn = document.createElement('button');
    panelBtn.type = 'button';
    panelBtn.textContent = '資料面板';
    panelBtn.className = 'el-button el-button--info el-button--small';
    panelBtn.style.marginLeft = '5px';
    panelBtn.onclick = () => {
      const panel = document.getElementById('furniture-panel');
      if (panel) {
        panel.remove(); // 銷毀面板
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

    // 新增直接匯入按鈕
    const quickImportBtn = document.createElement('button');
    quickImportBtn.type = 'button';
    quickImportBtn.textContent = '直接匯入';
    quickImportBtn.className = 'el-button el-button--danger el-button--small';
    quickImportBtn.style.marginLeft = '5px';
    quickImportBtn.title = '選擇包含 Base64 圖片的 JSON 檔案，直接送到伺服器';
    quickImportBtn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
              console.log('開始直接匯入流程...');
      
      // 建立檔案選擇器
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.style.display = 'none';
      
      input.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
          console.log(`選擇檔案: ${file.name}`);
          
          // 讀取 JSON 檔案
          const text = await file.text();
          const jsonData = JSON.parse(text);
          
          // 更新日期格式
          const now = new Date();
          const createDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
          const modifyDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14, 0, 0, 0, 0);
          
          // 格式化日期為 "YYYY-MM-DDTHH:mm:ss.SS" 格式
          const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}T00:00:00.00`;
          };
          
          // 更新 JSON 資料中的日期（API 需要的格式）
          jsonData.StartDate = formatDate(createDate);
          jsonData.EndDate = formatDate(modifyDate);
          
          console.log('JSON 資料解析成功，開始處理...');
          console.log(`📅 更新日期: StartDate=${jsonData.StartDate}, EndDate=${jsonData.EndDate}`);
          
          // 顯示處理中的提示
          const processingMsg = document.createElement('div');
          processingMsg.textContent = ' 正在處理資料，請稍候...';
          processingMsg.style.cssText = COMMON_STYLES.processingMsg;
          document.body.appendChild(processingMsg);
          
          try {
            // 直接呼叫 API 送出
            const result = await directSubmitToAPI(jsonData);
            console.log('直接匯入完成！', result);
            processingMsg.remove();
          } catch (error) {
            processingMsg.remove();
            throw error;
          }
        } catch (error) {
          console.error('直接匯入失敗:', error);
          alert(` 直接匯入失敗: ${error.message}`);
        }
        document.body.removeChild(input);
      });
      document.body.appendChild(input);
      input.click();
    };
    addBtn.parentNode.insertBefore(quickImportBtn, printBtn.nextSibling);

    // 新增遠端匯入按鈕
    const remoteQuickImportBtn = document.createElement('button');
    remoteQuickImportBtn.type = 'button';
    remoteQuickImportBtn.textContent = '遠端匯入';
    remoteQuickImportBtn.className = 'el-button el-button--danger el-button--small';
    remoteQuickImportBtn.style.marginLeft = '5px';
    remoteQuickImportBtn.title = '從遠端 files.php 獲取 JSON 清單並循序匯入';
    remoteQuickImportBtn.onclick = handleRemoteQuickImport;
    addBtn.parentNode.insertBefore(remoteQuickImportBtn, quickImportBtn.nextSibling);

    // 新增設定按鈕
    const settingsBtn = document.createElement('button');
    settingsBtn.type = 'button';
    settingsBtn.textContent = '設定';
    settingsBtn.className = 'el-button el-button--info el-button--small';
    settingsBtn.style.marginLeft = '5px';
    settingsBtn.title = '設定 Webhook 網址';
    settingsBtn.onclick = showSettingsPanel;
    addBtn.parentNode.insertBefore(settingsBtn, remoteQuickImportBtn.nextSibling);

    // 遠端匯入功能
    const DEFAULT_WEBHOOK_URL = 'https://580.blias.com/daobo/files.php?format=json';
    
    // 儲存設定到 localStorage
    function saveWebhookSetting(url) {
      try {
        localStorage.setItem('furniture-helper-webhook-url', url);
        console.log('webhook 設定已儲存:', url);
      } catch (error) {
        console.error('儲存 webhook 設定失敗:', error);
      }
    }
    
    // 從 localStorage 讀取設定
    function loadWebhookSetting() {
      try {
        const savedUrl = localStorage.getItem('furniture-helper-webhook-url');
        return savedUrl || DEFAULT_WEBHOOK_URL;
      } catch (error) {
        console.error('讀取 webhook 設定失敗:', error);
        return DEFAULT_WEBHOOK_URL;
      }
    }
    
    // 取得當前使用的 webhook 網址
    function getCurrentWebhookUrl() {
      return loadWebhookSetting();
    }

    // 顯示設定面板
    function showSettingsPanel() {
      const panelId = 'settings-panel';
      const existingPanel = document.getElementById(panelId);
      if (existingPanel) {
        existingPanel.remove();
      }

      const panel = document.createElement('div');
      panel.id = panelId;
      panel.style.cssText = COMMON_STYLES.panel;
      panel.style.width = '400px';
      panel.innerHTML = `
        <h2 style="${COMMON_STYLES.panelHeader}">
          <span>系統設定</span>
          <button id="close-settings-panel" style="background: none; border: none; color: white; font-size: 16px; cursor: pointer;">X</button>
        </h2>
        <div style="padding: 20px;">
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #333;">
              遠端匯入 Webhook 網址：
            </label>
            <input type="url" id="webhook-url-input" 
                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;"
                   placeholder="請輸入 Webhook 網址 (例如：https://your-domain.com/api/files.php?format=json)"
                   value="${getCurrentWebhookUrl()}">
            <div style="margin-top: 8px; font-size: 12px; color: #666;">
              預設值：${DEFAULT_WEBHOOK_URL}
            </div>
          </div>
          
          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button id="reset-webhook-btn" style="${COMMON_STYLES.button}" 
                    style="background: #6c757d; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">
              重置為預設值
            </button>
            <button id="save-webhook-btn" style="${COMMON_STYLES.button} ${COMMON_STYLES.buttonBlue}" 
                    style="background: #007baf; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">
              儲存設定
            </button>
          </div>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <button id="test-webhook-btn" style="${COMMON_STYLES.button} ${COMMON_STYLES.buttonGreen}"
                    style="background: #28a745; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; width: 100%;">
              測試連線
            </button>
          </div>

          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <button id="open-files-page-btn" style="${COMMON_STYLES.button}"
                    style="background: #6f42c1; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; width: 100%;">
              🔗 開啟 Files.php 頁面
            </button>
            <div style="margin-top: 8px; font-size: 12px; color: #666; text-align: center;">
              在新分頁中開啟遠端檔案管理頁面
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(panel);

      // 綁定事件
      document.getElementById('close-settings-panel').onclick = () => {
        panel.remove();
      };

      document.getElementById('save-webhook-btn').onclick = () => {
        const input = document.getElementById('webhook-url-input');
        const url = input.value.trim();
        
        if (!url) {
          showNotification('請輸入 Webhook 網址', 'warning');
          return;
        }
        
        if (!isValidUrl(url)) {
          showNotification('請輸入有效的網址格式', 'error');
          return;
        }
        
        saveWebhookSetting(url);
        showNotification('設定已儲存', 'success');
      };

      document.getElementById('reset-webhook-btn').onclick = () => {
        document.getElementById('webhook-url-input').value = DEFAULT_WEBHOOK_URL;
        saveWebhookSetting(DEFAULT_WEBHOOK_URL);
        showNotification('已重置為預設值', 'success');
      };

      document.getElementById('test-webhook-btn').onclick = async () => {
        const input = document.getElementById('webhook-url-input');
        const url = input.value.trim();
        
        if (!url) {
          showNotification('請先輸入 Webhook 網址', 'warning');
          return;
        }
        
        if (!isValidUrl(url)) {
          showNotification('請輸入有效的網址格式', 'error');
          return;
        }
        
        await testWebhookConnection(url);
      };

      document.getElementById('open-files-page-btn').onclick = () => {
        const input = document.getElementById('webhook-url-input');
        const webhookUrl = input.value.trim();

        if (!webhookUrl) {
          showNotification('請先設定 Webhook 網址', 'warning');
          return;
        }

        // 從 webhook 網址中移除查詢參數，保留完整路徑
        try {
          const url = new URL(webhookUrl);
          // 移除查詢參數，保留完整路徑
          const filesUrl = `${url.protocol}//${url.host}${url.pathname}`;

          // 在新分頁中開啟 files.php
          window.open(filesUrl, '_blank');
          console.log(`開啟 Files.php 頁面: ${filesUrl}`);
        } catch (error) {
          console.error('解析 Webhook 網址失敗:', error);
          showNotification('無效的 Webhook 網址格式', 'error');
        }
      };
    }

    // 驗證網址格式
    function isValidUrl(string) {
      try {
        new URL(string);
        return true;
      } catch (_) {
        return false;
      }
    }

    // 測試 webhook 連線
    async function testWebhookConnection(url) {
      const testBtn = document.getElementById('test-webhook-btn');
      const originalText = testBtn.textContent;
      
      testBtn.textContent = '測試中...';
      testBtn.disabled = true;
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            showNotification(`連線成功！找到 ${data.length} 筆資料`, 'success');
          } else {
            showNotification('連線成功！但回應格式不是預期的陣列', 'warning');
          }
        } else {
          showNotification(`連線失敗：${response.status} ${response.statusText}`, 'error');
        }
      } catch (error) {
        showNotification(`連線錯誤：${error.message}`, 'error');
      } finally {
        testBtn.textContent = originalText;
        testBtn.disabled = false;
      }
    }

    async function handleRemoteQuickImport(e) {
      e.preventDefault();
      e.stopPropagation();

      console.log('開始遠端匯入流程...');

      const processingMsg = document.createElement('div');
      processingMsg.textContent = ' 正在從遠端獲取資料清單，請稍候...';
      processingMsg.style.cssText = COMMON_STYLES.processingMsg;
      document.body.appendChild(processingMsg);

      try {
        const webhookUrl = getCurrentWebhookUrl();
        console.log(`📁 正在從 ${webhookUrl} 獲取檔案清單...`);
        const response = await fetch(webhookUrl);

        if (!response.ok) {
          throw new Error(`無法獲取檔案清單: ${response.status} ${response.statusText}`);
        }

        const filesToImport = await response.json();

        if (!filesToImport || !filesToImport.length) {
          showNotification('遠端伺服器上沒有需要匯入的檔案', 'info');
          processingMsg.remove();
          return;
        }

        console.log(`找到 ${filesToImport.length} 個檔案，準備顯示選擇面板...`);
        processingMsg.remove(); // 移除初始的處理中提示
        buildRemoteImportSelectionPanel(filesToImport); // 顯示選擇面板

      } catch (error) {
        processingMsg.remove();
          console.error('遠端匯入失敗:', error);
          alert(` 遠端匯入失敗: ${error.message}`);
      }
    }

    // 處理單個遠端檔案匯入的函數（分批處理版本）
    async function handleSingleRemoteImport(fileInfo) {
      console.log(`⏳ 開始匯入單筆資料: ${fileInfo.title}`);

      // 創建可取消的進度顯示
      const progressDiv = createCancellableProgress(fileInfo.title);
      const progressText = progressDiv.querySelector('.progress-text');
      const progressFill = progressDiv.querySelector('.progress-fill');

      try {
        // 1. 下載 JSON 檔案
        progressText.textContent = '正在下載檔案...';
        progressFill.style.width = '10%';
        
        console.log(`下載檔案: ${fileInfo.download_url}`);
        const fileContentResponse = await fetch(fileInfo.download_url);
        
        if (!fileContentResponse.ok) {
          throw new Error(`無法下載檔案: ${fileContentResponse.status} ${fileContentResponse.statusText}`);
        }
        
        const jsonData = await fileContentResponse.json();
        
        // 2. 檢查檔案大小
        const fileSize = JSON.stringify(jsonData).length;
        const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);
        console.log(` 檔案大小: ${fileSizeMB}MB`);
        
        if (fileSizeMB > 5) {
          progressText.textContent = `警告: 檔案較大 (${fileSizeMB}MB)，處理可能需要較長時間...`;
        }
        
        progressFill.style.width = '20%';
        
        // 3. 分批處理圖片
        if (jsonData.Photos && Array.isArray(jsonData.Photos) && jsonData.Photos.length > 0) {
          console.log(` 開始分批處理 ${jsonData.Photos.length} 張圖片...`);
          
          const processedPhotos = [];
          const batchSize = 1; // 一次處理1張圖片
          const totalPhotos = jsonData.Photos.length;
          
          for (let i = 0; i < totalPhotos; i += batchSize) {
            const batch = jsonData.Photos.slice(i, i + batchSize);
            const progress = 20 + Math.round((i / totalPhotos) * 60); // 20%-80%
            
            progressText.textContent = ` 處理圖片中... ${i + 1}/${totalPhotos}`;
            progressFill.style.width = `${progress}%`;
            
            // 處理這批圖片
            for (const photo of batch) {
              try {
                if (photo.Photo && photo.Photo.startsWith('data:image')) {
                  // 轉換 Base64 為 File
                  const filename = photo.filename || `image_${i + 1}.jpg`;
                  const imageFile = optimizedBase64ToFile(photo.Photo, filename);
                  
                  // 上傳圖片
                  const uploadResult = await uploadImage(imageFile);
                  
                  processedPhotos.push({
                    ...photo,
                    Photo: uploadResult.FilePath || uploadResult,
                    uploaded: true
                  });
                  
                  console.log(` 圖片 ${i + 1} 處理完成`);
                } else {
                  processedPhotos.push(photo);
                }
              } catch (error) {
                console.error(` 處理圖片 ${i + 1} 失敗:`, error);
                processedPhotos.push({
                  ...photo,
                  error: error.message
                });
              }
            }
            
            // 給瀏覽器喘息的機會
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          jsonData.Photos = processedPhotos;
        }
        
        // 4. 更新日期格式
        progressText.textContent = '📅 更新日期資訊...';
        progressFill.style.width = '85%';
        
        const now = new Date();
        const createDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const modifyDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14, 0, 0, 0, 0);
        
        const formatDate = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}T00:00:00.00`;
        };
        
        jsonData.StartDate = formatDate(createDate);
        jsonData.EndDate = formatDate(modifyDate);
        
        // 5. 送出到 API
        progressText.textContent = '正在送出資料到伺服器...';
        progressFill.style.width = '90%';
        
        const result = await directSubmitToAPI(jsonData);
        
        // 6. 完成
        progressText.textContent = ' 匯入完成！';
        progressFill.style.width = '100%';
        
        console.log('遠端匯入完成！', result);
        
        // 延遲一下再移除進度條
        setTimeout(() => {
          progressDiv.remove();
        }, 2000);
        
      } catch (error) {
        progressDiv.remove();
        console.error(` 匯入檔案 ${fileInfo.title} 失敗:`, error);
        alert(` 匯入檔案 ${fileInfo.title} 失敗: ${error.message}`);
      }
    }

    // 創建可取消的進度顯示
    function createCancellableProgress(title) {
      const div = document.createElement('div');
      div.innerHTML = `
        <div class="progress-modal" style="
          position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
          background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          z-index: 10000; min-width: 300px; text-align: center;
        ">
          <h3 style="margin: 0 0 15px 0; color: #007baf;"> 處理中: ${title}</h3>
          <div class="progress-bar" style="
            width: 100%; height: 20px; background: #f0f0f0; border-radius: 10px; margin: 15px 0;
            overflow: hidden;
          ">
            <div class="progress-fill" style="
              height: 100%; background: #007baf; width: 0%; transition: width 0.3s;
            "></div>
          </div>
          <p class="progress-text" style="margin: 10px 0; font-size: 14px; color: #666;">準備中...</p>
          <button class="cancel-btn" onclick="this.parentElement.parentElement.remove()" style="
            background: #dc3545; color: white; border: none; padding: 8px 16px;
            border-radius: 4px; cursor: pointer; margin-top: 10px; font-size: 12px;
          ">取消</button>
        </div>
      `;
      document.body.appendChild(div);
      return div;
    }


    // 建立遠端匯入選擇面板的函數
    function buildRemoteImportSelectionPanel(files = []) {

      const panelId = 'remote-import-selection-panel';
      const panel = document.getElementById(panelId);
      if (panel) panel.remove(); // 確保舊面板移除

      const newPanel = document.createElement('div');
      newPanel.id = panelId;
      newPanel.style.cssText = COMMON_STYLES.panel;
      newPanel.style.width = '380px';
      newPanel.innerHTML = `
        <h2 style="${COMMON_STYLES.panelHeader}">
          <span>選擇遠端匯入資料</span>
          <button id="close-remote-import-panel" style="background: none; border: none; color: white; font-size: 16px; cursor: pointer;">X</button>
        </h2>
        <input type="text" id="remote-panel-search" placeholder="輸入名稱或價格搜尋" style="${COMMON_STYLES.searchInput}">
        <div id="remote-import-list-container"></div>
      `;

      const listContainer = newPanel.querySelector('#remote-import-list-container');
      
      // 排序檔案 (例如按日期最新)
      files.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      files.forEach((fileInfo, i) => {
        const div = document.createElement('div');
        div.dataset.title = fileInfo.title; // 用於搜尋
        div.dataset.price = fileInfo.price; // 用於搜尋
        const backgroundColor = i % 2 === 0 ? '#ffffff' : '#f0f2f5';
        div.style = `padding: 10px; border-bottom: 1px solid #eee; font-size: 14px; background-color: ${backgroundColor};`;
        div.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong>${fileInfo.title || '未命名'}</strong>
            <button class="import-single-remote-btn" style="${COMMON_STYLES.button} ${COMMON_STYLES.buttonGreen}">匯入</button>
          </div>
          <div style="color: #666; font-size: 13px; margin-top: 4px;">
            價格: ${fileInfo.price} | 日期: ${fileInfo.date.split(' ')[0]}
          </div>
        `;
        
        // 將 fileInfo 綁定到按鈕上，以便點擊時傳遞
        const importBtn = div.querySelector('.import-single-remote-btn');
        if (importBtn) {
          importBtn.onclick = () => handleSingleRemoteImport(fileInfo);
        }
        listContainer.appendChild(div);
      });

      document.body.appendChild(newPanel);
      document.getElementById('close-remote-import-panel').onclick = () => {
        newPanel.remove(); // 銷毀面板
      };

      // 搜尋功能
      document.getElementById('remote-panel-search').onkeyup = (e) => {
        const inputValue = e.target.value.trim().toLowerCase();
        const items = listContainer.querySelectorAll('div[data-title]');
        items.forEach(item => {
          const title = item.dataset.title.toLowerCase();
          const price = item.dataset.price.toLowerCase();
          if (title.includes(inputValue) || price.includes(inputValue)) {
            item.style.display = ''; // 顯示
          } else {
            item.style.display = 'none'; // 隱藏
          }
        });
      };
    }

    if (!statsBtn || !exportBtn || !exportAllBtn || !panelBtn || !printBtn) {
      console.error('按鈕未正確定義');
      return;
    }

    addBtn.parentNode.insertBefore(statsBtn, addBtn.nextSibling);
    addBtn.parentNode.insertBefore(exportBtn, statsBtn.nextSibling);
    addBtn.parentNode.insertBefore(exportAllBtn, exportBtn.nextSibling);
    addBtn.parentNode.insertBefore(panelBtn, exportAllBtn.nextSibling);
    addBtn.parentNode.insertBefore(printBtn, panelBtn.nextSibling);
    console.log('已插入統計、輕量匯出、全部匯出、資料面板、列印表格按鈕');
  }

  // JSON 匯入功能相關函數
  // 強制更新 Vue 組件
  function forceVueUpdate(input, value) {
    // 獲取欄位標籤用於日誌
    const label = input.closest('.el-form-item')?.querySelector('.el-form-item__label')?.textContent.trim() || '未知欄位';
    
    console.log(`🔧 設定欄位 "${label}": 原始值="${input.value}", 新值="${value}"`);
    
    // 直接設定值
    input.value = value;
    
    // 觸發 Vue 的響應式更新
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    
    // 數字輸入框自動處理轉換
    if (input.type === 'number' && value) {
      input.value = parseFloat(value) || 0;
    }
    
    // 額外觸發更多事件確保更新
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    input.dispatchEvent(new Event('focus', { bubbles: true }));
    
    console.log(` 欄位 "${label}" 設定完成: value="${input.value}", type="${input.type}"`);
  }


  // 增強版填充表單函數（支援 Element UI Select 元件）
  async function fillForm(json) {
    const form = document.querySelector('.vxe-modal--box .el-form');
    if (!form) {
      console.error('未找到表單');
      return;
    }

    // 先處理非 Select 欄位
    const nonSelectItems = [];
    const selectItems = [];

    const formItems = form.querySelectorAll('.el-form-item');
    formItems.forEach(item => {
      const label = item.querySelector('.el-form-item__label');
      const input = item.querySelector('input, textarea, select');
      
      if (!label || !input) return;
      
      const labelText = label.textContent.trim();
      let value = '';

      // 根據標籤文字映射 JSON 欄位
      switch (labelText) {
        case '品名':
          value = json.Name || '';
          break;
        case '類別':
          // 優先使用 CategoryName，如果沒有則從 CategoryID 反推
          value = json.CategoryName || getCategoryNameFromID(json.CategoryID) || '';
          break;
        case '行政區':
          value = json.DistName || '';
          break;
        case '產品描述':
          value = json.Description || '';
          break;
        case '長':
          value = json.Length ?? '';
          break;
        case '寬':
          value = json.Width ?? '';
          break;
        case '高':
          value = json.Height ?? '';
          break;
        case '交貨地點':
          value = json.DeliveryAddress || '';
          break;
        case '起標價格':
          value = json.InitPrice || '';
          break;
        case '原價':
          value = json.OriginPrice || '';
          break;
        default:
          return;
      }

      if (!value && !(labelText === '長' || labelText === '寬' || labelText === '高')) {
        return;
      }

      // 分類處理
      if (input.type === 'text' && (labelText === '類別' || labelText === '行政區')) {
        selectItems.push({ item, labelText, input, value });
      } else {
        // 特殊處理長寬高欄位
        if (labelText === '長' || labelText === '寬' || labelText === '高') {
          // 處理各種可能的值：0, "0", "", null, undefined
          let numValue;
          if (value === 0 || value === '0') {
            numValue = 0;
          } else if (!value) {
            numValue = 0;
          } else {
            numValue = value;
          }
          nonSelectItems.push({ item, labelText, input, value: numValue });
        } else {
          nonSelectItems.push({ item, labelText, input, value });
        }
      }
    });

    // 先處理非 Select 欄位
    nonSelectItems.forEach(({ input, value }) => {
      forceVueUpdate(input, value);
    });

    // 順序處理 Select 欄位
    for (const { labelText, input, value } of selectItems) {
      await processSelectField(labelText, input, value);
    }

    // 處理拍賣期間欄位（自動設定現在時間）
    await processAuctionPeriod();

    // 處理圖片上傳（如果是打包的 JSON）
    if (json.Photos && Array.isArray(json.Photos) && json.Photos.length > 0) {
      // 檢查是否為打包的 JSON（包含 Base64 資料）
      const hasBase64Images = json.Photos.some(photo => photo.Photo && photo.Photo.startsWith('data:image'));
      
      if (hasBase64Images) {
        await uploadImagesFromPackagedJson(json.Photos);
      }
    }
  }

  // 從打包的 JSON 上傳圖片的函數
  async function uploadImagesFromPackagedJson(photos) {
    // 清空現有的視覺預覽（如果有的話）
    const form = document.querySelector('.vxe-modal--box .el-form');
    if (form) {
      const formItems = form.querySelectorAll('.el-form-item');
      formItems.forEach(item => {
        const label = item.querySelector('.el-form-item__label');
        if (label && label.textContent.trim() === '預覽圖') {
          const previewContainer = item.querySelector('.image-preview-container');
          if (previewContainer) {
            previewContainer.innerHTML = '';
          }
        }
      });
    }
    
    const uploadedImages = [];
    
    // 使用 Promise.all 來並行處理所有圖片的上傳（根據您的建議）
    const uploadPromises = photos.map(async (photo, index) => {
      try {
        // 檢查是否有 Base64 資料
        if (!photo.Photo || !photo.Photo.startsWith('data:image')) {
          return null;
        }
        
        // 取得檔案名稱
        const filename = photo.filename || photo.PhotoID || `upload_${index + 1}.jpg`;
        
        // 將 Base64 轉換為 File 物件
                        const imageFile = optimizedBase64ToFile(photo.Photo, filename);
        
        // 呼叫我們優化後的 uploadImage 函數
        const uploadResult = await uploadImage(imageFile);
        
        return {
          filename,
          uploadResult,
          originalPhoto: photo
        };
        
      } catch (error) {
        return null;
      }
    });
    
    // 等待所有圖片上傳完成
    const uploadResults = await Promise.all(uploadPromises);
    
    // 動態渲染預覽（無需重整）
    uploadResults.forEach(result => {
      if (result && result.uploadResult) {
        // 伺服器回應可能是字串 URL 或包含 FilePath 的物件
        let imageUrl;
        if (typeof result.uploadResult === 'string') {
          // 直接是 URL 字串
          imageUrl = result.uploadResult;
        } else if (result.uploadResult.FilePath) {
          // 包含 FilePath 欄位的物件
          imageUrl = result.uploadResult.FilePath.startsWith('http') 
            ? result.uploadResult.FilePath 
            : `https://recycledstuff.ntpc.gov.tw${result.uploadResult.FilePath}`;
        } else {
          return;
        }
        
        // 動態建立圖片預覽
        createImagePreview(imageUrl, result.filename);
        
        uploadedImages.push({
          filename: result.filename,
          filePath: imageUrl,
          originalPhoto: result.originalPhoto
        });
        
        // 圖片預覽建立完成
      }
    });
    
    // 圖片上傳完成
    
    // 顯示完成訊息
    if (uploadedImages.length > 0) {
      const message = ` 成功上傳 ${uploadedImages.length} 張圖片並建立預覽`;
      console.log(message);
      
      // 顯示完成通知
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-size: 14px;
      `;
      notification.textContent = message;
      document.body.appendChild(notification);
      
      // 3秒後自動移除
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 3000);
      

    }
    
    return uploadedImages;
  }

  // 處理單個 Select 欄位的函數
  function processSelectField(labelText, input, value) {
    return new Promise((resolve) => {
      const elSelect = input.closest('.el-select');
      if (elSelect) {
        input.click();
        setTimeout(() => {
          const allDropdowns = document.querySelectorAll('.el-select-dropdown');
          
          if (!allDropdowns.length) {
            forceVueUpdate(input, value);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            resolve();
            return;
          }

          const visibleDropdown = Array.from(allDropdowns).find(d => window.getComputedStyle(d).display !== 'none');

          if (!visibleDropdown) {
            forceVueUpdate(input, value);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            resolve();
            return;
          }

          const options = visibleDropdown.querySelectorAll('.el-select-dropdown__item');
          const matchedOption = Array.from(options).find(option =>
            option.textContent.trim() === value
          );

          if (matchedOption) {
            matchedOption.click();
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
          } else {
            forceVueUpdate(input, value);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }

          setTimeout(resolve, 200);
        }, 100);
      } else {
        forceVueUpdate(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        resolve();
      }
    });
  }

  // 處理拍賣期間欄位（自動設定現在時間）
  async function processAuctionPeriod() {
    const form = document.querySelector('.vxe-modal--box .el-form');
    if (!form) return;

    const formItems = form.querySelectorAll('.el-form-item');
    let startField = null;
    let endField = null;

    formItems.forEach(item => {
      const label = item.querySelector('.el-form-item__label');
      if (label) {
        const labelText = label.textContent.trim();
        if (labelText === '拍賣期間(起)') {
          startField = item.querySelector('input');
        } else if (labelText === '拍賣期間(迄)') {
          endField = item.querySelector('input');
        }
      }
    });

    if (!startField || !endField) return;

    await setCurrentTime(startField, '拍賣期間(起)');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!endField.value?.trim()) {
      await setCurrentTime(endField, '拍賣期間(迄)', 30);
    }
  }

  // 設定時間的輔助函數
  async function setCurrentTime(input, fieldName, daysToAdd = 0) {
    return new Promise((resolve) => {
      // 使用安全的滾動函數
      safeScrollIntoView(input, { behavior: 'smooth', block: 'center' });
      input.click();
      input.focus();
      
      const checkForDatePicker = (attempt = 1) => {
        const nowButton = findNowButton();
        
        if (nowButton) {
          // 使用安全的滾動函數
          safeScrollIntoView(nowButton, { behavior: 'smooth', block: 'center' });
          nowButton.click();
          
          if (daysToAdd > 0) {
            setTimeout(() => {
              const currentValue = input.value;
              if (currentValue) {
                const date = new Date(currentValue);
                date.setDate(date.getDate() + daysToAdd);
                const newValue = date.toISOString().slice(0, 19).replace('T', ' ');
                input.value = newValue;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
              }
            }, 300);
          }
          resolve();
        } else if (attempt < 5) {
          setTimeout(() => checkForDatePicker(attempt + 1), 300);
        } else {
          const now = new Date();
          if (daysToAdd > 0) {
            now.setDate(now.getDate() + daysToAdd);
          }
          const timeString = now.toISOString().slice(0, 19).replace('T', ' ');
          input.value = timeString;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          resolve();
        }
      };
      
      setTimeout(() => checkForDatePicker(), 300);
    });
  }

  // 尋找「現在」按鈕的函數
  function findNowButton() {
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      if (button.textContent.includes('現在') || button.textContent.toLowerCase().includes('now')) {
        return button;
      }
    }
    
    const nowButtonByClass = document.querySelector('.el-picker-panel__now-btn, .el-date-picker__now-btn, .el-datetime-picker__now-btn');
    if (nowButtonByClass) return nowButtonByClass;
    
    const datePanels = document.querySelectorAll('.el-picker-panel, .el-date-picker, .el-datetime-picker');
    for (const panel of datePanels) {
      const panelButtons = panel.querySelectorAll('button');
      for (const button of panelButtons) {
        const buttonText = button.textContent.trim();
        if (buttonText === '現在' || buttonText === 'Now' || buttonText.includes('現在') || buttonText.includes('now')) {
          return button;
        }
      }
    }
    
    return null;
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
      if (!row.WinnerID) return '無得標者';
      
      const nickName = row.NickName || '';
      const account = row.Account || '';
      
      if (nickName && account) {
        return `${nickName}(${account})`;
      } else if (nickName) {
        return nickName;
      } else if (account) {
        return account;
      } else {
        return `ID: ${row.WinnerID}`;
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
            if (!window.__statsButtonTriggered) {
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
  

  

  

  



  

  

  

  
  // 取得類別ID的輔助函數
  function getCategoryID(jsonData) {
    // 1. 優先使用現有的 CategoryID
    if (jsonData.CategoryID) {
      return jsonData.CategoryID;
    }
    
    // 2. 從 CategoryName 轉換
    if (jsonData.CategoryName && CATEGORY_MAPPING[jsonData.CategoryName]) {
      return CATEGORY_MAPPING[jsonData.CategoryName];
    }
    
    // 3. 預設值
    return 13;
  }
  
  // 從 CategoryID 取得類別名稱
  function getCategoryNameFromID(categoryID) {
    if (!categoryID) return '';
    
    for (const [name, id] of Object.entries(CATEGORY_MAPPING)) {
      if (id === categoryID) {
        return name;
      }
    }
    return '';
  }

  async function directSubmitToAPI(jsonData) {
    console.log('�� 開始直接 API 送出...');
    try {
      // 準備 API payload
      const payload = {
        CategoryID: getCategoryID(jsonData),
        Name: jsonData.Name || '',
        Description: jsonData.Description || '',
        InitPrice: jsonData.InitPrice || '0',
        OriginPrice: jsonData.OriginPrice || '0',
        MinAddPrice: jsonData.MinAddPrice || 10,
        StartDate: jsonData.StartDate || new Date().toISOString().slice(0, 19).replace('T', ' '),
        EndDate: jsonData.EndDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '), // ← 預設為兩周後
        DistID: jsonData.DistID || '231',
        DeliveryAddress: jsonData.DeliveryAddress || '',
        Length: jsonData.Length || '0',
        Width: jsonData.Width || '0',
        Height: jsonData.Height || '0',

        Photos: []
      };
      // 處理圖片
      if (jsonData.Photos && Array.isArray(jsonData.Photos) && jsonData.Photos.length > 0) {
        const hasBase64Images = jsonData.Photos.some(photo => photo.Photo && photo.Photo.startsWith('data:image'));
        if (hasBase64Images) {
          const uploadedPhotos = await uploadImagesWithCorrectAPI(jsonData.Photos);
          payload.Photos = uploadedPhotos.map(photo => ({ Photo: photo.uploadedUrl }));
        } else {
          payload.Photos = jsonData.Photos;
        }
      }
      console.log('📡 送出 API payload:', payload);
      // 送出 API 請求
      const response = await fetch('/BidMgr/api/Product/AddProduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      console.log('API 送出成功:', result);
      // 觸發查詢按鈕刷新表格
      setTimeout(() => {
        // 檢查是否是統計按鈕觸發的，如果是則跳過避免循環
        if (window.__statsButtonTriggered) {
          console.log('跳過查詢按鈕觸發，因為這是統計按鈕發起的操作');
          return;
        }

        const queryBtn = Array.from(document.querySelectorAll('button.el-button')).find(b => /查\s*詢/.test(b.textContent));
        if (queryBtn) {
          try {
            if (queryBtn.__vue__ && queryBtn.__vue__.$emit) {
              queryBtn.__vue__.$emit('click');
            } else {
              const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
              queryBtn.dispatchEvent(clickEvent);
            }
            console.log('查詢按鈕觸發成功，表格應該會重新載入');
          } catch (error) {
            console.error('觸發查詢按鈕時發生錯誤:', error);
          }
        } else {
          console.error('查詢按鈕未找到，無法重新載入表格');
        }
      }, 2000);
      return result;
    } catch (error) {
      console.error('API 送出失敗:', error);
      alert(` API 送出失敗: ${error.message}`);
      throw error;
    }
  }

  async function uploadImagesWithCorrectAPI(photos) {
    const uploaded = [];
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      if (photo.Photo && photo.Photo.startsWith('data:image')) {
        const file = optimizedBase64ToFile(photo.Photo, `image_${i + 1}.jpg`);
        const result = await uploadImage(file);
        uploaded.push({ ...photo, uploadedUrl: result.FilePath || result });
      } else if (photo.Photo) {
        uploaded.push(photo);
      }
    }
    return uploaded;
  }

})();