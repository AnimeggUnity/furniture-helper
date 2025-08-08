# 🔍 API端點分析功能使用指南

## 功能概述

API端點分析功能是一個強大的工具，可以幫助你找出家具拍賣網後台系統中競標紀錄的API端點，避免需要透過跳窗來取得資料。這個功能會自動分析Vue組件、攔截網路請求，並提供詳細的分析報告。

## 主要功能

### 1. Vue組件API分析
- 自動掃描所有Vue實例
- 分析Vue組件中的API呼叫方法
- 檢查Vue組件的API配置

### 2. 網路請求攔截
- 攔截fetch請求
- 攔截XMLHttpRequest請求
- 攔截axios請求（如果存在）
- 自動識別競標相關的API請求

### 3. 頁面API端點搜尋
- 搜尋script標籤中的API端點
- 使用正則表達式匹配API URL模式
- 識別競標相關的端點

### 4. 自動觸發測試
- 自動點擊競標紀錄按鈕
- 觀察API呼叫過程
- 記錄請求參數和回應

## 使用方式

### 方法一：使用擴充功能按鈕

1. **載入擴充功能**
   - 確保家具助手擴充功能已正確載入
   - 在後台管理系統頁面中應該能看到「🔍 API端點分析」按鈕

2. **點擊分析按鈕**
   - 點擊「🔍 API端點分析」按鈕
   - 系統會自動開始分析過程

3. **查看分析結果**
   - 開啟瀏覽器開發者工具（F12）
   - 切換到Console標籤
   - 查看詳細的分析報告

### 方法二：使用Console指令

在瀏覽器Console中直接執行：

```javascript
// 觸發API端點分析
window.postMessage({ source: 'run-vue-api-endpoint-analysis' }, '*');
```

### 方法三：使用測試頁面

1. **開啟測試頁面**
   - 在瀏覽器中開啟 `test-api-analysis.html`
   - 這個頁面模擬了真實的環境

2. **進行測試**
   - 點擊「🔍 競標紀錄 (含API呼叫)」按鈕
   - 或使用Console指令進行測試

## 分析結果解讀

### 1. Vue實例分析結果

```
🔍 Vue實例 1:
  方法數量: 15
  🎯 發現API方法: fetchBidHistory
  🎯 發現API方法: searchBids
  🎯 發現API相關資料: apiEndpoint = /api/bid/history
```

**解讀**：
- 找到15個Vue方法
- 其中2個方法包含API呼叫
- 發現API端點配置

### 2. 網路請求分析結果

```
🌐 Fetch請求: GET /api/bid/history/12345
🎯 發現競標相關API請求: /api/bid/history/12345
```

**解讀**：
- 識別出競標相關的API請求
- 記錄了請求方法和URL

### 3. API端點搜尋結果

```
🎯 發現API端點: /api/bid/history/{id}
🎯 發現API端點: /api/bid/search
🎯 發現API端點: /api/furniture/{id}/bids
```

**解讀**：
- 找到3個可能的API端點
- 這些端點可能用於取得競標資料

## 預期發現的API端點

根據分析，你可能會發現以下類型的API端點：

### 1. 競標紀錄相關
- `GET /api/bid/history/{id}` - 取得特定商品的競標紀錄
- `GET /api/furniture/{id}/bids` - 取得家具的出價紀錄
- `POST /api/bid/search` - 搜尋競標資料

### 2. 可能的參數
- `furnitureId` - 家具ID
- `autoId` - 自動編號
- `page` - 分頁參數
- `limit` - 每頁筆數

### 3. 預期的回應格式
```json
{
  "success": true,
  "data": [
    {
      "bidder": "Tank (animegg)",
      "price": 18,
      "bidTime": "2025-07-07T15:54:00Z",
      "status": "active"
    }
  ],
  "total": 1
}
```

## 實際應用建議

### 1. 直接API呼叫
一旦找到API端點，你可以：

```javascript
// 直接呼叫API取得競標紀錄
fetch('/api/bid/history/12345')
  .then(response => response.json())
  .then(data => {
    console.log('競標紀錄:', data);
    // 處理資料，例如找出價格18元的出價
    const bid18 = data.data.find(bid => bid.price === 18);
    if (bid18) {
      console.log('找到18元出價:', bid18);
    }
  });
```

### 2. 批次處理
```javascript
// 批次取得多個商品的競標紀錄
const furnitureIds = [12345, 12346, 12347];
const promises = furnitureIds.map(id => 
  fetch(`/api/bid/history/${id}`).then(r => r.json())
);

Promise.all(promises)
  .then(results => {
    console.log('所有競標紀錄:', results);
  });
```

### 3. 資料面板整合
```javascript
// 在資料面板中顯示競標資訊
function updatePanelWithBidData(furnitureId) {
  fetch(`/api/bid/history/${furnitureId}`)
    .then(response => response.json())
    .then(data => {
      // 更新資料面板
      const panel = document.getElementById('furniture-panel');
      // 添加競標資訊到面板
    });
}
```

## 注意事項

### 1. 權限檢查
- 確保你有權限存取這些API端點
- 某些API可能需要特定的認證或權限

### 2. 請求頻率
- 避免過於頻繁的API呼叫
- 考慮實作快取機制

### 3. 錯誤處理
```javascript
fetch('/api/bid/history/12345')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .catch(error => {
    console.error('API呼叫失敗:', error);
  });
```

### 4. 資料驗證
- 驗證API回應的資料格式
- 處理空資料或錯誤資料的情況

## 故障排除

### 1. 沒有找到API端點
- 檢查網路請求攔截器是否正常運作
- 確認競標紀錄按鈕是否被正確點擊
- 檢查Console中是否有錯誤訊息

### 2. API請求失敗
- 檢查網路連線
- 確認API端點URL是否正確
- 檢查是否需要特定的請求標頭

### 3. 資料格式不符預期
- 分析實際的API回應格式
- 調整資料處理邏輯
- 檢查API版本差異

## 進階功能

### 1. 自動化腳本
```javascript
// 自動分析所有商品的競標紀錄
async function analyzeAllBids() {
  const tableData = window.__tableFullData;
  const results = [];
  
  for (const item of tableData) {
    try {
      const response = await fetch(`/api/bid/history/${item.AutoID}`);
      const data = await response.json();
      results.push({
        autoId: item.AutoID,
        name: item.Name,
        bids: data.data
      });
    } catch (error) {
      console.error(`分析商品 ${item.AutoID} 失敗:`, error);
    }
  }
  
  return results;
}
```

### 2. 資料匯出
```javascript
// 匯出競標資料
function exportBidData(bidData) {
  const csv = [
    ['商品ID', '商品名稱', '出價人', '價格', '出價時間'].join(','),
    ...bidData.flatMap(item => 
      item.bids.map(bid => 
        [item.autoId, item.name, bid.bidder, bid.price, bid.bidTime].join(',')
      )
    )
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bid-data.csv';
  a.click();
}
```

## 總結

API端點分析功能提供了強大的工具來找出競標紀錄的API端點。一旦找到正確的端點，你就可以：

1. **直接取得資料** - 不需要透過跳窗
2. **批次處理** - 一次處理多個商品
3. **自動化** - 建立自動化腳本
4. **資料整合** - 將競標資料整合到其他功能中

這個功能大大提升了資料分析的效率和靈活性，讓你可以更深入地分析出價資料，特別是找出價格18元的出價記錄。 