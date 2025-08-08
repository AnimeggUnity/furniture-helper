# 🚀 快速使用指南 - 競標紀錄分析

## 🎯 重大發現！

API端點分析成功找到了競標紀錄的API端點：

**端點**: `api/Product/GetBidLog`  
**方法**: GET  
**參數**: `id` (商品ID)

## 📋 使用方式

### 方法一：使用擴充功能按鈕（推薦）

1. **重新載入擴充功能**
   - 在Chrome擴充功能管理頁面重新載入家具助手擴充功能

2. **點擊競標分析按鈕**
   - 在後台管理系統頁面點擊「🎯 競標分析」按鈕
   - 系統會自動分析所有商品的18元出價

3. **查看結果**
   - 在Console中查看分析結果
   - 選擇是否匯出CSV檔案

### 方法二：手動執行（進階）

在瀏覽器Console中執行：

```javascript
// 載入競標分析工具
fetch('bid-log-analyzer.js').then(r => r.text()).then(eval);

// 分析所有18元出價
analyzeBids(18);

// 或分析特定價格
analyzeBids(20); // 分析20元出價
```

### 方法三：直接API呼叫

```javascript
// 取得特定商品的競標紀錄
fetch('api/Product/GetBidLog?id=12345')
  .then(response => response.json())
  .then(data => {
    console.log('競標紀錄:', data);
    
    // 找出18元出價
    const bid18 = data.find(bid => bid.price === 18);
    if (bid18) {
      console.log('找到18元出價:', bid18);
    }
  });
```

## 🔍 分析結果範例

```
🚀 開始快速分析當前頁面所有商品...
📋 從表格中找到 150 個商品ID
🔍 正在取得商品 12345 的競標紀錄...
✅ 商品 12345 競標紀錄: [...]
💰 找到 1 筆價格 18 元的出價:
  1. 出價人: Tank (animegg)
     價格: 18 元
     時間: 2025-07-07 15:54
     狀態: active
```

## 📊 可用函數

### 基本函數
- `getBidLog(productId)` - 取得單一商品的競標紀錄
- `analyzeBids(targetPrice)` - 分析所有商品的特定價格出價
- `exportBidResults(results)` - 匯出分析結果

### 進階用法
```javascript
// 批次分析多個商品
const productIds = [12345, 12346, 12347];
window.bidAnalyzer.analyzeMultipleProducts(productIds, 18);

// 自訂分析
const bidLog = await getBidLog(12345);
const results = window.bidAnalyzer.analyzeBidLog(bidLog, 18);
```

## 💡 實用技巧

### 1. 找出所有18元出價
```javascript
analyzeBids(18);
```

### 2. 分析不同價格
```javascript
analyzeBids(20); // 20元出價
analyzeBids(50); // 50元出價
```

### 3. 匯出結果
```javascript
const results = await analyzeBids(18);
exportBidResults(results);
```

### 4. 單一商品分析
```javascript
const bidLog = await getBidLog(12345);
console.log('競標紀錄:', bidLog);
```

## ⚠️ 注意事項

1. **請求頻率** - 系統會自動延遲500ms避免請求過於頻繁
2. **權限檢查** - 確保你有權限存取競標紀錄API
3. **資料格式** - 競標紀錄格式可能因系統而異
4. **錯誤處理** - 系統會自動處理網路錯誤和格式錯誤

## 🎉 成功案例

使用這個工具，你可以：

1. **快速找出18元出價** - 不需要手動點擊每個商品的競標紀錄按鈕
2. **批次分析** - 一次分析數百個商品
3. **資料匯出** - 將結果匯出為CSV檔案進行進一步分析
4. **自動化** - 建立自動化腳本進行定期分析

## 🔧 故障排除

### 問題：API呼叫失敗
**解決方案**：
- 檢查網路連線
- 確認API端點是否正確
- 檢查瀏覽器Console中的錯誤訊息

### 問題：沒有找到競標紀錄
**解決方案**：
- 確認商品ID是否正確
- 檢查該商品是否有競標紀錄
- 嘗試手動點擊競標紀錄按鈕確認

### 問題：擴充功能按鈕不顯示
**解決方案**：
- 重新載入擴充功能
- 確認頁面已完全載入
- 檢查Console中是否有錯誤訊息

## 📞 支援

如果遇到問題，請：

1. 檢查瀏覽器Console中的錯誤訊息
2. 確認擴充功能是否正確載入
3. 嘗試重新載入頁面
4. 使用手動執行方式進行測試

---

**恭喜！你現在擁有了強大的競標紀錄分析工具！** 🎉 