# 家具助手擴充功能 - 專案備份總結

## 專案概述
這是一個專為新北市再生家具系統設計的 Chrome 擴充功能，提供多種實用功能來提升工作效率。

## 核心功能模組

### 1. 📈 年度統計功能
- **功能**: 顯示年度和月份的資料統計
- **實作**: 自動計算各時期的資料筆數，以彈出視窗形式呈現
- **觸發**: 點擊「📈 年度統計」按鈕
- **資料來源**: Vue 表格資料 (`vue.tableFullData`)

### 2. 📥 資料匯出功能
- **輕量匯出**: 匯出基本欄位（編號、名稱、行政區、建立日期）
- **全部匯出**: 匯出完整資料包含所有欄位
- **格式**: CSV 格式下載
- **檔案命名**: `furniture-export-{日期}.csv`

### 3. 📂 資料面板功能
- **功能**: 側邊面板顯示所有家具資料
- **特色**: 
  - 支援 AutoID 搜尋功能
  - 可預覽圖片和下載 JSON 檔案
  - 包含圖片下載功能
  - **競標紀錄整合**（重要功能）

#### 競標紀錄整合詳情
- **API 端點**: `api/Product/GetBidLog?id=${uuid}`
- **資料顯示**: 每筆商品顯示最高競標價與出價者資訊
- **UUID 提取策略**:
  ```javascript
  const uuid = row.UUID || row.Guid || row.ProductID || row.ProductId || 
               row.BidID || row.BidId || 
               (Array.isArray(row.ID) ? row.ID.find(id => typeof id === 'string' && id.length > 20) : row.ID);
  ```
- **競標資料欄位映射**:
  - 價格: `BidPrice`, `Price`, `Amount`
  - 出價者: `BidderName`, `UserName`, `Name`, `Bidder`, `Account`, `User`, `BidderAccount`, `BidderID`, `CustomerName`, `Customer`, `MemberName`, `Member`

### 4. 🖨️ 列印表格功能
- **功能**: 生成格式化的列印頁面
- **內容**: 包含完整的家具資訊和得標者資訊
- **格式**: 美化的 HTML 列印頁面

### 5. 📥 JSON 匯入功能
- **功能**: 在編輯表單中匯入 JSON 檔案，自動填充表單欄位
- **特色**: 
  - 支援 Element UI Select 元件的模擬點擊
  - 完整的表單驗證功能
  - 自動處理 Vue 組件狀態更新

#### JSON 格式要求
```json
{
  "AutoID": 2047,
  "Name": "E27 夾式筒燈 - 6",
  "CategoryName": "燈具、燈飾",
  "DistName": "新店區",
  "CreateDate": "2025-04-19T18:17:15.643",
  "Description": "產品描述...",
  "Length": 0,
  "Width": 0,
  "Height": 0,
  "DeliveryAddress": "新北市新店區薏仁坑路自強巷2-3號",
  "InitPrice": 20,
  "OriginPrice": 20,
  "Photos": [...]
}
```

#### 支援的欄位映射
| 表單標籤 | JSON 欄位 | 說明 |
|---------|----------|------|
| 品名 | Name | 家具名稱 |
| 類別 | CategoryName | 家具類別 |
| 行政區 | DistName | 行政區名稱 |
| 產品描述 | Description | 產品詳細描述 |
| 長 | Length | 長度 |
| 寬 | Width | 寬度 |
| 高 | Height | 高度 |
| 交貨地點 | DeliveryAddress | 交貨地址 |
| 起標價格 | InitPrice | 起標價格 |
| 原價 | OriginPrice | 原價 |

### 6. 🔍 API 端點分析功能
- **功能**: 分析網站中的 API 端點，找出競標紀錄的 API
- **分析範圍**:
  - Vue 組件 API 分析
  - 網路請求攔截
  - 頁面 API 端點搜尋
  - Vue 組件配置分析
  - 自動觸發測試

#### 發現的重要 API
```
端點: api/Product/GetBidLog
方法: GET
參數: id (UUID格式)
完整URL: https://recycledstuff.ntpc.gov.tw/BidMgr/api/Product/GetBidLog?id={uuid}
```

### 7. 🖼️ 圖片上傳自動化功能
- **功能**: 自動化圖片上傳流程
- **特色**:
  - 支援 base64 圖片格式
  - 批次上傳功能
  - 自動確認對話框（已放棄，改為手動點擊）
  - 點擊監聽器記錄按鈕資訊

## 技術架構

### 檔案結構
```
furniture-helper/
├── content.js          # 主要功能實現，包含 UI 操作和資料處理
├── inject.js           # Vue 資料存取和事件處理
├── manifest.json       # 擴充功能配置檔案
├── icon.png           # 擴充功能圖示
└── docs/              # 技術文件
    ├── useful/        # 有用文件
    └── archive/       # 歸檔文件
```

### 核心技術
- **Chrome Extension**: 瀏覽器擴充功能
- **Content Script**: 內容腳本注入
- **Vue.js**: 前端框架（目標網站）
- **Element UI**: UI 組件庫（目標網站）
- **VXE Table**: 表格組件（目標網站）

### 關鍵函數

#### content.js 重要函數
- `showModal()`: 顯示統計彈窗
- `exportToCSV()`: 輕量匯出功能
- `exportAllToCSV()`: 全部匯出功能
- `buildPanel()`: 建立資料面板
- `fillForm()`: JSON 匯入核心邏輯
- `forceVueUpdate()`: 強制更新 Vue 組件
- `validateFormData()`: 表單驗證
- `insertImportButton()`: 插入匯入按鈕

#### inject.js 重要函數
- Vue 資料存取邏輯
- 競標紀錄 API 呼叫
- API 端點分析
- 網路請求攔截

## 開發者功能

### 除錯指令
```javascript
// 欄位分析
window.postMessage({ source: 'run-vue-debug-fields' }, '*')

// Payment 物件分析
window.postMessage({ source: 'run-vue-payment-analysis' }, '*')

// WinnerID 欄位分析
window.postMessage({ source: 'run-vue-winner-analysis' }, '*')

// 競標紀錄分析
window.postMessage({ source: 'run-vue-bid-history-analysis' }, '*')

// API端點分析
window.postMessage({ source: 'run-vue-api-endpoint-analysis' }, '*')
```

## 重要技術細節

### 1. Vue 資料存取
```javascript
const table = document.querySelector('.vxe-table');
let vue = table?.__vue__;
let safety = 20;
while (vue && !vue.tableFullData && safety-- > 0) vue = vue.$parent;
const data = vue.tableFullData;
```

### 2. Element UI Select 模擬點擊
```javascript
// 點擊輸入框開啟下拉選單
input.click();

// 延遲確保下拉選單開啟
setTimeout(() => {
  // 點擊選項
  matchedOption.click();
  
  // 觸發必要的事件
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}, 100);
```

### 3. 網路請求攔截
```javascript
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function(method, url, ...args) {
  this._method = method;
  this._url = url;
  return originalXHROpen.apply(this, [method, url, ...args]);
};
```

## 已知問題與解決方案

### 1. 圖片上傳自動確認
- **問題**: 無法可靠地自動點擊確認按鈕
- **原因**: 按鈕可能動態渲染或在 Shadow DOM 中
- **解決方案**: 改為手動點擊，保留點擊監聽器記錄按鈕資訊

### 2. Element UI Select 驗證
- **問題**: 直接設定值可能不會觸發驗證
- **解決方案**: 使用模擬點擊 + 事件觸發

### 3. UUID 格式多樣性
- **問題**: 不同商品可能使用不同的 UUID 欄位名稱
- **解決方案**: 使用優先順序策略提取 UUID

## 未來擴展建議

### 1. 功能擴展
- 競標趨勢分析
- 競標時間統計
- 競標者分析
- 價格分布圖表
- 競標狀態追蹤

### 2. 效能優化
- 批次 API 呼叫
- 快取機制
- 錯誤重試
- 請求限流

### 3. 使用者體驗
- 更直觀的操作介面
- 進度指示器
- 錯誤提示優化
- 快捷鍵支援

## 安裝與使用

### 安裝方式
1. 下載擴充功能檔案
2. 開啟 Chrome 擴充功能管理頁面
3. 啟用開發者模式
4. 載入未封裝項目
5. 選擇擴充功能資料夾

### 使用流程
1. 進入新北市再生家具系統
2. 點擊查詢按鈕更新表格資料
3. 使用各種功能按鈕進行操作

## 注意事項

1. **認證要求**: 需要有效的 session cookie 才能使用 API 功能
2. **請求頻率**: 避免過於頻繁的 API 呼叫
3. **錯誤處理**: 妥善處理網路錯誤和資料解析錯誤
4. **欄位變化**: 欄位名稱可能因系統版本而異
5. **資料格式**: 回應格式可能因不同端點而異

---

**最後更新**: 2025-01-XX
**版本**: 當前版本
**狀態**: 功能完整，準備恢復 