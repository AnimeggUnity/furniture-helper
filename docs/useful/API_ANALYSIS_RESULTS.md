# API 分析結果與技術文件

## 發現的 API 端點

### 1. 競標紀錄 API
```
端點: api/Product/GetBidLog
方法: GET
參數: id (UUID格式)
完整URL: https://recycledstuff.ntpc.gov.tw/BidMgr/api/Product/GetBidLog?id={uuid}
```

#### 請求格式
```javascript
// XHR 請求格式（與實際網站一致）
const xhr = new XMLHttpRequest();
xhr.open('GET', `api/Product/GetBidLog?id=${uuid}`);
xhr.setRequestHeader('accept', 'application/json, text/plain, */*');
xhr.setRequestHeader('accept-language', 'zh-TW,zh-CN;q=0.9,zh;q=0.8,en-US;q=0.7,en;q=0.6');
xhr.setRequestHeader('sec-ch-ua', '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"');
xhr.setRequestHeader('sec-ch-ua-mobile', '?0');
xhr.setRequestHeader('sec-ch-ua-platform', '"Windows"');
xhr.setRequestHeader('sec-fetch-dest', 'empty');
xhr.setRequestHeader('sec-fetch-mode', 'cors');
xhr.setRequestHeader('sec-fetch-site', 'same-origin');
xhr.send();
```

#### 回應格式
```javascript
// 成功回應 (200 OK)
[
  {
    "BidPrice": 18,           // 競標價格
    "BidderName": "買家名稱",  // 出價者名稱
    "BidTime": "2024-01-01T10:00:00", // 競標時間
    "Status": "有效",         // 競標狀態
    "BidID": "bid-123",       // 競標ID
    // 其他可能的欄位...
  }
]

// 無競標記錄
[]
```

## 資料結構分析

### 商品資料結構
```javascript
{
  AutoID: 2035,                    // 數字ID
  UUID: "d9297ea5-cad8-4db5-9c27-bd3aae3da118", // UUID格式ID
  Name: "商品名稱",
  CategoryName: "類別",
  DistName: "行政區",
  CreateDate: "2024-01-01T10:00:00",
  // ... 其他欄位
}
```

### 競標資料欄位映射
| 欄位類型 | 可能的欄位名稱 | 說明 |
|---------|---------------|------|
| 價格 | `BidPrice`, `Price`, `Amount` | 競標價格 |
| 出價者 | `BidderName`, `UserName`, `Name`, `Bidder`, `Account`, `User`, `BidderAccount`, `BidderID`, `CustomerName`, `Customer`, `MemberName`, `Member` | 出價者資訊 |
| 時間 | `BidTime`, `CreateTime`, `Time`, `BidDate` | 競標時間 |
| 狀態 | `Status`, `State`, `BidStatus` | 競標狀態 |
| ID | `BidID`, `ID`, `BidId` | 競標記錄ID |

## UUID 提取策略

### 1. 優先順序
```javascript
const uuid = row.UUID ||           // 最優先
             row.Guid ||           // 第二優先
             row.ProductID ||      // 第三優先
             row.ProductId ||      // 第四優先
             row.BidID ||          // 第五優先
             row.BidId ||          // 第六優先
             (Array.isArray(row.ID) ? row.ID.find(id => typeof id === 'string' && id.length > 20) : row.ID);
```

### 2. UUID 格式驗證
```javascript
// UUID 格式檢查（長度 > 20 的字串）
if (uuid && typeof uuid === 'string' && uuid.length > 20) {
  // 有效的 UUID
}
```

## 錯誤處理

### 1. API 錯誤狀態
- `200 OK`: 成功
- `400 Bad Request`: 參數錯誤
- `404 Not Found`: 端點不存在
- `401 Unauthorized`: 未授權

### 2. 資料解析錯誤
```javascript
try {
  const arr = JSON.parse(xhr.responseText);
  resolve(Array.isArray(arr) ? arr : []);
} catch { 
  resolve([]); // 解析失敗時返回空陣列
}
```

## 網路請求監聽

### 1. 監聽器設定
```javascript
// 攔截 XHR 請求
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function(method, url, ...args) {
  this._method = method;
  this._url = url;
  return originalXHROpen.apply(this, [method, url, ...args]);
};

XMLHttpRequest.prototype.send = function(data) {
  console.log('🌐 XHR請求:', {
    method: this._method,
    url: this._url,
    data: data
  });
  
  // 特別標記競標相關請求
  if (typeof this._url === 'string' && 
      (this._url.includes('bid') || this._url.includes('Bid'))) {
    console.log('🎯 發現競標相關XHR請求!');
  }
  
  return originalXHRSend.apply(this, [data]);
};
```

## 實際測試結果

### 1. 成功的 API 呼叫
```
🌐 XHR請求: {
  method: 'GET', 
  url: 'api/Product/GetBidLog?id=d9297ea5-cad8-4db5-9c27-bd3aae3da118', 
  data: null
}
```

### 2. 競標資料範例
```javascript
{
  "BidPrice": 18,
  "BidderName": "買家名稱",
  "BidTime": "2024-01-01T10:00:00",
  "Status": "有效"
}
```

## 未來擴展建議

### 1. 可新增的 API 端點
- `api/Product/GetBidHistory` - 競標歷史
- `api/Bid/GetBidLog` - 競標記錄（備用）
- `api/Product/GetBids` - 競標資訊

### 2. 可新增的功能
- 競標趨勢分析
- 競標時間統計
- 競標者分析
- 價格分布圖表
- 競標狀態追蹤

### 3. 效能優化
- 批次 API 呼叫
- 快取機制
- 錯誤重試
- 請求限流

## 注意事項

1. **認證要求**: 需要有效的 session cookie
2. **請求頻率**: 避免過於頻繁的 API 呼叫
3. **錯誤處理**: 妥善處理網路錯誤和資料解析錯誤
4. **欄位變化**: 欄位名稱可能因系統版本而異
5. **資料格式**: 回應格式可能因不同端點而異 