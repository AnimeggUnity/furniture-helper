# API 資料結構說明文件

## 📋 概述

**API 端點**: `https://recycledstuff.ntpc.gov.tw/BidMgr/api/Product/GetProducts`  
**請求方法**: POST  
**回應格式**: JSON Array  
**資料筆數**: 135 筆（範例）  
**回應大小**: 約 180 KB  

## 🔧 請求格式

### 請求標頭
```http
Content-Type: application/json
Accept: application/json, text/plain, */*
```

### 請求酬載
```json
{
  "AutoID": null,
  "Name": "",
  "CategoryID": 0,
  "DistID": "231",
  "IsPay": null,
  "IsGet": null,
  "Winner": "",
  "StartDate": "2025-06-11",
  "EndDate": "2025-07-11",
  "BidStatus": 0
}
```

## 📊 回應資料結構

### 基本資訊
- **資料類型**: Array
- **每個項目包含**: 38 個欄位
- **主要識別碼**: `ID` (UUID 格式)

### 完整欄位清單

| 欄位名稱 | 資料類型 | 說明 | 範例值 |
|---------|---------|------|--------|
| `ID` | string | **主要 UUID 識別碼** | `"03e02fc0-8b02-4f62-a209-00db1461b49e"` |
| `AutoID` | number | 自動編號 | `2503` |
| `Name` | string | 商品名稱 | `"LED氣氛蠟燭 五個一拍"` |
| `CategoryName` | string | 類別名稱 | `"其他"` |
| `CategoryID` | number | 類別編號 | `13` |
| `Description` | string | 商品描述 | `"一、經新店區清潔隊回收後..."` |
| `DistName` | string | 行政區名稱 | `"新店區"` |
| `DistID` | string | 行政區編號 | `"231"` |
| `OriginPrice` | number | 原價 | `30` |
| `InitPrice` | number | 起標價格 | `30` |
| `MinAddPrice` | number | 最低加價金額 | `10` |
| `CurrentPrice` | number | 目前價格 | `0` |
| `BidCount` | number | 競標次數 | `0` |
| `WinnerID` | object | 得標者ID | `null` |
| `IsFinish` | boolean | 是否結束 | `false` |
| `IsPay` | boolean | 是否已付款 | `false` |
| `IsGet` | boolean | 是否已取貨 | `false` |
| `StartDate` | string | 開始時間 | `"2025-07-08T07:15:00"` |
| `EndDate` | string | 結束時間 | `"2025-08-08T07:15:00"` |
| `CreateDate` | string | 建立時間 | `"2025-07-08T07:15:38.823"` |
| `ModifyDate` | string | 修改時間 | `"2025-07-08T07:18:20.527"` |
| `DeleteDate` | object | 刪除時間 | `null` |
| `DeliveryAddress` | string | 交貨地點 | `"薏仁坑路自強巷2-3號"` |
| `Length` | number | 長度 | `0` |
| `Width` | number | 寬度 | `0` |
| `Height` | number | 高度 | `0` |
| `AdminUserID` | number | 管理員ID | `32` |
| `HitCount` | number | 點擊次數 | `8` |
| `TrackCount` | number | 追蹤次數 | `0` |
| `FAQCount` | number | FAQ數量 | `0` |
| `Photos` | array | **圖片陣列** | 見下方詳細說明 |
| `Bids` | object | 競標資料 | `null` |
| `FAQs` | object | FAQ資料 | `null` |
| `AdminUser` | object | 管理員資料 | `null` |
| `Payment` | object | 付款資料 | `null` |
| `Refund` | object | 退款資料 | `null` |
| `Account` | object | 帳戶資料 | `null` |
| `NickName` | object | 暱稱 | `null` |

## 🖼️ 圖片資料結構

### Photos 陣列格式
```json
[
  {
    "ID": 16676,
    "ProductID": "03e02fc0-8b02-4f62-a209-00db1461b49e",
    "Photo": "https://recycledstuff.ntpc.gov.tw/Static/Image/Upload/Product/c11ffb1d-6030-4892-87d9-0304c563f3d2.jpg"
  }
]
```

### 圖片欄位說明
| 欄位 | 類型 | 說明 | 範例 |
|------|------|------|------|
| `ID` | number | 圖片編號 | `16676` |
| `ProductID` | string | 商品UUID（與主ID相同） | `"03e02fc0-8b02-4f62-a209-00db1461b49e"` |
| `Photo` | string | **完整圖片URL** | `"https://recycledstuff.ntpc.gov.tw/Static/Image/Upload/Product/..."` |

## 🔗 相關 API 端點

### 競標紀錄查詢
```
GET /api/Product/GetBidLog?id={UUID}
```
- **參數**: 使用商品的 `ID` 欄位值
- **用途**: 查詢該商品的競標歷史

### 範例
```javascript
// 查詢競標紀錄
const uuid = "03e02fc0-8b02-4f62-a209-00db1461b49e";
const response = await fetch(`/api/Product/GetBidLog?id=${uuid}`);
```

## 📝 資料處理建議

### 1. UUID 識別
- 主要使用 `ID` 欄位作為唯一識別碼
- 所有相關查詢都使用這個 UUID

### 2. 圖片處理
- 圖片 URL 是完整的 HTTPS 連結
- 可以直接用於顯示或下載
- 每個商品可能有多張圖片

### 3. 價格計算
- `CurrentPrice`: 目前最高出價
- `InitPrice`: 起標價格
- `MinAddPrice`: 最低加價金額

### 4. 狀態判斷
- `IsFinish`: 競標是否結束
- `IsPay`: 是否已付款
- `IsGet`: 是否已取貨

## 🚨 注意事項

### 1. 空值處理
- 多個欄位可能為 `null`
- 處理時需要檢查空值

### 2. 日期格式
- 所有日期都是 ISO 8601 格式
- 包含時區資訊

### 3. 圖片 URL
- 圖片 URL 是相對路徑
- 需要加上域名才能完整訪問

### 4. 競標狀態
- `BidCount` 為 0 表示無人競標
- `WinnerID` 為 null 表示尚未得標

## 💡 使用範例

### JavaScript 處理範例
```javascript
// 解析 API 回應
const products = await fetch('/api/Product/GetProducts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
}).then(res => res.json());

// 處理每筆商品
products.forEach(product => {
  console.log(`商品: ${product.Name}`);
  console.log(`UUID: ${product.ID}`);
  console.log(`圖片數量: ${product.Photos.length}`);
  
  // 查詢競標紀錄
  if (product.ID) {
    fetch(`/api/Product/GetBidLog?id=${product.ID}`);
  }
});
```

### 圖片顯示範例
```javascript
// 顯示第一張圖片
const firstPhoto = product.Photos[0];
if (firstPhoto) {
  const img = document.createElement('img');
  img.src = firstPhoto.Photo;
  document.body.appendChild(img);
}
```

## 📅 更新記錄

- **2025-07-11**: 初始版本，基於實際 API 測試結果
- 資料來源: 新北市再生家具拍賣系統
- 測試環境: 生產環境

---

**文件版本**: 1.0  
**最後更新**: 2025-07-11  
**維護者**: 系統開發團隊 