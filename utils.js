// ===================================================================
// 工具函數 - 純函數與通用工具
// ===================================================================

/**
 * 安全的元素滾動到視圖
 * @param {HTMLElement} element - 要滾動到的元素
 * @param {Object} options - 滾動選項
 */
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

/**
 * 樣式組合器 - 將多個樣式片段組合成完整的 CSS 字符串
 * @param {...string} styles - 要組合的樣式字符串
 * @returns {string} 組合後的完整樣式字符串
 */
function combineStyles(...styles) {
  return styles.filter(Boolean).join('');
}

/**
 * 元件變體應用器 - 根據配置生成完整樣式
 * @param {string} componentType - 元件類型 (modal, panel, button)
 * @param {string} variant - 變體名稱 (default, wide, small等)
 * @param {string} theme - 主題樣式 (primary, success等)
 * @returns {string} 完整的 CSS 樣式字符串
 */
function applyComponentVariant(componentType, variant = 'default', theme = null) {
  const baseStyle = UI_COMPONENTS[componentType]?.base || '';
  const variantConfig = COMPONENT_VARIANTS[componentType]?.[variant] || {};
  const themeStyle = theme ? (UI_COMPONENTS[componentType]?.[theme] || '') : '';

  // 將變體配置轉換為 CSS 字符串
  const variantStyle = Object.entries(variantConfig)
    .map(([key, value]) => {
      // 將 camelCase 轉換為 kebab-case
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${cssKey}:${value};`;
    })
    .join('');

  return combineStyles(baseStyle, variantStyle, themeStyle);
}

/**
 * Base64 字符串轉 File 物件
 * @param {string} base64String - Base64 字符串
 * @param {string} filename - 檔案名稱
 * @returns {File} File 物件
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
    return file;
  } catch (error) {
    throw error;
  }
}

/**
 * 優化的 Base64 轉 File 函數
 * @param {string} base64String - Base64 字符串
 * @param {string} filename - 檔案名稱
 * @returns {File} File 物件
 */
function optimizedBase64ToFile(base64String, filename = 'image.jpg') {
  try {
    // 檢查 Base64 大小
    const base64Size = base64String.length;
    const estimatedFileSize = Math.ceil(base64Size * 0.75);

    console.log(`Base64 大小: ${(base64Size / 1024).toFixed(1)}KB`);
    console.log(`預估檔案大小: ${(estimatedFileSize / 1024).toFixed(1)}KB`);

    // 如果檔案太大，給出警告
    if (estimatedFileSize > APP_CONSTANTS.FILE_SIZE.IMAGE_WARNING_THRESHOLD) {
      console.warn(`警告: 圖片檔案較大: ${(estimatedFileSize / 1024 / 1024).toFixed(1)}MB`);
    }

    const arr = base64String.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);

    // 使用 Uint8Array 優化記憶體使用
    const u8arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }

    const file = new File([u8arr], filename, { type: mime });
    console.log(`轉換成功: ${filename} (${file.size} bytes)`);

    // 清理變數，幫助垃圾回收
    u8arr.fill(0);

    return file;

  } catch (error) {
    console.error(`Base64 轉換失敗: ${error.message}`);
    throw error;
  }
}

/**
 * 獲取當前 Webhook URL
 * @returns {string} Webhook URL
 */
function getCurrentWebhookUrl() {
  try {
    return localStorage.getItem('furniture-helper-webhook-url') || DEFAULT_WEBHOOK_URL;
  } catch (e) {
    return DEFAULT_WEBHOOK_URL;
  }
}

/**
 * 儲存 Webhook 設定
 * @param {string} url - Webhook URL
 */
function saveWebhookSetting(url) {
  try {
    localStorage.setItem('furniture-helper-webhook-url', url);
  } catch (e) {
    console.error('儲存設定失敗:', e);
  }
}

/**
 * 載入 Webhook 設定
 * @returns {string} Webhook URL
 */
function loadWebhookSetting() {
  try {
    return localStorage.getItem('furniture-helper-webhook-url') || DEFAULT_WEBHOOK_URL;
  } catch (e) {
    return DEFAULT_WEBHOOK_URL;
  }
}

/**
 * 驗證 URL 是否有效
 * @param {string} string - URL 字符串
 * @returns {boolean} 是否為有效 URL
 */
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * 測試 Webhook 連線
 * @param {string} url - 測試的 URL
 */
async function testWebhookConnection(url) {
  const testBtn = document.getElementById('test-webhook-btn');
  const originalText = testBtn.textContent;
  testBtn.textContent = '測試中...';
  testBtn.disabled = true;
  try {
    const response = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
    if (response.ok) {
      const data = await response.json();
      showNotification(`連線成功！找到 ${Array.isArray(data) ? data.length : 0} 筆資料`, 'success');
    } else {
      showNotification(`連線失敗：${response.status} ${response.statusText}`, 'error');
    }
  } catch (error) {
    showNotification(`連線錯誤：${error.message}`, 'error');
  } finally {
    testBtn.textContent = originalText;
    testBtn.disabled = false;
  }
}

/**
 * 統一通知系統
 * @param {string} message - 通知訊息
 * @param {string} type - 通知類型 (success|error|warning|info)
 * @param {number} duration - 顯示時長（毫秒）
 */
function showNotification(message, type = 'info', duration = APP_CONSTANTS.TIMING.NOTIFICATION_DEFAULT_DURATION) {
  const notification = document.createElement('div');
  const typeStyle = NOTIFICATION_TYPE_MAP[type] || NOTIFICATION_TYPE_MAP.info;

  // 使用變體系統：統一的樣式應用方式
  notification.style.cssText = combineStyles(
    UI_COMPONENTS.notification.base,
    typeStyle
  );

  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, duration);
}

// 暴露到全域
window.safeScrollIntoView = safeScrollIntoView;
window.combineStyles = combineStyles;
window.applyComponentVariant = applyComponentVariant;
window.base64ToFile = base64ToFile;
window.optimizedBase64ToFile = optimizedBase64ToFile;
window.getCurrentWebhookUrl = getCurrentWebhookUrl;
window.saveWebhookSetting = saveWebhookSetting;
window.loadWebhookSetting = loadWebhookSetting;
window.isValidUrl = isValidUrl;
window.testWebhookConnection = testWebhookConnection;
window.showNotification = showNotification;