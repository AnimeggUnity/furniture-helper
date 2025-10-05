
((app) => {
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
      throw error; // 將錯誤向上拋出，以便呼叫者可以處理
    }
  }

  async function directSubmitToAPI(jsonData) {
    console.log(' 開始直接 API 送出...');
    try {
      const payload = {
        CategoryID: app.getCategoryID(jsonData),
        Name: jsonData.Name || '',
        Description: jsonData.Description || '',
        InitPrice: jsonData.InitPrice || '0',
        OriginPrice: jsonData.OriginPrice || '0',
        MinAddPrice: jsonData.MinAddPrice || 10,
        StartDate: jsonData.StartDate || new Date().toISOString().slice(0, 19).replace('T', ' '),
        EndDate: jsonData.EndDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '), // ← 預設為兩周後
        DistID: jsonData.DistID || '231',
        DeliveryAddress: jsonData.DeliveryAddress || '',
        Length: jsonData.Length || '0',
        Width: jsonData.Width || '0',
        Height: jsonData.Height || '0',
        Photos: []
      };

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
      const response = await fetch('/BidMgr/api/Product/AddProduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      console.log('API 送出成功:', result);

      setTimeout(() => {
        if (app.isStatsTriggered()) {
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
      }, 2000);

      return result;
    } catch (error) {
      console.error('API 送出失敗:', error);
      alert(` API 送出失敗: ${error.message}`);
      throw error;
    }
  }

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

  async function uploadImagesWithCorrectAPI(photos) {
    const uploaded = [];
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      if (photo.Photo && photo.Photo.startsWith('data:image')) {
        const file = app.optimizedBase64ToFile(photo.Photo, `image_${i + 1}.jpg`);
        const result = await uploadImage(file);
        uploaded.push({ ...photo, uploadedUrl: result.FilePath || result });
      } else if (photo.Photo) {
        uploaded.push(photo);
      }
    }
    return uploaded;
  }

  app.uploadImage = uploadImage;
  app.directSubmitToAPI = directSubmitToAPI;
  app.deleteProductAPI = deleteProductAPI;
  app.uploadImagesWithCorrectAPI = uploadImagesWithCorrectAPI;
})(window.FurnitureHelper = window.FurnitureHelper || {});
