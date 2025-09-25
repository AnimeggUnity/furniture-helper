// ===================================================================
// API 函數 - 網路請求與圖片處理
// ===================================================================

/**
 * 將圖片轉換為 Base64 的函數
 * @param {string} imageUrl - 圖片 URL
 * @returns {Promise<string>} Base64 字符串
 */
async function convertImageToBase64(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // 處理跨域問題

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 設定 canvas 尺寸
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        // 繪製圖片到 canvas
        ctx.drawImage(img, 0, 0);

        // 轉換為 Base64
        const base64 = canvas.toDataURL('image/jpeg', APP_CONSTANTS.API.IMAGE_QUALITY);
        resolve(base64);
      } catch (error) {
        reject(new Error(`Canvas 轉換失敗: ${error.message}`));
      }
    };

    img.onerror = () => {
      reject(new Error(`圖片載入失敗: ${imageUrl}`));
    };

    // 設定圖片來源
    img.src = imageUrl;
  });
}

/**
 * 上傳單張圖片檔案到新北市再生家具的伺服器
 * @param {File} imageFile - 圖片檔案物件
 * @returns {Promise<object>} 伺服器回傳的 JSON 物件
 */
async function uploadImage(imageFile) {
  const apiUrl = 'https://recycledstuff.ntpc.gov.tw/BidMgr/api/Product/UploadFile';

  // 建立 FormData 物件
  const formData = new FormData();
  formData.append('file', imageFile, imageFile.name);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`伺服器錯誤: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    throw error;
  }
}

/**
 * 直接提交到 API
 * @param {Object} jsonData - 要提交的數據
 * @returns {Promise<object>} API 回應
 */
async function directSubmitToAPI(jsonData) {
  console.log('📤 開始直接 API 送出...');
  try {
    // 準備 API payload
    const payload = {
      CategoryID: getCategoryID(jsonData),
      Name: jsonData.Name || '',
      Description: jsonData.Description || '',
      InitPrice: jsonData.InitPrice || '0',
      OriginPrice: jsonData.OriginPrice || '0',
      MinAddPrice: jsonData.MinAddPrice || 10,
      StartDate: jsonData.StartDate || new Date().toISOString().slice(0, 19).replace('T', ' '),
      EndDate: jsonData.EndDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
      DistID: jsonData.DistID || APP_CONSTANTS.API.DEFAULT_DISTRICT_ID,
      DeliveryAddress: jsonData.DeliveryAddress || '',
      Length: jsonData.Length || '0',
      Width: jsonData.Width || '0',
      Height: jsonData.Height || '0',
      Photos: []
    };

    // 處理圖片
    if (jsonData.Photos && Array.isArray(jsonData.Photos) && jsonData.Photos.length > 0) {
      const hasBase64Images = jsonData.Photos.some(photo => photo.Photo && photo.Photo.startsWith('data:image'));
      if (hasBase64Images) {
        const uploadedPhotos = await uploadImagesWithCorrectAPI(jsonData.Photos);
        payload.Photos = uploadedPhotos.map(photo => ({ Photo: photo.uploadedUrl }));
      } else {
        payload.Photos = jsonData.Photos;
      }
    }

    console.log('📡 送出 API payload:', payload);

    // 送出 API 請求
    const response = await fetch('/BidMgr/api/Product/AddProduct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    console.log('API 送出成功:', result);

    // 觸發查詢按鈕刷新表格
    setTimeout(() => {
      // 檢查是否是統計按鈕觸發的，如果是則跳過避免循環
      if (FurnitureHelper.isStatsTriggered()) {
        console.log('跳過查詢按鈕觸發，因為這是統計按鈕發起的操作');
        return;
      }

      const queryBtn = Array.from(document.querySelectorAll('button.el-button')).find(b => /查\s*詢/.test(b.textContent));
      if (queryBtn) {
        try {
          if (queryBtn.__vue__ && queryBtn.__vue__.$emit) {
            queryBtn.__vue__.$emit('click');
          } else {
            const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
            queryBtn.dispatchEvent(clickEvent);
          }
          console.log('查詢按鈕觸發成功，表格應該會重新載入');
        } catch (error) {
          console.error('觸發查詢按鈕時發生錯誤:', error);
        }
      } else {
        console.error('查詢按鈕未找到，無法重新載入表格');
      }
    }, APP_CONSTANTS.TIMING.API_REFRESH_DELAY);

    return result;
  } catch (error) {
    console.error('API 送出失敗:', error);
    alert(`API 送出失敗: ${error.message}`);
    throw error;
  }
}

/**
 * 刪除單一項目 API
 * @param {Object} itemData - 項目數據
 * @returns {Promise<object>} 刪除結果
 */
async function deleteProductAPI(itemData) {
  console.log('🗑️ 開始刪除項目:', itemData.Name, itemData.ID);
  try {
    const response = await fetch('/BidMgr/api/Product/DeleteProduct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData)
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    console.log('🗑️ 項目刪除成功:', result);
    return { success: true, result };
  } catch (error) {
    console.error('❌ 項目刪除失敗:', error);
    throw error;
  }
}

/**
 * 批次刪除功能
 * @param {Array} selectedItems - 選中的項目列表
 */
async function processBatchDelete(selectedItems) {
  showNotification(`開始批次刪除 ${selectedItems.length} 個項目...`, 'info');

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (let i = 0; i < selectedItems.length; i++) {
    const item = selectedItems[i];
    try {
      showNotification(`正在刪除項目 ${i + 1}/${selectedItems.length}: ${item.Name}`, 'info', 2000);
      await deleteProductAPI(item);
      successCount++;
      console.log(`✅ 刪除成功 ${i + 1}/${selectedItems.length}: ${item.Name}`);
    } catch (error) {
      errorCount++;
      errors.push({ name: item.Name, error: error.message });
      console.error(`❌ 刪除失敗 ${i + 1}/${selectedItems.length}: ${item.Name} - ${error.message}`);
      showNotification(`項目 ${item.Name} 刪除失敗: ${error.message}`, 'error', 3000);
    }

    // 每次操作後稍微延遲，避免請求過於頻繁
    if (i < selectedItems.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // 顯示最終結果
  const message = `批次刪除完成！成功: ${successCount} 項，失敗: ${errorCount} 項`;
  if (errorCount === 0) {
    showNotification(message, 'success', 5000);
  } else if (successCount === 0) {
    showNotification(message, 'error', 5000);
  } else {
    showNotification(message, 'warning', 5000);
  }

  // 刷新資料表格
  if (successCount > 0) {
    setTimeout(() => {
      const queryBtn = Array.from(document.querySelectorAll('button.el-button')).find(b => /查\s*詢/.test(b.textContent));
      if (queryBtn) {
        try {
          if (queryBtn.__vue__ && queryBtn.__vue__.$emit) {
            queryBtn.__vue__.$emit('click');
          } else {
            const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
            queryBtn.dispatchEvent(clickEvent);
          }
          console.log('批次刪除完成，已刷新資料');
        } catch (error) {
          console.error('刷新資料時發生錯誤:', error);
        }
      }
    }, APP_CONSTANTS.TIMING.API_REFRESH_DELAY);
  }
}

/**
 * 使用正確的 API 上傳圖片
 * @param {Array} photos - 圖片陣列
 * @returns {Promise<Array>} 上傳結果
 */
async function uploadImagesWithCorrectAPI(photos) {
  const uploaded = [];
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    if (photo.Photo && photo.Photo.startsWith('data:image')) {
      const file = optimizedBase64ToFile(photo.Photo, `image_${i + 1}.jpg`);
      const result = await uploadImage(file);
      uploaded.push({ ...photo, uploadedUrl: result.FilePath || result });
    } else if (photo.Photo) {
      uploaded.push(photo);
    }
  }
  return uploaded;
}

// 暴露到全域
window.convertImageToBase64 = convertImageToBase64;
window.uploadImage = uploadImage;
window.directSubmitToAPI = directSubmitToAPI;
window.deleteProductAPI = deleteProductAPI;
window.processBatchDelete = processBatchDelete;
window.uploadImagesWithCorrectAPI = uploadImagesWithCorrectAPI;