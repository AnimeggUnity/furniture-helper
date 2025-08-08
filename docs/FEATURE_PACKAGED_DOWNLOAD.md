# 打包下載功能實作說明

## 功能概述

在資料面板的每個商品旁邊新增了「打包下載」按鈕，當使用者點擊時會：

1. 將商品的所有圖片轉換為 Base64 編碼
2. 將所有商品資訊和 Base64 圖片打包到單一 JSON 檔案
3. 自動下載這個完整的 JSON 檔案

## 實作細節

### 1. UI 變更
- 在每個商品項目旁邊新增綠色的「打包下載」按鈕
- 按鈕在處理過程中會顯示「處理中...」並變為灰色
- 處理完成後恢復原始狀態

### 2. 圖片轉換功能
- 使用 `convertImageToBase64()` 函數將圖片轉換為 Base64
- 支援跨域圖片處理（使用 `crossOrigin = 'anonymous'`）
- 使用 Canvas API 進行圖片轉換
- 設定 JPEG 格式，品質為 0.8 以平衡檔案大小和品質

### 3. 錯誤處理
- 如果某張圖片轉換失敗，會在 JSON 中保留原始資料並標記錯誤
- 不會因為單張圖片失敗而中斷整個下載過程
- 提供友善的錯誤提示

### 4. 輸出格式
JSON 檔案包含：
- 所有原始商品資訊
- Base64 編碼的圖片資料
- 匯出資訊（時間、類型、圖片數量等）
- 原始圖片 URL 作為參考

## 使用方式

1. 開啟資料面板（點擊「📂 資料面板」按鈕）
2. 在想要下載的商品旁邊點擊「打包下載」按鈕
3. 等待處理完成（會顯示「處理中...」）
4. 系統會自動下載 `商品名稱_package.json` 檔案

## 技術特點

- **非同步處理**：使用 async/await 處理圖片轉換
- **記憶體優化**：使用 Canvas 進行圖片處理，避免記憶體洩漏
- **跨域支援**：處理來自不同網域的圖片
- **錯誤恢復**：單張圖片失敗不影響其他圖片處理
- **使用者體驗**：提供即時狀態回饋

## 檔案結構

```
商品名稱_package.json
{
  "AutoID": "12345",
  "Name": "商品名稱",
  "CategoryName": "類別",
  "DistName": "行政區",
  "CreateDate": "2024-01-01T00:00:00",
  "Description": "商品描述",
  "Length": "100",
  "Width": "50",
  "Height": "80",
  "DeliveryAddress": "交貨地點",
  "InitPrice": "1000",
  "OriginPrice": "2000",
  "Photos": [
    {
      "Photo": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
      "PhotoUrl": "https://example.com/image1.jpg",
      "PhotoID": "1"
    }
  ],
  "ExportInfo": {
    "ExportDate": "2024-01-01T12:00:00.000Z",
    "ExportType": "PackageDownload",
    "ImageFormat": "Base64",
    "TotalImages": 1
  }
}
```

## 注意事項

- 圖片轉換需要時間，特別是當商品有多張圖片時
- Base64 編碼會增加檔案大小（約 33%）
- 建議在網路連線穩定的環境下使用
- 下載的 JSON 檔案包含完整的商品資訊，可用於備份或資料遷移