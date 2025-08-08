# 競標紀錄功能整合指南

## 概述
此指南說明如何將競標紀錄功能整合到現有的傢俱助手擴充功能中。

## 整合步驟

### 1. 修改 inject.js

在 `inject.js` 中找到 `run-vue-panel` 的處理邏輯，將其替換為：

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

### 2. 修改 content.js

在 `content.js` 的 `buildPanel` 函數中，找到資料顯示的部分，將其修改為：

```javascript
// 在 buildPanel 函數中的資料顯示部分
<div style="color: #666; font-size: 13px; margin-top: 4px;">
  🆔 ${item.AutoID} 📍 ${item.DistName || '無'} 🕒 ${(item.CreateDate || '').split('T')[0]}
  ${item.BidPrice ? `<br>💰 最高競標價: ${item.BidPrice} 元` : ''}
  ${item.Bidder ? `<br>👤 最高出價者: ${item.Bidder}` : ''}
</div>
```

## 功能說明

### 整合後的功能
1. **手動更新表格**：點擊查詢按鈕
2. **點擊資料面板**：點擊「📂 資料面板」按鈕
3. **自動查詢競標**：系統會自動為每筆資料查詢競標紀錄
4. **顯示結果**：在資料面板中顯示最高競標價與出價者

### 顯示格式
- 🆔 商品編號 📍 行政區 🕒 建立日期
- 💰 最高競標價: XX 元（如果有競標）
- 👤 最高出價者: XXX（如果有競標）

## 技術細節

### API 端點
- **端點**: `api/Product/GetBidLog`
- **方法**: GET
- **參數**: `id` (UUID格式)
- **認證**: 需要 session cookie

### 資料欄位映射
- **價格**: `BidPrice`, `Price`, `Amount`
- **出價者**: `BidderName`, `UserName`, `Name`, `Bidder`, `Account`, `User`, `BidderAccount`, `BidderID`, `CustomerName`, `Customer`, `MemberName`, `Member`

### UUID 提取邏輯
```javascript
const uuid = row.UUID || row.Guid || row.ProductID || row.ProductId || 
             row.BidID || row.BidId || 
             (Array.isArray(row.ID) ? row.ID.find(id => typeof id === 'string' && id.length > 20) : row.ID);
```

## 注意事項

1. **認證要求**: 需要有效的 session 才能呼叫 API
2. **請求頻率**: 避免過於頻繁的 API 呼叫
3. **錯誤處理**: 已包含網路錯誤和資料解析錯誤處理
4. **欄位變化**: 支援多種欄位名稱格式

## 測試步驟

1. 重新載入擴充功能
2. 點擊查詢按鈕更新表格
3. 點擊「📂 資料面板」按鈕
4. 檢查每筆資料是否顯示競標資訊

## 相關文件

- `BID_LOG_FEATURE.md`: 詳細的功能實作說明
- `API_ANALYSIS_RESULTS.md`: API 分析結果與技術文件 