# 上傳功能修正測試

## 問題分析

從日誌中發現的問題：
1. ✅ 圖片上傳成功：4張圖片都成功上傳到伺服器
2. ❌ 圖片預覽建立失敗：`成功上傳 0/4 張圖片`
3. ❌ 表單驗證失敗：可能是因為圖片預覽沒有正確顯示

## 修正內容

### 1. 修正伺服器回應格式處理

**問題**：伺服器回應是直接的字串 URL，而不是包含 `FilePath` 欄位的物件

**修正**：
```javascript
// 動態渲染預覽（無需重整）
uploadResults.forEach(result => {
  if (result && result.uploadResult) {
    // 伺服器回應可能是字串 URL 或包含 FilePath 的物件
    let imageUrl;
    if (typeof result.uploadResult === 'string') {
      // 直接是 URL 字串
      imageUrl = result.uploadResult;
    } else if (result.uploadResult.FilePath) {
      // 包含 FilePath 欄位的物件
      imageUrl = result.uploadResult.FilePath.startsWith('http') 
        ? result.uploadResult.FilePath 
        : `https://recycledstuff.ntpc.gov.tw${result.uploadResult.FilePath}`;
    } else {
      console.warn(`⚠️ 無法解析上傳結果格式:`, result.uploadResult);
      return;
    }
    
    // 動態建立圖片預覽
    createImagePreview(imageUrl, result.filename);
    
    uploadedImages.push({
      filename: result.filename,
      filePath: imageUrl,
      originalPhoto: result.originalPhoto
    });
    
    console.log(`✅ 圖片預覽建立完成: ${result.filename} -> ${imageUrl}`);
  }
});
```

### 2. 改進圖片預覽區域查找

**問題**：找不到正確的圖片上傳區域

**修正**：
```javascript
function createImagePreview(imagePath, filename) {
  console.log(`🖼️ 建立圖片預覽: ${filename} -> ${imagePath}`);
  
  // 尋找圖片上傳區域 - 支援多種可能的選擇器
  let uploadArea = document.querySelector('.el-upload-list--picture-card');
  if (!uploadArea) {
    uploadArea = document.querySelector('.el-upload__list');
  }
  if (!uploadArea) {
    uploadArea = document.querySelector('.upload-list');
  }
  if (!uploadArea) {
    uploadArea = document.querySelector('.image-upload-area');
  }
  if (!uploadArea) {
    // 最後嘗試尋找任何包含上傳相關的元素
    uploadArea = document.querySelector('[class*="upload"], [class*="Upload"]');
  }
  
  if (!uploadArea) {
    console.error('❌ 未找到圖片上傳區域，嘗試建立新的上傳區域');
    
    // 嘗試在表單中找到合適的位置建立上傳區域
    const form = document.querySelector('.vxe-modal--box .el-form');
    if (form) {
      // 尋找預覽圖欄位
      const formItems = form.querySelectorAll('.el-form-item');
      let previewImageItem = null;
      
      formItems.forEach(item => {
        const label = item.querySelector('.el-form-item__label');
        if (label && label.textContent.trim() === '預覽圖') {
          previewImageItem = item;
        }
      });
      
      if (previewImageItem) {
        // 在預覽圖欄位中建立上傳區域
        let uploadContainer = previewImageItem.querySelector('.el-upload-list--picture-card');
        if (!uploadContainer) {
          uploadContainer = document.createElement('ul');
          uploadContainer.className = 'el-upload-list el-upload-list--picture-card';
          uploadContainer.style.cssText = `
            list-style: none;
            padding: 0;
            margin: 10px 0;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          `;
          
          const uploadArea = previewImageItem.querySelector('.el-upload');
          if (uploadArea) {
            uploadArea.appendChild(uploadContainer);
          } else {
            previewImageItem.appendChild(uploadContainer);
          }
        }
        uploadArea = uploadContainer;
      }
    }
  }
  
  if (!uploadArea) {
    console.error('❌ 無法找到或建立圖片上傳區域');
    return;
  }
  
  console.log(`✅ 找到上傳區域:`, uploadArea);
  
  // 建立預覽元素 - 使用自定義樣式確保顯示
  const previewItem = document.createElement('li');
  previewItem.className = 'el-upload-list__item is-success';
  previewItem.style.cssText = `
    display: inline-block;
    margin: 8px;
    padding: 8px;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    background: #fafafa;
    position: relative;
    width: 120px;
    height: 120px;
  `;
  
  // 建立完整的預覽結構
  previewItem.innerHTML = `
    <img src="${imagePath}" 
         alt="${filename}" 
         style="width: 100%; height: 80px; object-fit: cover; border-radius: 4px;">
    <div style="margin-top: 4px; font-size: 12px; color: #666; text-align: center; word-break: break-all;">
      ${filename}
    </div>
    <span style="
      position: absolute;
      top: 4px;
      right: 4px;
      background: rgba(0,0,0,0.7);
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 12px;
    " onclick="this.parentNode.remove()">×</span>
  `;
  
  // 添加到上傳區域
  uploadArea.appendChild(previewItem);
  
  console.log(`✅ 圖片預覽建立完成: ${filename}`);
  return previewItem;
}
```

### 3. 改進清空邏輯

**問題**：清空時可能刪除了重要的上傳元素

**修正**：
```javascript
// 找到頁面上的圖片預覽容器
const imagePreviewContainer = document.querySelector('.el-upload-list--picture-card, .el-upload__list');
if (imagePreviewContainer) {
  // 先清空舊的預覽（可選）
  console.log('🧹 清空現有圖片預覽');
  // 只清空我們建立的預覽項目，保留原有的上傳按鈕等元素
  const existingPreviews = imagePreviewContainer.querySelectorAll('.el-upload-list__item');
  existingPreviews.forEach(item => {
    if (item.querySelector('img')) {
      item.remove();
    }
  });
}
```

## 測試步驟

### 1. 準備測試資料
- 準備一個包含 Base64 圖片的 `_packaged.json` 檔案
- 確保 JSON 中的 `Photos` 陣列包含有效的 Base64 圖片資料

### 2. 執行測試
1. 開啟新北市再生家具網站的編輯頁面
2. 點擊「匯入 JSON」按鈕
3. 選擇包含 Base64 圖片的 `_packaged.json` 檔案
4. 觀察 Console 日誌

### 3. 預期結果
- ✅ 表單欄位正確填充
- ✅ 圖片成功上傳到伺服器
- ✅ 圖片預覽正確顯示在頁面上
- ✅ 表單驗證通過

### 4. 檢查點
- Console 中應該看到 `✅ 圖片預覽建立完成` 訊息
- 頁面上應該顯示上傳的圖片預覽
- 表單提交時不應該出現驗證錯誤

## 故障排除

### 如果圖片預覽仍然沒有顯示：
1. 檢查 Console 是否有 `❌ 未找到圖片上傳區域` 錯誤
2. 檢查頁面是否有 `.el-upload-list--picture-card` 或 `.el-upload__list` 元素
3. 手動檢查預覽圖欄位的 DOM 結構

### 如果表單驗證仍然失敗：
1. 檢查是否有其他必填欄位未正確填充
2. 檢查圖片預覽是否正確顯示
3. 檢查表單驗證邏輯是否正確

## 修正後的優勢

1. **更強的相容性**：支援多種伺服器回應格式
2. **更智能的區域查找**：自動建立上傳區域如果找不到
3. **更安全的清空邏輯**：只清空預覽項目，保留重要元素
4. **更好的視覺效果**：使用自定義樣式確保預覽正確顯示
5. **更詳細的日誌**：提供完整的除錯資訊 