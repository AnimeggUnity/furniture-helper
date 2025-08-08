# 優化後的一鍵上傳功能

## 根據 Payload 分析優化的實作

基於您提供的 Payload 分析，我們確認了以下關鍵資訊：
- ✅ `name="file"` 是正確的欄位名稱
- ✅ 不需要額外的 `productId` 或 `sortOrder` 欄位
- ✅ 這是一個純粹的檔案上傳 API

## 優化內容

### 1. 優化的 uploadImage 函數

```javascript
/**
 * 上傳單張圖片檔案到新北市再生家具的伺服器。
 * 這個 API 是一個純粹的檔案上傳接口，它接收圖片並回傳一個包含路徑的 JSON。
 *
 * @param {File} imageFile - 使用者透過 <input type="file"> 選擇的圖片檔案物件。
 * @returns {Promise<object>} - 伺服器回傳的 JSON 物件，預期包含 FilePath 等欄位。
 *                              例如: { FilePath: "/Static/Image/Upload/Product/uuid.jpg", ... }
 */
async function uploadImage(imageFile) {
  const apiUrl = 'https://recycledstuff.ntpc.gov.tw/BidMgr/api/Product/UploadFile';

  // 1. 建立一個 FormData 物件。
  const formData = new FormData();

  // 2. 將圖片檔案附加到 FormData 中。
  //    根據 Payload 分析，後端接收的欄位名是 "file"。
  formData.append('file', imageFile, imageFile.name);

  // 3. 使用 fetch 發起 POST 請求。
  //    當 body 是 FormData 時，瀏覽器會自動設定正確的 Content-Type (包含 boundary)，
  //    並且會自動附加當前網域的 cookie 用於認證。
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`伺服器錯誤: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // 4. 解析伺服器回傳的 JSON 資料並回傳。
    const result = await response.json();
    console.log('✅ 圖片上傳成功，伺服器回應:', result);
    return result;

  } catch (error) {
    console.error('❌ 圖片上傳失敗:', error);
    throw error; // 將錯誤向上拋出，以便呼叫者可以處理
  }
}
```

### 2. 優化的 base64ToFile 函數

```javascript
/**
 * 將 Base64 字串轉換為 File 物件。
 * @param {string} base64String - 包含 data URI scheme 的 Base64 字串 (e.g., "data:image/png;base64,...")
 * @param {string} filename - 轉換後的檔案名稱
 * @returns {File} - 可用於上傳的 File 物件
 */
function base64ToFile(base64String, filename = 'image.jpg') {
  try {
    const arr = base64String.split(',');
    const mime = arr[0].match(/:(.*?);/)[1]; // 從 "data:image/png;base64" 中提取 "image/png"
    const bstr = atob(arr[1]); // 解碼 Base64
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    const file = new File([u8arr], filename, { type: mime });
    console.log(`✅ Base64 轉 File 成功: ${filename} (${file.size} bytes, type: ${mime})`);
    return file;
  } catch (error) {
    console.error(`❌ Base64 轉 File 失敗: ${error.message}`);
    throw error;
  }
}
```

### 3. 優化的圖片預覽建立

```javascript
// 動態建立圖片預覽的函數
function createImagePreview(imagePath, filename) {
  console.log(`🖼️ 建立圖片預覽: ${filename} -> ${imagePath}`);
  
  // 尋找圖片上傳區域 - 支援多種可能的選擇器
  const uploadArea = document.querySelector('.el-upload-list--picture-card, .el-upload__list, .upload-list, .image-upload-area');
  if (!uploadArea) {
    console.error('❌ 未找到圖片上傳區域');
    return;
  }
  
  // 建立預覽元素 - 使用 Element UI 的標準結構
  const previewItem = document.createElement('li');
  previewItem.className = 'el-upload-list__item is-success';
  
  // 建立完整的 Element UI 預覽結構
  previewItem.innerHTML = `
    <img src="${imagePath.startsWith('http') ? imagePath : `https://recycledstuff.ntpc.gov.tw${imagePath}`}" 
         alt="${filename}" 
         class="el-upload-list__item-thumbnail">
    <a class="el-upload-list__item-name">
      <i class="el-icon-document"></i>${filename}
    </a>
    <label class="el-upload-list__item-status-label">
      <i class="el-icon-upload-success el-icon-check"></i>
    </label>
    <i class="el-icon-close el-upload-list__item-delete"></i>
  `;
  
  // 添加到上傳區域
  uploadArea.appendChild(previewItem);
  
  // 綁定刪除事件
  const deleteBtn = previewItem.querySelector('.el-upload-list__item-delete');
  if (deleteBtn) {
    deleteBtn.onclick = () => {
      previewItem.remove();
      console.log(`🗑️ 移除圖片預覽: ${filename}`);
    };
  }
  
  console.log(`✅ 圖片預覽建立完成: ${filename}`);
  return previewItem;
}
```

### 4. 並行上傳處理

```javascript
// 從打包的 JSON 上傳圖片的函數
async function uploadImagesFromPackagedJson(photos) {
  console.log(`🚀 開始批量上傳 ${photos.length} 張圖片...`);
  
  // 找到頁面上的圖片預覽容器
  const imagePreviewContainer = document.querySelector('.el-upload-list--picture-card, .el-upload__list');
  if (imagePreviewContainer) {
    // 先清空舊的預覽（可選）
    console.log('🧹 清空現有圖片預覽');
    imagePreviewContainer.innerHTML = '';
  }
  
  const uploadedImages = [];
  
  // 使用 Promise.all 來並行處理所有圖片的上傳
  const uploadPromises = photos.map(async (photo, index) => {
    try {
      // 檢查是否有 Base64 資料
      if (!photo.Photo || !photo.Photo.startsWith('data:image')) {
        console.warn(`⚠️ 圖片 ${index + 1} 沒有 Base64 資料，跳過`);
        return null;
      }
      
      // 取得檔案名稱
      const filename = photo.filename || photo.PhotoID || `upload_${index + 1}.jpg`;
      
      console.log(`📤 處理第 ${index + 1}/${photos.length} 張圖片: ${filename}`);
      
      // 將 Base64 轉換為 File 物件
      const imageFile = base64ToFile(photo.Photo, filename);
      
      // 呼叫我們優化後的 uploadImage 函數
      const uploadResult = await uploadImage(imageFile);
      
      return {
        filename,
        uploadResult,
        originalPhoto: photo
      };
      
    } catch (error) {
      console.error(`❌ 第 ${index + 1} 張圖片處理失敗: ${error.message}`);
      return null;
    }
  });
  
  // 等待所有圖片上傳完成
  const uploadResults = await Promise.all(uploadPromises);
  
  console.log('[圖片處理] 所有圖片上傳完成！', uploadResults);
  
  // 動態渲染預覽（無需重整）
  uploadResults.forEach(result => {
    if (result && result.uploadResult && result.uploadResult.FilePath) {
      // 假設伺服器回傳的 JSON 中有 FilePath 欄位
      const imageUrl = result.uploadResult.FilePath.startsWith('http') 
        ? result.uploadResult.FilePath 
        : `https://recycledstuff.ntpc.gov.tw${result.uploadResult.FilePath}`;
      
      // 動態建立圖片預覽
      createImagePreview(imageUrl, result.filename);
      
      uploadedImages.push({
        filename: result.filename,
        filePath: result.uploadResult.FilePath,
        originalPhoto: result.originalPhoto
      });
      
      console.log(`✅ 圖片預覽建立完成: ${result.filename}`);
    }
  });
  
  console.log(`🎉 圖片上傳完成！成功上傳 ${uploadedImages.length}/${photos.length} 張圖片`);
  
  return uploadedImages;
}
```

## 優化特點

### 1. 使用 fetch API
- 替代了 XMLHttpRequest，更現代化的 API
- 自動處理 Content-Type 和 boundary
- 自動攜帶 Cookie 進行認證

### 2. 並行上傳
- 使用 `Promise.all` 同時處理多張圖片
- 大幅提升上傳效率
- 保持錯誤處理的穩定性

### 3. Element UI 標準結構
- 使用標準的 Element UI 預覽結構
- 確保與現有 UI 框架相容
- 支援刪除功能

### 4. 更好的錯誤處理
- 詳細的錯誤訊息
- 單張圖片失敗不影響其他圖片
- 完整的錯誤日誌記錄

## 使用流程

1. **選擇打包檔案**：點擊「匯入 JSON」選擇 `_packaged.json`
2. **自動檢測**：系統自動檢測是否包含 Base64 圖片
3. **並行上傳**：同時上傳所有圖片到伺服器
4. **動態預覽**：上傳完成後自動建立圖片預覽
5. **完成通知**：顯示上傳完成統計

## 技術優勢

- **無需重整**：完全動態操作，無需刷新頁面
- **高效上傳**：並行處理，大幅提升速度
- **穩定可靠**：完整的錯誤處理和恢復機制
- **使用者友善**：即時進度顯示和完成通知

這個優化版本真正實現了「一鍵上傳」的無縫體驗！ 