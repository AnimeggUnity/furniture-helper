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
    // 階層式統計數據結構
    const hierarchicalStats = {
      createDate: {}, // 建立日期的階層數據: year -> month -> day -> items[]
      endDate: {}     // 結束日期的階層數據: year -> month -> day -> items[]
    };
    
    // 競標資料查詢函數
    const fetchBidLog = (uuid) => new Promise(resolve => {
      if (!uuid) return resolve(null);
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `api/Product/GetBidLog?id=${uuid}`);
      xhr.setRequestHeader('accept', 'application/json, text/plain, */*');
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const arr = JSON.parse(xhr.responseText);
            resolve(Array.isArray(arr) ? arr : []);
          } catch { resolve([]); }
        } else {
          resolve([]);
        }
      };
      xhr.onerror = () => resolve([]);
      xhr.send();
    });

    // 處理單筆資料的函數
    const processRowData = async (row) => {
      // 基本商品資訊
      const itemData = {
        AutoID: row.AutoID,
        Name: row.Name || '未命名',
        IsGet: row.IsGet,
        IsPay: row.IsPay,
        NickName: row.NickName
      };

      // 嘗試找出 UUID 並獲取競標資訊
      const uuid = row.UUID || row.Guid || row.ProductID || row.ProductId || 
                   row.BidID || row.BidId || 
                   (Array.isArray(row.ID) ? row.ID.find(id => typeof id === 'string' && id.length > 20) : row.ID);
      
      if (uuid && typeof uuid === 'string' && uuid.length > 20) {
        const bids = await fetchBidLog(uuid);
        if (bids.length > 0) {
          // 取最高價
          const maxBid = bids.reduce((a, b) => 
            (parseFloat(a.BidPrice||a.Price||a.Amount||0) > parseFloat(b.BidPrice||b.Price||b.Amount||0) ? a : b)
          );
          itemData.BidPrice = maxBid.BidPrice || maxBid.Price || maxBid.Amount;
          itemData.Bidder = maxBid.BidderName || maxBid.UserName || maxBid.Name || maxBid.Bidder || 
                           maxBid.Account || maxBid.User || maxBid.BidderAccount || maxBid.BidderID ||
                           maxBid.CustomerName || maxBid.Customer || maxBid.MemberName || maxBid.Member;
          itemData.HasBids = true;
        } else {
          itemData.BidPrice = null;
          itemData.Bidder = null;
          itemData.HasBids = false;
        }
      } else {
        itemData.BidPrice = null;
        itemData.Bidder = null;
        itemData.HasBids = false;
      }

      return itemData;
    };

    // 並行處理所有資料
    (async () => {
      const processedRows = await Promise.all(data.map(processRowData));
      
      // 將處理好的資料加入階層結構
      data.forEach((row, index) => {
        const processedItem = processedRows[index];
        
        // CreateDate 階層統計
        const createDateRaw = row.CreateDate;
        const createDateStr = typeof createDateRaw === 'string' ? createDateRaw : createDateRaw?.toISOString?.() ?? '';
        const createDate = createDateStr.slice(0, 10); // YYYY-MM-DD
        
        if (createDate && createDate.length === 10) {
          const year = createDate.slice(0, 4);
          const month = createDate.slice(0, 7); // YYYY-MM
          
          // 初始化層級結構
          if (!hierarchicalStats.createDate[year]) {
            hierarchicalStats.createDate[year] = {};
          }
          if (!hierarchicalStats.createDate[year][month]) {
            hierarchicalStats.createDate[year][month] = {};
          }
          if (!hierarchicalStats.createDate[year][month][createDate]) {
            hierarchicalStats.createDate[year][month][createDate] = [];
          }
          
          hierarchicalStats.createDate[year][month][createDate].push(processedItem);
        }
        
        // EndDate 階層統計
        const endDateRaw = row.EndDate;
        const endDateStr = typeof endDateRaw === 'string' ? endDateRaw : endDateRaw?.toISOString?.() ?? '';
        const endDate = endDateStr.slice(0, 10); // YYYY-MM-DD
        
        if (endDate && endDate.length === 10) {
          const year = endDate.slice(0, 4);
          const month = endDate.slice(0, 7); // YYYY-MM
          
          // 初始化層級結構
          if (!hierarchicalStats.endDate[year]) {
            hierarchicalStats.endDate[year] = {};
          }
          if (!hierarchicalStats.endDate[year][month]) {
            hierarchicalStats.endDate[year][month] = {};
          }
          if (!hierarchicalStats.endDate[year][month][endDate]) {
            hierarchicalStats.endDate[year][month][endDate] = [];
          }
          
          hierarchicalStats.endDate[year][month][endDate].push(processedItem);
        }
      });
      
      window.postMessage({ source: 'vue-stats', hierarchicalStats }, '*');
    })();
  }

  if (source === 'run-vue-export') {
    window.postMessage({ source: 'vue-export', data }, '*');
  }

  if (source === 'run-vue-export-all') {
    window.postMessage({ source: 'vue-export-all', data }, '*');
  }

  if (source === 'run-vue-panel') {
    // 取得所有資料
    const panelData = data.map(row => ({ ...row }));
    
    // 依序查詢每一筆的競標紀錄
    const fetchBidLog = (uuid) => new Promise(resolve => {
      if (!uuid) return resolve(null);
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `api/Product/GetBidLog?id=${uuid}`);
      xhr.setRequestHeader('accept', 'application/json, text/plain, */*');
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const arr = JSON.parse(xhr.responseText);
            resolve(Array.isArray(arr) ? arr : []);
          } catch { resolve([]); }
        } else {
          resolve([]);
        }
      };
      xhr.onerror = () => resolve([]);
      xhr.send();
    });
    
    (async () => {
      for (const row of panelData) {
        // 嘗試找出 UUID
        const uuid = row.UUID || row.Guid || row.ProductID || row.ProductId || 
                     row.BidID || row.BidId || 
                     (Array.isArray(row.ID) ? row.ID.find(id => typeof id === 'string' && id.length > 20) : row.ID);
        
        if (uuid && typeof uuid === 'string' && uuid.length > 20) {
          const bids = await fetchBidLog(uuid);
          row.BidChecked = true; // 標記已檢查競標資料
          if (bids.length > 0) {
            // 取最高價
            const maxBid = bids.reduce((a, b) => 
              (parseFloat(a.BidPrice||a.Price||a.Amount||0) > parseFloat(b.BidPrice||b.Price||b.Amount||0) ? a : b)
            );
            row.BidPrice = maxBid.BidPrice || maxBid.Price || maxBid.Amount;
            
            // 嘗試所有可能的出價者欄位名稱
            row.Bidder = maxBid.BidderName || maxBid.UserName || maxBid.Name || maxBid.Bidder || 
                        maxBid.Account || maxBid.User || maxBid.BidderAccount || maxBid.BidderID ||
                        maxBid.CustomerName || maxBid.Customer || maxBid.MemberName || maxBid.Member;
            row.HasBids = true; // 標記有競標資料
          } else {
            row.BidPrice = null;
            row.Bidder = null;
            row.HasBids = false; // 標記無競標資料
          }
        } else {
          row.BidPrice = null;
          row.Bidder = null;
          row.BidChecked = false; // 標記未檢查（無有效UUID）
          row.HasBids = false;
        }
      }
      window.postMessage({ source: 'vue-panel-data', data: panelData }, '*');
    })();
    return;
  }

  if (source === 'run-vue-print') {
    window.postMessage({ source: 'vue-print', data }, '*');
  }



});