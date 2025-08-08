# 出價資料分析技術報告

## 分析目標
找出家具拍賣網後台系統中價格18元的顯示位置，並分析出價資料的存取方式。

## 分析過程記錄

### 第一階段：初步探索
**時間**: 2025-01-27  
**目標**: 了解系統架構和資料結構

**執行指令**:
```javascript
window.postMessage({ source: 'run-vue-data-analysis' }, '*');
```

**發現**:
- 系統使用Vue.js + Element UI + VXE Table
- 主表格中有21個欄位，包含基本商品資訊
- 沒有在主表格中發現目前價格或出價紀錄

### 第二階段：表格內容分析
**時間**: 2025-01-27  
**目標**: 詳細分析表格結構和內容

**執行指令**:
```javascript
window.postMessage({ source: 'run-vue-table-content-analysis' }, '*');
```

**發現**:
- 表格行數: 4行（包含表頭和資料）
- 表頭數量: 42個（包含固定欄位和一般欄位）
- 實際資料: 1筆（LED氣氛蠟燭）
- 包含"18"的元素: 10個（主要是日期）
- **重要**: 主表格中沒有顯示價格18元

### 第三階段：跳窗分析
**時間**: 2025-01-27  
**目標**: 分析競標紀錄跳窗中的出價資料

**執行指令**:
```javascript
window.postMessage({ source: 'run-vue-bid-modal-analysis' }, '*');
```

**發現**:
- 總跳窗數量: 42個
- 競標相關跳窗: 6個
- 出價紀錄跳窗標題: "出價紀錄"
- 跳窗類別: `edit-modal modal__maxheight vxe-modal--wrapper`

**出價資料結構**:
```
表頭: 出價人 | 價格 | 出價時間
資料: Tank (animegg) | 18 | 2025-07-07 15:54
```

### 第四階段：不跳窗資料搜尋
**時間**: 2025-01-27  
**目標**: 檢查是否可以不跳窗就取得出價資料

**執行指令**:
```javascript
window.postMessage({ source: 'run-vue-bid-data-without-modal' }, '*');
```

**發現**:
- Vue根元素: 14個
- 隱藏元素: 5個（主要是CSS樣式）
- Data屬性元素: 0個
- 全域變數: 0個
- **結論**: 無法不跳窗直接取得出價資料

## 技術發現

### 1. 資料存取限制
- ❌ **無法從主頁面直接取得出價資料**
- ❌ **沒有在localStorage/sessionStorage中儲存**
- ❌ **沒有在全域變數中儲存**
- ❌ **沒有在隱藏DOM元素中儲存**
- ✅ **需要點擊競標紀錄按鈕開啟跳窗**

### 2. 價格顯示位置
**18元價格的具體位置**:
- **標籤**: `TD`
- **類別**: `vxe-body--column col_26 col--right col--ellipsis`
- **容器**: `DIV` 類別 `vxe-cell c--tooltip`
- **內容**: `"18"`

### 3. 系統架構特點
- **前端框架**: Vue.js
- **UI組件**: Element UI + VXE Table
- **資料載入**: 動態載入，需要API呼叫
- **狀態管理**: Vue組件內部狀態管理

## 技術挑戰

### 1. 動態資料載入
**問題**: 出價資料不是預先載入的
**影響**: 無法透過靜態分析取得完整資料
**解決方案**: 需要觸發特定操作或API呼叫

### 2. Vue組件封裝
**問題**: 資料被封裝在Vue組件中
**影響**: 需要理解Vue的資料綁定機制
**解決方案**: 分析Vue組件的資料結構

### 3. 跳窗依賴
**問題**: 出價資料依賴跳窗顯示
**影響**: 無法直接從主頁面取得
**解決方案**: 模擬使用者操作或API攔截

## 解決方案評估

### 方案1: 自動化操作
**優點**:
- 模擬真實使用者操作
- 可以取得完整的跳窗資料
- 相對穩定可靠

**缺點**:
- 需要等待跳窗載入
- 可能受到UI變更影響
- 操作複雜度較高

**實現方式**:
```javascript
// 自動點擊競標紀錄按鈕
const bidButton = document.querySelector('button i.el-icon-search').closest('button');
bidButton.click();

// 等待跳窗出現並擷取資料
setTimeout(() => {
  const bidModal = document.querySelector('.vxe-modal--wrapper');
  const priceElement = bidModal.querySelector('td:contains("18")');
}, 1000);
```

### 方案2: API攔截
**優點**:
- 直接取得原始資料
- 不受UI變更影響
- 效率較高

**缺點**:
- 需要分析API結構
- 可能受到API變更影響
- 需要處理認證問題

**實現方式**:
```javascript
// 攔截fetch請求
const originalFetch = window.fetch;
window.fetch = function(...args) {
  if (args[0].includes('bid')) {
    console.log('出價API請求:', args[0]);
  }
  return originalFetch.apply(this, args);
};
```

### 方案3: Vue實例分析
**優點**:
- 直接存取Vue資料
- 不受UI限制
- 資料結構清晰

**缺點**:
- 需要深入理解Vue架構
- 可能受到Vue版本影響
- 實現複雜度較高

## 最終結論

### 主要發現
1. **出價資料位置**: 在競標紀錄跳窗的表格中
2. **價格顯示**: 18元顯示在TD標籤中，類別為`vxe-body--column col_26`
3. **資料存取**: 需要點擊按鈕開啟跳窗才能取得
4. **技術限制**: 無法不跳窗直接取得出價資料

### 技術建議
1. **短期解決方案**: 使用自動化腳本點擊按鈕
2. **中期解決方案**: 實現API請求攔截功能
3. **長期解決方案**: 分析Vue組件的資料結構

### 未來改進方向
1. 開發更穩定的自動化操作
2. 實現API請求攔截功能
3. 優化資料提取效率
4. 增加錯誤處理機制
5. 考慮使用Chrome DevTools Protocol

## 技術文件

### 相關檔案
- `inject.js`: 包含所有分析指令
- `content.js`: 主要內容腳本
- `manifest.json`: 擴充功能配置

### 分析指令列表
1. `run-vue-data-analysis`: Vue資料分析
2. `run-vue-table-content-analysis`: 表格內容分析
3. `run-vue-bid-modal-analysis`: 跳窗分析
4. `run-vue-bid-data-without-modal`: 不跳窗資料搜尋
5. `run-vue-auto-click-bid-button`: 自動點擊按鈕

### 使用方式
```javascript
// 在瀏覽器Console中執行
window.postMessage({ source: '指令名稱' }, '*');
```

---

**分析完成時間**: 2025-01-27  
**分析結論**: 出價資料需要透過跳窗取得，無法直接從主頁面提取  
**建議方案**: 使用自動化操作或API攔截 