# 🔧 手動測試指令

## 🎯 競標分析測試

### 方法一：直接競標分析（推薦）
```javascript
// 觸發直接競標分析
window.postMessage({ source: 'run-vue-direct-bid-analysis' }, '*');
```

### 方法二：載入競標分析工具
```javascript
// 載入競標分析工具
fetch('bid-log-analyzer.js').then(r => r.text()).then(eval);

// 等待工具載入後執行
setTimeout(() => {
  if (window.analyzeBids) {
    window.analyzeBids(18);
  } else {
    console.log('❌ 工具未正確載入');
  }
}, 2000);
```

### 方法三：直接API呼叫測試
```javascript
// 測試單一商品的競標紀錄
fetch('api/Product/GetBidLog?id=12345')
  .then(response => response.json())
  .then(data => {
    console.log('競標紀錄:', data);
    
    // 找出18元出價
    const bid18 = data.find(bid => bid.price === 18);
    if (bid18) {
      console.log('找到18元出價:', bid18);
    }
  })
  .catch(error => {
    console.error('API呼叫失敗:', error);
  });
```

## 🔍 API端點分析測試

```javascript
// 觸發API端點分析
window.postMessage({ source: 'run-vue-api-endpoint-analysis' }, '*');
```

## 📊 其他測試指令

### 檢查表格資料
```javascript
// 檢查表格資料是否存在
console.log('表格資料:', window.__tableFullData);
console.log('資料筆數:', window.__tableFullData?.length || 0);
```

### 檢查Vue實例
```javascript
// 檢查Vue實例
const table = document.querySelector('.vxe-table');
const vue = table?.__vue__;
console.log('Vue實例:', vue);
console.log('表格資料:', vue?.tableFullData);
```

### 檢查競標按鈕
```javascript
// 檢查競標紀錄按鈕
const bidButtons = document.querySelectorAll('button i.el-icon-search');
console.log('競標按鈕數量:', bidButtons.length);
bidButtons.forEach((icon, index) => {
  const button = icon.closest('button');
  console.log(`按鈕 ${index + 1}:`, button.textContent.trim());
});
```

## 🚀 快速測試腳本

### 完整測試腳本
```javascript
// 複製以下程式碼到Console執行
console.log('🚀 開始完整測試...');

// 1. 檢查基本環境
console.log('📋 步驟1: 檢查基本環境');
console.log('表格資料:', window.__tableFullData?.length || 0, '筆');
console.log('Vue實例:', !!document.querySelector('.vxe-table')?.__vue__);
console.log('競標按鈕:', document.querySelectorAll('button i.el-icon-search').length, '個');

// 2. 測試API端點分析
console.log('\n📋 步驟2: 測試API端點分析');
window.postMessage({ source: 'run-vue-api-endpoint-analysis' }, '*');

// 3. 等待後測試直接競標分析
setTimeout(() => {
  console.log('\n📋 步驟3: 測試直接競標分析');
  window.postMessage({ source: 'run-vue-direct-bid-analysis' }, '*');
}, 3000);

console.log('✅ 測試腳本已啟動，請查看Console輸出');
```

### 簡單測試腳本
```javascript
// 最簡單的測試
window.postMessage({ source: 'run-vue-direct-bid-analysis' }, '*');
```

## ⚠️ 故障排除

### 問題：postMessage沒有回應
**解決方案**：
```javascript
// 檢查postMessage是否正常工作
window.addEventListener('message', event => {
  console.log('收到訊息:', event.data);
});
```

### 問題：API呼叫失敗
**解決方案**：
```javascript
// 檢查網路連線
fetch('api/Product/GetBidLog?id=12345')
  .then(response => {
    console.log('回應狀態:', response.status);
    return response.json();
  })
  .then(data => console.log('資料:', data))
  .catch(error => console.error('錯誤:', error));
```

### 問題：沒有表格資料
**解決方案**：
```javascript
// 等待頁面載入完成
setTimeout(() => {
  console.log('表格資料:', window.__tableFullData);
}, 2000);
```

## 💡 使用建議

1. **首次測試**：使用「直接競標分析」按鈕
2. **進階測試**：使用Console指令
3. **故障排除**：使用完整測試腳本
4. **API測試**：使用直接API呼叫

## 📞 支援

如果遇到問題：
1. 檢查Console錯誤訊息
2. 確認頁面已完全載入
3. 嘗試重新載入頁面
4. 使用不同的測試方法 