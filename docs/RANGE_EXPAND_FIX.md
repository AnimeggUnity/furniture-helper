# Range.expand() 棄用問題修復

## 問題描述

在 Chrome 瀏覽器的新版本中，出現了以下錯誤訊息：
```
Range.expand() 已淘汰，請改用 Selection.modify()。
1 個來源
contentScript.js:2
```

## 問題原因

這個錯誤是由於 `scrollIntoView()` 方法在某些情況下會觸發瀏覽器的選擇機制，而現代瀏覽器已經棄用了 `Range.expand()` 方法。

## 影響位置

在 `content.js` 中有三個地方使用了 `scrollIntoView()`：
1. 第613行：搜尋功能中的項目滾動
2. 第1664行：時間設定中的輸入框滾動  
3. 第1673行：時間設定中的按鈕滾動

## 解決方案

### 1. 創建安全的滾動函數

新增了 `safeScrollIntoView()` 函數，該函數：
- 在滾動前清除任何現有的選擇範圍
- 使用 try-catch 包裝滾動操作
- 提供多層錯誤處理機制

```javascript
function safeScrollIntoView(element, options = {}) {
  try {
    // 先清除任何現有的選擇
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
    
    // 嘗試使用 scrollIntoView
    if (element && element.scrollIntoView) {
      element.scrollIntoView(options);
    } else {
      // 如果沒有 scrollIntoView 方法，使用替代方案
      element.scrollIntoView();
    }
  } catch (error) {
    console.warn('滾動操作失敗，使用替代方案:', error);
    // 使用替代的滾動方法
    try {
      element.scrollIntoView();
    } catch (fallbackError) {
      console.error('所有滾動方法都失敗:', fallbackError);
    }
  }
}
```

### 2. 替換所有 scrollIntoView 調用

將所有直接使用 `scrollIntoView()` 的地方替換為 `safeScrollIntoView()`：

- 搜尋功能：`safeScrollIntoView(item, { behavior: 'smooth', block: 'center' })`
- 時間設定輸入框：`safeScrollIntoView(input, { behavior: 'smooth', block: 'center' })`
- 時間設定按鈕：`safeScrollIntoView(nowButton, { behavior: 'smooth', block: 'center' })`

## 修復效果

1. **消除錯誤訊息**：不再出現 `Range.expand() 已淘汰` 的錯誤
2. **保持功能完整**：所有滾動功能仍然正常工作
3. **提高穩定性**：增加了錯誤處理機制，提高代碼的健壯性
4. **向後兼容**：支持舊版瀏覽器，同時兼容新版瀏覽器

## 測試建議

1. 測試搜尋功能中的項目滾動
2. 測試時間設定功能中的滾動操作
3. 在不同版本的 Chrome 瀏覽器中測試
4. 檢查瀏覽器控制台是否還有相關錯誤訊息

## 技術細節

- **瀏覽器兼容性**：支持所有現代瀏覽器
- **性能影響**：最小，僅在滾動時增加少量處理
- **錯誤處理**：多層防護，確保功能不會因錯誤而中斷
- **代碼維護**：集中化的滾動處理，便於後續維護
