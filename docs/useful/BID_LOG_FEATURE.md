# 競標紀錄功能實作說明

## 功能概述
在資料面板中自動顯示每筆商品的最高競標價與出價者資訊。

## 實作流程

### 1. 手動更新表格
- 點擊查詢按鈕更新表格資料

### 2. 點擊資料面板
- 點擊「📂 資料面板」按鈕
- 系統自動執行以下流程：
  1. 取得所有表格資料
  2. 對每筆資料提取UUID
  3. 呼叫API取得競標紀錄
  4. 計算最高出價與出價者
  5. 將資訊寫入資料物件
  6. 顯示在資料面板中

## 程式碼修改

### inject.js 修改

#### 1. 修改 run-vue-panel 處理邏輯
```javascript
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
        } else {
          row.BidPrice = null;
          row.Bidder = null;
        }
      } else {
        row.BidPrice = null;
        row.Bidder = null;
      }
    }
    window.postMessage({ source: 'vue-panel-data', data: panelData }, '*');
  })();
  return;
}
```

### content.js 修改

#### 1. 修改 buildPanel 顯示邏輯
```javascript
// 在 buildPanel 函數中的資料顯示部分
<div style="color: #666; font-size: 13px; margin-top: 4px;">
  🆔 ${item.AutoID} 📍 ${item.DistName || '無'} 🕒 ${(item.CreateDate || '').split('T')[0]}
  ${item.BidPrice ? `<br>💰 最高競標價: ${item.BidPrice} 元` : ''}
  ${item.Bidder ? `<br>👤 最高出價者: ${item.Bidder}` : ''}
</div>
```

## 關鍵技術點

### 1. UUID 提取邏輯
```javascript
const uuid = row.UUID || row.Guid || row.ProductID || row.ProductId || 
             row.BidID || row.BidId || 
             (Array.isArray(row.ID) ? row.ID.find(id => typeof id === 'string' && id.length > 20) : row.ID);
```

### 2. API 呼叫格式
- **端點**: `api/Product/GetBidLog?id=${uuid}`
- **方法**: GET
- **標頭**: `accept: application/json, text/plain, */*`
- **認證**: 需要 session cookie

### 3. 競標資料欄位映射
- **價格欄位**: `BidPrice`, `Price`, `Amount`
- **出價者欄位**: `BidderName`, `UserName`, `Name`, `Bidder`, `Account`, `User`, `BidderAccount`, `BidderID`, `CustomerName`, `Customer`, `MemberName`, `Member`

### 4. 最高價計算
```javascript
const maxBid = bids.reduce((a, b) => 
  (parseFloat(a.BidPrice||a.Price||a.Amount||0) > parseFloat(b.BidPrice||b.Price||b.Amount||0) ? a : b)
);
```

## 使用方式

1. **更新表格**: 點擊查詢按鈕
2. **開啟面板**: 點擊「📂 資料面板」按鈕
3. **查看結果**: 每筆資料會顯示最高競標價與出價者

## 注意事項

- 需要有效的 session 才能呼叫 API
- UUID 格式必須正確（長度 > 20 的字串）
- 競標資料可能為空陣列
- 出價者欄位名稱可能因系統版本而異

## 擴展建議

- 可增加顯示所有競標記錄的功能
- 可增加競標時間顯示
- 可增加競標狀態顯示
- 可增加競標趨勢分析 