(function () {

  // 安全的滾動函數，避免觸發選擇機制
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

  // ===================================================================
  // UI 元件樣式系統 - 分層架構，避免字符串地獄
  // ===================================================================

  /**
   * 基礎元件樣式定義
   * 原則：每個元件只定義一次基礎樣式，通過組合產生變體
   * 避免重複定義相同屬性（如 padding, border 等）
   */
  const UI_COMPONENTS = {
    // 模態對話框樣式組
    modal: {
      // 所有模態框的共同基礎樣式
      base: 'position:fixed;top:20%;left:50%;transform:translateX(-50%);background:#fff;border:0.5px solid #ddd;padding:24px;z-index:9999;width:auto;max-width:90%;max-height:80%;overflow:auto;box-shadow:0 2px 8px rgba(0,0,0,0.15);border-radius:6px;',
      // 寬版模態框（統計頁面用）
      wide: 'width:1000px;max-width:95vw;',
      // 圖片預覽專用樣式
      photo: 'top:10%;border:2px solid #007baf;z-index:10000;min-width:600px;max-width:90vw;'
    },

    // 按鈕樣式組 - 統一 padding 和基本屬性
    button: {
      // 所有按鈕的基礎樣式（統一 padding 為 8px 16px）
      base: 'border:none;padding:8px 16px;cursor:pointer;border-radius:4px;font-size:12px;',
      // 主要操作按鈕（藍色）
      primary: 'background:#007baf;color:white;',
      // 成功操作按鈕（綠色）
      success: 'background:#28a745;color:white;',
      // 危險操作按鈕（紅色）
      danger: 'background:#dc3545;color:white;',
      // 次要操作按鈕（灰色）
      secondary: 'background:#6c757d;color:white;',
      // 特殊紫色按鈕
      purple: 'background:#6f42c1;color:white;',
      // 小尺寸按鈕
      small: 'padding:5px 10px;font-size:11px;'
    },

    // 面板樣式組
    panel: {
      // 基礎面板樣式（右側滑出）
      base: 'position:fixed;top:80px;right:0;width:320px;height:calc(100% - 100px);overflow-y:auto;background:white;border-left:2px solid #007baf;box-shadow:-2px 0 5px rgba(0,0,0,0.2);font-family:"Segoe UI","Noto Sans TC",sans-serif;z-index:99999;',
      // 寬版面板
      wide: 'width:400px;',
      // 面板標題列
      header: 'margin:0;background:#007baf;color:white;padding:12px;font-size:16px;display:flex;justify-content:space-between;'
    },

    // 輸入框樣式組
    input: {
      // 搜索輸入框
      search: 'width:calc(100% - 20px);padding:8px;margin:10px;border:1px solid #ccc;border-radius:4px;',
      // URL 輸入框
      url: 'width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;'
    },

    // 通知系統樣式組
    notification: {
      // 通知的基礎定位和外觀
      base: 'position:fixed;top:20px;right:20px;padding:12px 20px;border-radius:6px;z-index:10000;box-shadow:0 4px 12px rgba(0,0,0,0.15);font-size:14px;',
      // 成功通知（綠色）
      success: 'background:#28a745;color:white;',
      // 錯誤通知（紅色）
      error: 'background:#E53E3E;color:white;',
      // 警告通知（橙色）
      warning: 'background:#FF6B35;color:white;',
      // 資訊通知（藍色）
      info: 'background:#667eea;color:white;'
    },

    // 處理中訊息樣式
    processing: {
      base: 'position:fixed;top:30px;right:30px;background:#fff;padding:16px 32px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.13);z-index:9999;font-size:18px;'
    },

    // 關閉按鈕樣式
    closeButton: {
      base: 'position:absolute;top:12px;right:16px;cursor:pointer;font-size:24px;',
      white: 'background:none;border:none;color:white;font-size:16px;cursor:pointer;'
    }
  };

  /**
   * 樣式組合器 - 將多個樣式片段組合成完整的 CSS 字符串
   * 避免手動字符串拼接的錯誤和混亂
   *
   * @param {...string} styles - 要組合的樣式字符串
   * @returns {string} 組合後的完整樣式字符串
   */
  function combineStyles(...styles) {
    return styles.filter(Boolean).join('');
  }

  /**
   * 通知類型到樣式的映射表
   * 用於 showNotification 函數的動態樣式選擇
   */
  const NOTIFICATION_TYPE_MAP = {
    success: UI_COMPONENTS.notification.success,
    error: UI_COMPONENTS.notification.error,
    warning: UI_COMPONENTS.notification.warning,
    info: UI_COMPONENTS.notification.info
  };

  // ===================================================================
  // 狀態系統 - 消除條件分支，用查找表實現狀態處理
  // ===================================================================

  /**
   * 商品狀態系統 - 消除 IsPay/IsGet 的 if/else 地獄
   * 用查找表代替 2^2=4 種條件分支組合
   */
  const ITEM_STATUS_SYSTEM = {
    // 狀態組合查找表：根據付款和取貨狀態決定樣式和文字
    combinations: {
      'paid-delivered': {
        text: '已付/已取',
        color: '#28a745',        // 綠色 - 完成狀態
        borderColor: '#28a745',
        background: '#f8f9ff',
        icon: '✓'
      },
      'paid-pending': {
        text: '已付/未取',
        color: '#ffc107',        // 橙色 - 待取貨
        borderColor: '#ffc107',
        background: '#fff8e1',
        icon: '⏳'
      },
      'unpaid-delivered': {
        text: '未付/已取',
        color: '#dc3545',        // 紅色 - 異常狀態
        borderColor: '#dc3545',
        background: '#ffebee',
        icon: '⚠'
      },
      'unpaid-pending': {
        text: '未付/未取',
        color: '#6c757d',        // 灰色 - 初始狀態
        borderColor: '#ddd',
        background: '#f8f9fa',
        icon: '○'
      }
    },

    /**
     * 根據付款和取貨狀態獲取狀態配置
     * @param {boolean} isPaid - 是否已付款
     * @param {boolean} isDelivered - 是否已取貨
     * @returns {Object} 狀態配置物件
     */
    getStatus(isPaid, isDelivered) {
      const key = `${isPaid ? 'paid' : 'unpaid'}-${isDelivered ? 'delivered' : 'pending'}`;
      return this.combinations[key] || this.combinations['unpaid-pending'];
    },

    /**
     * 生成狀態顯示的 HTML
     * @param {boolean} isPaid - 是否已付款
     * @param {boolean} isDelivered - 是否已取貨
     * @returns {string} 狀態 HTML 字符串
     */
    generateStatusHTML(isPaid, isDelivered) {
      const status = this.getStatus(isPaid, isDelivered);
      return `<span style="color:${status.color};font-weight:600;text-align:center;">${status.text}</span>`;
    },

    /**
     * 應用狀態樣式到元素
     * @param {HTMLElement} element - 要應用樣式的元素
     * @param {boolean} isPaid - 是否已付款
     * @param {boolean} isDelivered - 是否已取貨
     */
    applyStatusStyle(element, isPaid, isDelivered) {
      const status = this.getStatus(isPaid, isDelivered);
      element.style.borderLeftColor = status.borderColor;
      if (status.background && status.background !== '#f8f9fa') {
        element.style.background = status.background;
      }
    }
  };

  // ===================================================================
  // 元件變體系統 - 消除手動屬性調整，用配置驅動
  // ===================================================================

  /**
   * 元件變體配置系統 - 消除到處硬編碼的樣式調整
   * 每種元件的變體都預先配置，避免手動計算和調整
   */
  const COMPONENT_VARIANTS = {
    // 模態框變體配置
    modal: {
      default: {},  // 使用基礎樣式

      stats: {
        // 統計模態框：寬版，適合顯示大量數據
        width: '1000px',
        maxWidth: '95vw'
      },

      wide: {
        // 匯入對話框：更寬更高，適合顯示檔案清單
        width: '1200px',
        maxWidth: '95vw',
        maxHeight: '85vh'
      },

      photo: {
        // 圖片預覽模態框：靠上顯示，特殊邊框
        top: '10%',
        border: '2px solid #007baf',
        zIndex: '10000',
        minWidth: '600px',
        maxWidth: '90vw'
      },

      form: {
        // 表單模態框：中等寶度，更多填充
        width: '600px',
        padding: '30px'
      }
    },

    // 面板變體配置
    panel: {
      default: {},  // 使用基礎樣式 (320px)

      wide: {
        // 寬版面板：設定頁面等
        width: '400px'
      },

      narrow: {
        // 窄版面板：簡單列表
        width: '280px'
      },

      custom: {
        // 自定義寬度面板：遠端匯入等
        width: '380px'
      }
    },

    // 按鈕變體配置（尺寸變體）
    button: {
      default: {},  // 使用基礎樣式

      small: {
        // 小按鈕：工具列用
        padding: '5px 10px',
        fontSize: '11px'
      },

      large: {
        // 大按鈕：主要操作
        padding: '12px 24px',
        fontSize: '14px'
      },

      fullWidth: {
        // 全寬按鈕：面板底部
        width: '100%'
      },

      compact: {
        // 緊湊按鈕：表格中使用
        padding: '4px 8px',
        fontSize: '10px'
      }
    }
  };

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

  // ===================================================================
  // 競標狀態系統 - 消除多層條件判斷，用狀態機處理競標顯示
  // ===================================================================

  /**
   * 競標狀態機系統 - 消除 HasBids/BidPrice/Bidder/NickName 的條件分支地獄
   * 用狀態機 + 查找表代替 3層嵌套的 if/else 判斷
   */
  const BID_STATUS_SYSTEM = {
    // 競標狀態定義：每種狀態的樣式和行為
    states: {
      loading: {
        // 正在查詢競標資料
        text: '查詢中...',
        color: '#6c757d',
        background: '#f8f9fa',
        icon: '⏳',
        displayMode: 'simple'
      },
      noBids: {
        // 確認無競標
        text: '無競標',
        color: '#856404',
        background: '#fff3cd',
        icon: '○',
        displayMode: 'simple'
      },
      hasBids: {
        // 有競標資料
        text: '',  // 動態生成
        color: '#0056b3',
        background: '#f8f9ff',
        icon: '💰',
        displayMode: 'detailed'
      }
    },

    /**
     * 根據商品資料判斷競標狀態
     * @param {Object} item - 商品物件
     * @returns {string} 狀態鍵 (loading|noBids|hasBids)
     */
    determineState(item) {
      // 檢查是否已完成競標資料查詢
      if (!item.hasOwnProperty('HasBids') || item.BidChecked === false) {
        return 'loading';
      }

      // 明確標記無競標
      if (item.HasBids === false) {
        return 'noBids';
      }

      // 有競標且有價格和出價者
      if (item.HasBids === true && item.BidPrice && item.Bidder) {
        return 'hasBids';
      }

      // 預設狀態（安全回退）
      return 'loading';
    },

    /**
     * 格式化出價者顯示名稱 - 消除嵌套條件分支
     * @param {Object} item - 商品物件
     * @returns {string} 格式化的顯示名稱
     */
    formatBidderName(item) {
      const { NickName, Bidder } = item;

      // 使用查找表而非 if/else 巢狀
      const nameFormats = {
        'both': () => `${NickName}(${Bidder})`,      // 有暱稱有ID
        'nickname': () => NickName,                  // 只有暱稱
        'bidder': () => Bidder,                      // 只有ID
        'none': () => '未知出價者'                    // 都沒有（異常情況）
      };

      // 決定使用哪種格式
      let formatKey = 'none';
      if (NickName && Bidder) formatKey = 'both';
      else if (NickName) formatKey = 'nickname';
      else if (Bidder) formatKey = 'bidder';

      return nameFormats[formatKey]();
    },

    /**
     * 生成競標資訊的完整顯示HTML - 統一接口
     * @param {Object} item - 商品物件
     * @param {string} displayType - 顯示類型 ('inline'|'block')
     * @returns {string} 競標顯示HTML
     */
    generateBidDisplay(item, displayType = 'inline') {
      const state = this.determineState(item);
      const config = this.states[state];

      if (config.displayMode === 'simple') {
        // 簡單狀態：loading, noBids
        const style = `color:${config.color};`;
        return displayType === 'inline'
          ? `<span style="${style}">${config.text}</span>`
          : `<br><span style="${style}">${config.text}</span>`;
      }

      // 詳細狀態：hasBids
      const bidderName = this.formatBidderName(item);
      const priceStyle = `color:${config.color};font-weight:600;`;
      const nameStyle = `color:#666;`;

      if (displayType === 'inline') {
        return `<span style="${priceStyle}">${item.BidPrice}元</span><span style="${nameStyle}"> / ${bidderName}</span>`;
      } else {
        return `<br><span style="background-color:#ffebee;padding:2px 4px;border-radius:3px;">最高競標價: ${item.BidPrice} 元<br>最高出價者: ${bidderName}</span>`;
      }
    },

    /**
     * 應用競標狀態樣式到容器元素
     * @param {HTMLElement} element - 要應用樣式的元素
     * @param {Object} item - 商品物件
     */
    applyContainerStyle(element, item) {
      const state = this.determineState(item);
      const config = this.states[state];

      if (config.background && config.background !== '#f8f9fa') {
        element.style.background = config.background;
      }
    }
  };

  // ===================================================================
  // 錯誤處理系統 - 消除散布的 try/catch，統一錯誤處理機制
  // ===================================================================

  /**
   * 統一錯誤處理系統 - 消除代碼中混亂的錯誤處理方式
   * 提供一致的用戶體驗和開發者友好的錯誤追蹤
   */
  const ERROR_HANDLER = {
    // 錯誤上下文映射 - 為不同操作提供用戶友好的錯誤訊息
    contextMessages: {
      // 檔案處理相關
      'file-upload': '檔案上傳時發生錯誤',
      'file-download': '檔案下載時發生錯誤',
      'file-processing': '檔案處理時發生錯誤',
      'json-parsing': 'JSON 資料解析時發生錯誤',

      // 網路請求相關
      'api-call': 'API 請求時發生錯誤',
      'network-request': '網路請求時發生錯誤',
      'remote-import': '遠端匯入時發生錯誤',

      // UI 操作相關
      'ui-operation': '介面操作時發生錯誤',
      'dom-manipulation': 'DOM 操作時發生錯誤',
      'event-handling': '事件處理時發生錯誤',

      // 資料處理相關
      'data-conversion': '資料轉換時發生錯誤',
      'local-storage': '本地儲存操作時發生錯誤',
      'validation': '資料驗證時發生錯誤',

      // 預設
      'unknown': '操作時發生錯誤'
    },

    /**
     * 統一錯誤處理入口
     * @param {Error} error - 錯誤物件
     * @param {string} context - 錯誤上下文（用於查找合適的訊息）
     * @param {Object} options - 選項配置
     * @param {boolean} options.userFriendly - 是否顯示用戶友好訊息（預設true）
     * @param {boolean} options.showNotification - 是否顯示通知（預設true）
     * @param {boolean} options.logToConsole - 是否記錄到控制台（預設true）
     * @param {string} options.fallbackMessage - 自定義回退訊息
     */
    handle(error, context = 'unknown', options = {}) {
      const {
        userFriendly = true,
        showNotification = true,
        logToConsole = true,
        fallbackMessage = null
      } = options;

      // 1. 控制台日誌（開發者用）
      if (logToConsole) {
        console.error(`[${context.toUpperCase()}]`, error);
      }

      // 2. 用戶通知（用戶友好）
      if (showNotification && userFriendly && typeof window.showNotification === 'function') {
        const userMessage = this.getUserFriendlyMessage(error, context, fallbackMessage);
        window.showNotification(userMessage, 'error', APP_CONSTANTS.TIMING.NOTIFICATION_ERROR_DURATION);
      }

      // 3. 返回標準化錯誤資訊（供呼叫者使用）
      return {
        context,
        originalError: error,
        message: error.message,
        userMessage: this.getUserFriendlyMessage(error, context, fallbackMessage),
        timestamp: new Date().toISOString()
      };
    },

    /**
     * 獲取用戶友好的錯誤訊息
     * @param {Error} error - 原始錯誤
     * @param {string} context - 錯誤上下文
     * @param {string} fallbackMessage - 自定義回退訊息
     * @returns {string} 用戶友好的錯誤訊息
     */
    getUserFriendlyMessage(error, context, fallbackMessage) {
      if (fallbackMessage) return fallbackMessage;

      const contextMessage = this.contextMessages[context] || this.contextMessages['unknown'];

      // 對於特定錯誤類型，提供更具體的訊息
      if (error.name === 'SyntaxError') {
        return `${contextMessage}：資料格式不正確`;
      }
      if (error.name === 'NetworkError' || error.message.includes('Failed to fetch')) {
        return `${contextMessage}：網路連線問題，請檢查網路狀態`;
      }
      if (error.name === 'TypeError') {
        return `${contextMessage}：資料類型錯誤`;
      }

      // 預設：上下文訊息 + 簡化的錯誤詳情
      return `${contextMessage}：${error.message}`;
    },

    /**
     * 錯誤包裝器 - 將任何函數包裝為統一錯誤處理
     * @param {Function} fn - 要執行的函數
     * @param {string} context - 錯誤上下文
     * @param {Object} options - 錯誤處理選項
     * @returns {Promise<*>} 函數執行結果或錯誤資訊
     */
    async withErrorHandling(fn, context, options = {}) {
      try {
        return await fn();
      } catch (error) {
        const errorInfo = this.handle(error, context, options);
        // 決定是否重新拋出錯誤（根據配置）
        if (options.rethrow !== false) {
          throw errorInfo;
        }
        return null;
      }
    },

    /**
     * 創建上下文特定的錯誤處理器
     * @param {string} context - 錯誤上下文
     * @param {Object} defaultOptions - 預設選項
     * @returns {Function} 上下文特定的錯誤處理器
     */
    createHandler(context, defaultOptions = {}) {
      return (error, options = {}) => {
        return this.handle(error, context, { ...defaultOptions, ...options });
      };
    }
  };

  // ===================================================================
  // 應用常數定義 - 消除魔法數字，提升代碼可讀性
  // ===================================================================

  /**
   * 應用常數 - 將所有魔法數字語義化，便於維護和理解
   */
  const APP_CONSTANTS = {
    // 時間相關常數（毫秒）
    TIMING: {
      NOTIFICATION_DEFAULT_DURATION: 3000,    // 預設通知顯示時間
      NOTIFICATION_ERROR_DURATION: 4000,      // 錯誤通知顯示時間
      HIGHLIGHT_FADE_DURATION: 2000,          // 高亮消退時間
      STATS_QUERY_DELAY: 1000,                // 統計查詢延遲
      QUERY_FALLBACK_DELAY: 500,              // 查詢回退延遲
      API_REFRESH_DELAY: 2000,                // API 刷新延遲
      PROGRESS_REMOVE_DELAY: 2000,            // 進度條移除延遲
      IMAGE_PROCESSING_DELAY: 200             // 圖片處理間隔
    },

    // 檔案大小相關常數（bytes）
    FILE_SIZE: {
      MB: 1024 * 1024,                        // 1MB 大小
      IMAGE_WARNING_THRESHOLD: 2 * 1024 * 1024, // 圖片警告閾值 2MB
      KB: 1024                                 // 1KB 大小
    },

    // UI 尺寸相關常數
    UI_DIMENSIONS: {
      MODAL_MIN_WIDTH: 600,                    // 模態框最小寬度
      PANEL_DEFAULT_WIDTH: 320,               // 面板預設寬度
      PANEL_WIDE_WIDTH: 400,                  // 寬版面板寬度
      PANEL_CUSTOM_WIDTH: 380,                // 自定義面板寬度
      MODAL_STATS_WIDTH: 1000                 // 統計模態框寬度
    },

    // Z-index 層級管理
    Z_INDEX: {
      PANEL: 99999,                           // 面板層級
      MODAL: 9999,                            // 模態框層級
      MODAL_HIGH: 10000,                      // 高層級模態框
      NOTIFICATION: 10000,                    // 通知層級
      PROGRESS: 10000                         // 進度條層級
    },

    // API 相關常數
    API: {
      DEFAULT_DISTRICT_ID: '231',             // 預設行政區ID
      CATEGORY_DEFAULT_ID: 13,                // 預設類別ID
      AUCTION_DURATION_DAYS: 14,              // 預設競標持續天數
      IMAGE_QUALITY: 0.8                      // 圖片壓縮品質
    },

    // 顏色常數（語義化）
    COLORS: {
      PRIMARY: '#007baf',                     // 主色調
      SUCCESS: '#28a745',                     // 成功色
      WARNING: '#ffc107',                     // 警告色
      DANGER: '#dc3545',                      // 危險色
      INFO: '#667eea',                        // 資訊色
      SECONDARY: '#6c757d',                   // 次要色
      TEXT_MUTED: '#666'                      // 文字淡色
    },

    // UI組件相關常數
    UI_COMPONENTS: {
      // 進度條相關常數
      PROGRESS: {
        INITIAL: '20%',
        PROCESSING_BASE: 20,
        PROCESSING_RANGE: 60,
        FINAL: '90%',
        COMPLETE: '100%'
      }
    },

    // 業務邏輯常數
    BUSINESS: {
      DEFAULT_AUCTION_DURATION_DAYS: 14       // 預設競標天數
    },

    // 時間常數別名（向後相容）
    TIMING: {
      NOTIFICATION_DEFAULT_DURATION: 3000,
      NOTIFICATION_ERROR_DURATION: 4000,
      HIGHLIGHT_RESET_DELAY: 2000,
      API_RETRY_DELAY: 200,
      PROGRESS_CLEANUP_DELAY: 2000
    }
  };

  // ===================================================================
  // 應用狀態管理 - 消除全域變數污染，建立命名空間
  // ===================================================================

  /**
   * 家具助手應用狀態管理 - 替代全域變數的命名空間
   * 所有應用狀態都封裝在此物件中，避免全域命名空間污染
   */
  const FurnitureHelper = {
    // 應用內部狀態
    state: {
      isStatsButtonTriggered: false,  // 替代 window.__statsButtonTriggered
      version: '3.2.0'
    },

    // 狀態管理方法
    setState(key, value) {
      if (this.state.hasOwnProperty(key)) {
        this.state[key] = value;
        console.debug(`[FurnitureHelper] State updated: ${key} = ${value}`);
      }
    },

    getState(key) {
      return this.state[key];
    },

    // 統計按鈕狀態管理
    setStatsTriggered(value) {
      this.setState('isStatsButtonTriggered', value);
    },

    isStatsTriggered() {
      return this.getState('isStatsButtonTriggered');
    }
  };

  // 類別映射表 (對應 webhook.php 的 CATEGORY_MAPPING)
  const CATEGORY_MAPPING = {
    '茶几': 6,
    '沙發': 39,
    '收納櫃': 9,
    '鞋架': 10,
    '鞋櫃': 10,
    '玄關櫃': 11,
    '電視櫃': 12,
    '椅子': 40,
    '書櫃': 14,
    '書桌': 15,
    '家飾': 28,
    '燈具': 29,
    '燈飾': 29,
    '家用電器': 30,
    '腳踏車': 31,
    '其他': 32
  };
  
  // 注意：原有的 NOTIFY_STYLE_MAP 已整合到 NOTIFICATION_TYPE_MAP

  /**
   * 統一通知系統 - 使用新的樣式組合器
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

  // 暴露showNotification到全域，供ERROR_HANDLER使用
  window.showNotification = showNotification;
  
  // 注入 inject.js 到頁面
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('inject.js');
  document.documentElement.appendChild(script);

  // 將圖片轉換為 Base64 的函數
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
          const base64 = canvas.toDataURL('image/jpeg', 0.8); // 使用 JPEG 格式，品質 0.8
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
      return file;
    } catch (error) {
      throw error;
    }
  }

  // 優化的 Base64 轉 File 函數
  function optimizedBase64ToFile(base64String, filename = 'image.jpg') {
    try {
      // 檢查 Base64 大小
      const base64Size = base64String.length;
      const estimatedFileSize = Math.ceil(base64Size * 0.75);
      
      console.log(` Base64 大小: ${(base64Size / 1024).toFixed(1)}KB`);
      console.log(` 預估檔案大小: ${(estimatedFileSize / 1024).toFixed(1)}KB`);
      
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
      console.log(` 轉換成功: ${filename} (${file.size} bytes)`);
      
      // 清理變數，幫助垃圾回收
      u8arr.fill(0);
      
      return file;
      
    } catch (error) {
      console.error(` Base64 轉換失敗: ${error.message}`);
      throw error;
    }
  }

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
      return result;

    } catch (error) {
      throw error; // 將錯誤向上拋出，以便呼叫者可以處理
    }
  }



  // 訊息處理查找表
  const messageHandlers = {
    'vue-stats': (msg) => {
      if (!msg.hierarchicalStats) {
        showNotification('數據格式錯誤', 'error');
        return;
      }
      showHierarchicalModal(msg.hierarchicalStats);
    },
    'vue-panel-data': (msg) => buildPanel(msg.data || []),
    'vue-print': (msg) => printTable(msg.data || [])
  };

  window.addEventListener('message', event => {
    if (event.source !== window || event.origin !== window.location.origin) return;
    
    const msg = event.data;
    if (!msg || !msg.source) {
      console.error('無效的消息格式', msg);
      return;
    }

    const handler = messageHandlers[msg.source];
    if (handler) {
      handler(msg);
    }
  });

  // 新的階層式統計顯示函數
  function showHierarchicalModal(hierarchicalStats) {
    let modal = document.getElementById('vue-stats-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'vue-stats-modal';

      // 使用變體系統：統計模態框變體
      modal.style.cssText = applyComponentVariant('modal', 'stats');
      modal.innerHTML = `
        <span style="${UI_COMPONENTS.closeButton.base}"
              onclick="this.parentNode.style.display='none'">X</span>
        <h3 style="font-size:24px; margin-top:0; text-align:center; color:#333;">📊 統計資料總覽</h3>
        <div style="text-align: center; margin-bottom: 20px; padding: 0 20px;">
          <label style="margin-right: 20px; font-size: 14px; color: #333;">
            <input type="radio" name="stats-mode" value="detailed" checked style="margin-right: 5px;">
            詳細樹狀
          </label>
          <label style="font-size: 14px; color: #333;">
            <input type="radio" name="stats-mode" value="quarterly" style="margin-right: 5px;">
            季報摘要
          </label>
        </div>
        <div style="max-height: 70vh; overflow-y: auto; padding: 10px;">
          <div id="hierarchical-stats-container"></div>
        </div>
      `;
      document.body.appendChild(modal);
    } else {
      // Modal 已存在，重置單選按鈕狀態為預設值
      const detailedRadio = modal.querySelector('input[value="detailed"]');
      const quarterlyRadio = modal.querySelector('input[value="quarterly"]');
      if (detailedRadio) detailedRadio.checked = true;
      if (quarterlyRadio) quarterlyRadio.checked = false;
    }

    const container = modal.querySelector('#hierarchical-stats-container');

    // 渲染統計內容的函數
    function renderStatsContent(mode) {
      container.innerHTML = '';

      if (mode === 'quarterly') {
        // 季報摘要模式
        if (hierarchicalStats.createDate) {
          const createDateSection = generateQuarterlyView(hierarchicalStats.createDate, '📅 建立時間分布', '#007baf');
          container.appendChild(createDateSection);
        }

        if (hierarchicalStats.endDate) {
          const endDateSection = generateQuarterlyView(hierarchicalStats.endDate, '🎯 競標結束時間分布', '#ff6b35');
          container.appendChild(endDateSection);
        }
      } else {
        // 詳細樹狀模式 (原有功能)
        if (hierarchicalStats.createDate) {
          const createDateSection = createStatsTree(hierarchicalStats.createDate, '📅 建立時間分布 (CreateDate)', '#007baf');
          container.appendChild(createDateSection);
        }

        if (hierarchicalStats.endDate) {
          const endDateSection = createStatsTree(hierarchicalStats.endDate, '🎯 競標結束時間分布 (EndDate)', '#ff6b35');
          container.appendChild(endDateSection);
        }
      }
    }

    // 綁定模式切換事件
    const modeRadios = modal.querySelectorAll('input[name="stats-mode"]');
    modeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        renderStatsContent(e.target.value);
      });
    });

    // 初始渲染 (總是從詳細樹狀模式開始)
    renderStatsContent('detailed');

    modal.style.display = 'block';
  }

  // ===================================================================
  // 統計樹系統 - 拆分200行怪獸函數，遵循單一職責原則
  // ===================================================================

  /**
   * 統計樹工廠 - 主函數，負責協調各個子元件
   * @param {Object} dateData - 日期統計資料
   * @param {string} title - 標題
   * @param {string} color - 主題顏色
   * @returns {HTMLElement} 統計樹DOM元素
   */
  function createStatsTree(dateData, title, color) {
    const section = createStatsSection(title, color);
    const content = section.querySelector('.stats-content');

    // 按年份排序並處理
    const sortedYears = Object.keys(dateData).sort((a, b) => b - a);
    sortedYears.forEach(year => {
      const yearSection = createYearSection(dateData[year], year, color);
      content.appendChild(yearSection);
    });

    return section;
  }

  /**
   * 創建統計區段基礎結構 - 單一職責：區段框架
   * @param {string} title - 區段標題
   * @param {string} color - 主題顏色
   * @returns {HTMLElement} 區段DOM元素
   */
  function createStatsSection(title, color) {
    const section = document.createElement('div');
    section.style.cssText = 'margin-bottom: 30px; border: 1px solid #e0e0e0; border-radius: 8px; background: #f8f9fa;';

    const header = document.createElement('div');
    header.style.cssText = `background: ${color}; color: white; padding: 12px; font-size: 16px; font-weight: bold; border-radius: 7px 7px 0 0; cursor: pointer;`;
    header.innerHTML = `${title} <span class="section-toggle">▶</span>`;

    const content = document.createElement('div');
    content.className = 'stats-content';
    content.style.cssText = 'padding: 15px; display: none;';

    // 區段展開/收合邏輯
    header.onclick = () => {
      const isHidden = content.style.display === 'none';
      content.style.display = isHidden ? 'block' : 'none';
      header.querySelector('.section-toggle').textContent = isHidden ? '▼' : '▶';
    };

    section.appendChild(header);
    section.appendChild(content);
    return section;
  }

  /**
   * 創建年份區塊 - 單一職責：年份層級處理
   * @param {Object} yearData - 年份資料
   * @param {string} year - 年份
   * @param {string} color - 主題顏色
   * @returns {HTMLElement} 年份DOM元素
   */
  function createYearSection(yearData, year, color) {
    const yearDiv = document.createElement('div');
    yearDiv.style.cssText = 'margin-bottom: 15px; border-left: 3px solid #ddd; padding-left: 10px;';

    // 計算年度總計 - 使用輔助函數
    const yearTotal = calculateYearTotal(yearData);

    const yearHeader = document.createElement('div');
    yearHeader.style.cssText = 'font-weight: bold; font-size: 14px; color: #333; cursor: pointer; padding: 5px 0; user-select: none;';
    yearHeader.innerHTML = `<span class="toggle">▶</span> ${year}年: ${yearTotal}筆`;

    const yearContent = document.createElement('div');
    yearContent.style.cssText = 'margin-left: 15px; display: none;';

    // 年份展開/收合
    yearHeader.onclick = (e) => {
      e.stopPropagation();
      const isHidden = yearContent.style.display === 'none';
      yearContent.style.display = isHidden ? 'block' : 'none';
      yearHeader.querySelector('.toggle').textContent = isHidden ? '▼' : '▶';
    };

    // 按月份排序並處理
    const sortedMonths = Object.keys(yearData).sort((a, b) => b.localeCompare(a));
    sortedMonths.forEach(month => {
      const monthSection = createMonthSection(yearData[month], month, color);
      yearContent.appendChild(monthSection);
    });

    yearDiv.appendChild(yearHeader);
    yearDiv.appendChild(yearContent);
    return yearDiv;
  }

  /**
   * 計算年度總計 - 單一職責：統計計算
   * @param {Object} yearData - 年份資料
   * @returns {number} 年度總計
   */
  function calculateYearTotal(yearData) {
    let total = 0;
    Object.keys(yearData).forEach(month => {
      Object.keys(yearData[month]).forEach(day => {
        total += yearData[month][day].length;
      });
    });
    return total;
  }

  /**
   * 創建月份區塊 - 單一職責：月份層級處理
   * @param {Object} monthData - 月份資料
   * @param {string} month - 月份
   * @param {string} color - 主題顏色
   * @returns {HTMLElement} 月份DOM元素
   */
  function createMonthSection(monthData, month, color) {
    const monthDiv = document.createElement('div');
    monthDiv.style.cssText = 'margin-bottom: 10px; border-left: 2px solid #ccc; padding-left: 10px;';

    // 計算月度總計
    const monthTotal = Object.keys(monthData).reduce((total, day) => total + monthData[day].length, 0);

    const monthHeader = document.createElement('div');
    monthHeader.style.cssText = 'font-weight: 600; font-size: 13px; color: #555; cursor: pointer; padding: 3px 0; user-select: none;';
    monthHeader.innerHTML = `<span class="toggle">▶</span> ${month}: ${monthTotal}筆`;

    const monthContent = document.createElement('div');
    monthContent.style.cssText = 'margin-left: 15px; display: none;';

    // 月份展開/收合
    monthHeader.onclick = (e) => {
      e.stopPropagation();
      const isHidden = monthContent.style.display === 'none';
      monthContent.style.display = isHidden ? 'block' : 'none';
      monthHeader.querySelector('.toggle').textContent = isHidden ? '▼' : '▶';
    };

    // 按日期排序並處理
    const sortedDays = Object.keys(monthData).sort((a, b) => b.localeCompare(a));
    sortedDays.forEach(day => {
      const daySection = createDaySection(monthData[day], day, color);
      monthContent.appendChild(daySection);
    });

    monthDiv.appendChild(monthHeader);
    monthDiv.appendChild(monthContent);
    return monthDiv;
  }

  /**
   * 創建日期區塊 - 單一職責：日期層級處理
   * @param {Array} dayItems - 當日商品列表
   * @param {string} day - 日期
   * @param {string} color - 主題顏色
   * @returns {HTMLElement} 日期DOM元素
   */
  function createDaySection(dayItems, day, color) {
    const dayDiv = document.createElement('div');
    dayDiv.style.cssText = 'margin-bottom: 8px; padding-left: 10px;';

    const dayHeader = document.createElement('div');
    dayHeader.style.cssText = 'font-size: 12px; color: #666; cursor: pointer; padding: 2px 0; user-select: none;';
    dayHeader.innerHTML = `<span class="toggle">▶</span> ${day}: ${dayItems.length}筆`;

    const dayContent = document.createElement('div');
    dayContent.style.cssText = 'margin-left: 15px; display: none; max-height: 200px; overflow-y: auto;';

    // 日期展開/收合並顯示商品列表
    dayHeader.onclick = (e) => {
      e.stopPropagation();
      const isHidden = dayContent.style.display === 'none';
      if (isHidden && dayContent.innerHTML === '') {
        // 首次展開時載入商品列表
        const sortedItems = dayItems.sort((a, b) => b.AutoID - a.AutoID);
        sortedItems.forEach(item => {
          const itemElement = formatItemDisplay(item, color);
          dayContent.appendChild(itemElement);
        });
      }
      dayContent.style.display = isHidden ? 'block' : 'none';
      dayHeader.querySelector('.toggle').textContent = isHidden ? '▼' : '▶';
    };

    dayDiv.appendChild(dayHeader);
    dayDiv.appendChild(dayContent);
    return dayDiv;
  }

  /**
   * 格式化商品顯示 - 單一職責：商品項目渲染
   * @param {Object} item - 商品物件
   * @param {string} color - 主題顏色
   * @returns {HTMLElement} 商品DOM元素
   */
  function formatItemDisplay(item, color) {
    const itemDiv = document.createElement('div');
    itemDiv.style.cssText = 'font-size: 13px; color: #333; padding: 6px 10px; margin: 3px 0; background: #fff; border-radius: 4px; border-left: 3px solid ' + color + '; line-height: 1.2; font-family: monospace;';

    // 建立一行顯示的結構化內容
    const itemContainer = document.createElement('div');
    itemContainer.style.cssText = 'display: flex; align-items: center; gap: 12px;';

    // ID 欄位
    const idPart = document.createElement('span');
    idPart.style.cssText = 'min-width: 70px; font-weight: 600; color: #007baf;';
    idPart.textContent = `ID:${item.AutoID}`;

    // 商品名稱
    const namePart = document.createElement('span');
    namePart.style.cssText = 'flex: 1; font-weight: 500; word-wrap: break-word;';
    namePart.textContent = item.Name;

    // 狀態欄位 - 使用統一狀態系統
    const statusPart = document.createElement('span');
    statusPart.style.cssText = 'min-width: 80px; font-weight: 600; text-align: center;';
    statusPart.innerHTML = ITEM_STATUS_SYSTEM.generateStatusHTML(item.IsPay, item.IsGet);

    // 競標資訊 - 使用統一競標狀態機
    const bidPart = document.createElement('span');
    bidPart.style.cssText = 'min-width: 200px; font-size: 12px; white-space: nowrap;';
    bidPart.innerHTML = BID_STATUS_SYSTEM.generateBidDisplay(item, 'inline');

    // 應用容器背景樣式
    BID_STATUS_SYSTEM.applyContainerStyle(itemDiv, item);

    // 組裝所有部分
    itemContainer.appendChild(idPart);
    itemContainer.appendChild(namePart);
    itemContainer.appendChild(statusPart);
    itemContainer.appendChild(bidPart);

    itemDiv.appendChild(itemContainer);

    // 使用統一狀態系統應用樣式
    ITEM_STATUS_SYSTEM.applyStatusStyle(itemDiv, item.IsPay, item.IsGet);

    return itemDiv;
  }

  // 生成季報摘要視圖
  function generateQuarterlyView(dateData, title, color) {
    const section = document.createElement('div');
    section.style.cssText = 'margin-bottom: 30px; border: 1px solid #e0e0e0; border-radius: 8px; background: #f8f9fa;';

    const header = document.createElement('div');
    header.style.cssText = `background: ${color}; color: white; padding: 12px; font-size: 16px; font-weight: bold; border-radius: 7px 7px 0 0;`;
    header.textContent = title;

    const content = document.createElement('div');
    content.style.cssText = 'padding: 20px;';

    // 按年份排序（新的在前）
    const sortedYears = Object.keys(dateData).sort((a, b) => b - a);

    sortedYears.forEach(year => {
      const yearData = dateData[year];

      // 建立年份標題
      const yearHeader = document.createElement('div');
      yearHeader.style.cssText = 'font-size: 18px; font-weight: bold; color: #333; margin-bottom: 15px; margin-top: 20px;';
      yearHeader.textContent = `${year}年`;
      if (year === sortedYears[0]) yearHeader.style.marginTop = '0';

      // 計算年度總計
      let yearTotal = 0;
      Object.keys(yearData).forEach(month => {
        Object.keys(yearData[month]).forEach(day => {
          yearTotal += yearData[month][day].length;
        });
      });

      const yearTotalSpan = document.createElement('span');
      yearTotalSpan.style.cssText = 'font-size: 14px; color: #666; font-weight: normal; margin-left: 10px;';
      yearTotalSpan.textContent = `(總計: ${yearTotal}筆)`;
      yearHeader.appendChild(yearTotalSpan);

      // 建立月份資料網格
      const monthGrid = document.createElement('div');
      monthGrid.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;';

      // 按月份排序 (01-12)
      const sortedMonths = Object.keys(yearData).sort((a, b) => a.localeCompare(b));

      sortedMonths.forEach(month => {
        const monthData = yearData[month];

        // 計算月份總計
        let monthTotal = 0;
        Object.keys(monthData).forEach(day => {
          monthTotal += monthData[day].length;
        });

        const monthBox = document.createElement('div');
        monthBox.style.cssText = `
          background: white;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 12px;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        `;

        const monthLabel = document.createElement('div');
        monthLabel.style.cssText = 'font-size: 14px; color: #666; margin-bottom: 5px;';
        monthLabel.textContent = month;

        const monthCount = document.createElement('div');
        monthCount.style.cssText = `font-size: 20px; font-weight: bold; color: ${color};`;
        monthCount.textContent = `${monthTotal}筆`;

        monthBox.appendChild(monthLabel);
        monthBox.appendChild(monthCount);
        monthGrid.appendChild(monthBox);
      });

      content.appendChild(yearHeader);
      content.appendChild(monthGrid);
    });

    section.appendChild(header);
    section.appendChild(content);
    return section;
  }

  function exportToCSV(data = []) {
    const keys = ['AutoID', 'Name', 'DistName', 'CreateDate'];
    const headers = ['編號', '名稱', '行政區', '建立日期'];
    const rows = [headers.join(',')];
    data.sort((a, b) => b.AutoID - a.AutoID);
    data.forEach(row => {
      const line = keys.map(k => {
        const value = k === 'CreateDate' ? (row[k] ?? '').slice(0, 10) : (row[k] ?? '');
        return `"${value.toString().replace(/"/g, '""')}"`;
      }).join(',');
      rows.push(line);
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `furniture-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportAllToCSV(data = []) {
    const keys = ['AutoID', 'Name', 'CategoryName', 'DistName', 'CreateDate', 'Description', 'Length', 'Width', 'Height', 'DeliveryAddress', 'InitPrice', 'OriginPrice'];
    const headers = ['編號', '名稱', '類別', '行政區', '建立日期', '產品描述', '長', '寬', '高', '交貨地點', '起標價格', '原價'];
    const rows = [headers.join(',')];
    data.sort((a, b) => b.AutoID - a.AutoID);
    data.forEach(row => {
      const line = keys.map(k => {
        const value = k === 'CreateDate' ? (row[k] ?? '').slice(0, 10) : (row[k] ?? '');
        return `"${value.toString().replace(/"/g, '""')}"`;
      }).join(',');
      rows.push(line);
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `furniture-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function showPhotoPreview(photos) {
    let modal = document.getElementById('photo-preview-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'photo-preview-modal';

      // 使用變體系統：圖片預覽模態框變體
      modal.style.cssText = applyComponentVariant('modal', 'photo');
      modal.innerHTML = `
        <span style="${UI_COMPONENTS.closeButton.base}color:#666;"
              onclick="this.parentNode.style.display='none'">X</span>
        <h3 style="margin-top:0; margin-bottom:20px; color:#007baf; font-size:20px;">圖片預覽</h3>
        <div id="photo-preview-container" style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center;"></div>
      `;
      document.body.appendChild(modal);
    }

    const container = modal.querySelector('#photo-preview-container');
    container.innerHTML = '';
    if (photos && Array.isArray(photos) && photos.length > 0) {
      photos.forEach((photo, index) => {
        const imgWrapper = document.createElement('div');
        imgWrapper.style.cssText = `
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        `;
        
        const img = document.createElement('img');
        img.src = photo.Photo;
        img.style.cssText = `
          max-width: 400px;
          max-height: 400px;
          width: auto;
          height: auto;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          cursor: pointer;
        `;
        img.alt = `Photo ${index + 1}`;
        
        // 點擊圖片可以放大查看
        
        
        const imgLabel = document.createElement('div');
        imgLabel.textContent = `圖片 ${index + 1}`;
        imgLabel.style.cssText = `
          font-size: 12px;
          color: #666;
          font-weight: bold;
        `;
        
        imgWrapper.appendChild(img);
        imgWrapper.appendChild(imgLabel);
        container.appendChild(imgWrapper);
      });
    } else {
      container.innerHTML = '<p style="color:#666; font-size:16px;">無圖片可顯示</p>';
    }
    modal.style.display = 'block';
  }

  /**
   * 取得競標狀態HTML - 重構為使用統一狀態機
   * @param {Object} item - 商品物件
   * @returns {string} 競標狀態HTML
   */
  function getBidStatusHTML(item) {
    // 使用統一競標狀態機，零條件分支
    return BID_STATUS_SYSTEM.generateBidDisplay(item, 'block');
  }

  function buildPanel(data = []) {
    const panelId = 'furniture-panel';
    const existingPanel = document.getElementById(panelId);
    if (existingPanel) existingPanel.remove(); // 確保舊面板移除

    const newPanel = document.createElement('div');
    newPanel.id = panelId;
    // 使用變體系統：預設面板變體
    newPanel.style.cssText = applyComponentVariant('panel', 'default');

    // --- 建立靜態頭部 ---
    const header = document.createElement('h2');
    header.style.cssText = UI_COMPONENTS.panel.header;

    const titleSpan = document.createElement('span');
    titleSpan.textContent = '匯出家具資料';

    const closeButton = document.createElement('button');
    closeButton.id = 'close-panel';
    closeButton.textContent = 'X';
    closeButton.style.cssText = 'background: none; border: none; color: white; font-size: 16px; cursor: pointer;';
    closeButton.onclick = () => newPanel.remove();

    header.appendChild(titleSpan);
    header.appendChild(closeButton);
    newPanel.appendChild(header);

    // 批次操作控制區域
    const batchControlsContainer = document.createElement('div');
    batchControlsContainer.style.cssText = 'padding: 10px; background: #f8f9fa; border-bottom: 1px solid #dee2e6; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;';

    // 全選控制
    const selectAllContainer = document.createElement('div');
    selectAllContainer.style.cssText = 'display: flex; align-items: center; gap: 8px;';

    const selectAllCheckbox = document.createElement('input');
    selectAllCheckbox.type = 'checkbox';
    selectAllCheckbox.id = 'select-all-items';
    selectAllCheckbox.checked = true;
    selectAllCheckbox.style.cssText = 'transform: scale(1.2);';

    const selectAllLabel = document.createElement('label');
    selectAllLabel.htmlFor = 'select-all-items';
    selectAllLabel.textContent = '全選';
    selectAllLabel.style.cssText = 'font-weight: bold; cursor: pointer;';

    const selectedCountSpan = document.createElement('span');
    selectedCountSpan.id = 'selected-count';
    selectedCountSpan.textContent = `(已選 ${data.length} 項)`;
    selectedCountSpan.style.cssText = 'color: #6c757d; font-size: 14px;';

    selectAllContainer.appendChild(selectAllCheckbox);
    selectAllContainer.appendChild(selectAllLabel);
    selectAllContainer.appendChild(selectedCountSpan);

    // 操作按鈕容器
    const actionsContainer = document.createElement('div');
    actionsContainer.style.cssText = 'display: flex; gap: 10px;';

    // 批次匯出按鈕
    const batchExportBtn = document.createElement('button');
    batchExportBtn.textContent = '批次匯出';
    batchExportBtn.style.cssText = applyComponentVariant('button', 'default', 'primary') + 'font-weight: bold;';
    batchExportBtn.onclick = () => {
      const selectedItems = getSelectedItems();
      if (selectedItems.length === 0) {
        showNotification('請至少選擇一個項目', 'warning');
        return;
      }

      // 顯示下載設定警告，用戶確認後開始下載
      showDownloadSettingsWarning(() => {
        downloadMultipleFiles(selectedItems);
      });
    };

    // 批次匯入按鈕
    const batchImportBtn = document.createElement('button');
    batchImportBtn.textContent = '批次匯入';
    batchImportBtn.style.cssText = applyComponentVariant('button', 'default', 'success') + 'font-weight: bold;';
    batchImportBtn.onclick = () => showImportModal();

    // 批次刪除按鈕
    const batchDeleteBtn = document.createElement('button');
    batchDeleteBtn.textContent = '批次刪除';
    batchDeleteBtn.style.cssText = applyComponentVariant('button', 'default', 'danger') + 'font-weight: bold;';
    batchDeleteBtn.onclick = () => {
      const selectedItems = getSelectedItems();
      if (selectedItems.length === 0) {
        showNotification('請至少選擇一個項目進行刪除', 'warning');
        return;
      }
      showDeleteConfirmationModal(selectedItems);
    };

    actionsContainer.appendChild(batchExportBtn);
    actionsContainer.appendChild(batchImportBtn);
    actionsContainer.appendChild(batchDeleteBtn);

    batchControlsContainer.appendChild(selectAllContainer);
    batchControlsContainer.appendChild(actionsContainer);
    newPanel.appendChild(batchControlsContainer);

    // 全選功能
    selectAllCheckbox.onchange = () => {
      const itemCheckboxes = newPanel.querySelectorAll('.item-checkbox');
      if (selectAllCheckbox.checked) {
        // 全選時：使用建立時儲存的競標狀態，保持與預設選擇一致
        itemCheckboxes.forEach(cb => {
          const item = JSON.parse(cb.dataset.itemData);
          const bidState = BID_STATUS_SYSTEM.determineState(item);
          cb.checked = bidState !== 'hasBids'; // 只選擇無競標的項目
        });
      } else {
        // 取消全選：清空所有選擇
        itemCheckboxes.forEach(cb => {
          cb.checked = false;
        });
      }
      updateSelectedCount();
    };

    // 更新選中數量的函數
    function updateSelectedCount() {
      const itemCheckboxes = newPanel.querySelectorAll('.item-checkbox');
      const checkedCount = Array.from(itemCheckboxes).filter(cb => cb.checked).length;
      selectedCountSpan.textContent = `(已選 ${checkedCount} 項)`;

      // 更新全選 checkbox 狀態
      if (checkedCount === 0) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = false;
      } else if (checkedCount === itemCheckboxes.length) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = true;
      } else {
        selectAllCheckbox.indeterminate = true;
      }
    }

    // 獲取選中項目的函數
    function getSelectedItems() {
      const selectedItems = [];
      const itemCheckboxes = newPanel.querySelectorAll('.item-checkbox:checked');
      itemCheckboxes.forEach(cb => {
        const itemIndex = parseInt(cb.dataset.itemIndex);
        selectedItems.push(data[itemIndex]);
      });
      return selectedItems;
    }

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'panel-search';
    searchInput.placeholder = '輸入 AutoID 搜尋';
    searchInput.style.cssText = UI_COMPONENTS.input.search;
    searchInput.onkeyup = (e) => {
      const inputValue = e.target.value.trim();
      const items = newPanel.querySelectorAll('[data-autoid]');
      if (!inputValue) {
        items.forEach(item => { item.style.background = ''; });
        return;
      }
      const targetItem = newPanel.querySelector(`[data-autoid="${inputValue}"]`);
      items.forEach(item => { item.style.background = ''; });
      if (targetItem) {
        safeScrollIntoView(targetItem, { behavior: 'smooth', block: 'center' });
        targetItem.style.background = '#e6f3ff';
        setTimeout(() => { if(targetItem) targetItem.style.background = ''; }, APP_CONSTANTS.TIMING.HIGHLIGHT_RESET_DELAY);
      }
    };
    newPanel.appendChild(searchInput);

    // --- 動態建立資料列表 ---
    data.sort((a, b) => b.AutoID - a.AutoID);
    data.forEach((item, i) => {
      const div = document.createElement('div');
      div.dataset.autoid = item.AutoID;
      div.style = `padding: 10px; border-bottom: 1px solid #eee; font-size: 14px; background-color: ${i % 2 === 0 ? '#ffffff' : '#f0f2f5'};`;

      const topRow = document.createElement('div');
      topRow.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';

      // 左側：選擇框 + 名稱資訊
      const leftContainer = document.createElement('div');
      leftContainer.style.cssText = 'display: flex; align-items: center; gap: 8px; flex-grow: 1;';

      // 項目選擇 checkbox
      const itemCheckbox = document.createElement('input');
      itemCheckbox.type = 'checkbox';
      itemCheckbox.className = 'item-checkbox';
      // 根據競標狀態設定預設選擇：有競標者時取消選取
      const bidState = BID_STATUS_SYSTEM.determineState(item);
      itemCheckbox.checked = bidState !== 'hasBids'; // 有競標時不選中
      itemCheckbox.dataset.itemIndex = i;
      // 儲存項目資料供全選功能使用，確保一致性
      itemCheckbox.dataset.itemData = JSON.stringify(item);
      itemCheckbox.style.cssText = 'transform: scale(1.1);';
      itemCheckbox.onchange = () => updateSelectedCount();

      const nameContainer = document.createElement('span');
      const photoIcon = document.createElement('span');
      photoIcon.className = 'photo-preview-icon';
      photoIcon.style.cursor = 'pointer';
      photoIcon.textContent = '[IMG]';
      photoIcon.onclick = () => showPhotoPreview(item.Photos);

      const nameStrong = document.createElement('strong');
      nameStrong.textContent = ` ${item.Name || '未命名'}`;

      nameContainer.appendChild(photoIcon);
      nameContainer.appendChild(nameStrong);

      // 左側容器組合：checkbox + 名稱
      leftContainer.appendChild(itemCheckbox);
      leftContainer.appendChild(nameContainer);

      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = 'display: flex; gap: 5px; flex-shrink: 0;';

      const packageBtn = document.createElement('button');
      packageBtn.className = 'package-download-btn';
      // 使用變體系統：預設按鈕 + 主要主題
      packageBtn.style.cssText = applyComponentVariant('button', 'default', 'primary');
      packageBtn.dataset.index = i;
      packageBtn.textContent = 'PACK';
      packageBtn.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const { Photos, ...restOfItem } = item;
        packageBtn.textContent = '處理中...';
        packageBtn.disabled = true;
        packageBtn.style.background = '#6c757d';
        try {
          const photosWithBase64 = [];
          if (Photos && Array.isArray(Photos) && Photos.length > 0) {
            for (const photo of Photos) {
              const photoUrl = photo.Photo.startsWith('http') ? photo.Photo : location.origin + photo.Photo;
              try {
                const base64 = await convertImageToBase64(photoUrl);
                photosWithBase64.push({ ...photo, Photo: base64, PhotoUrl: photoUrl });
              } catch (error) {
                photosWithBase64.push({ ...photo, PhotoUrl: photoUrl, Error: '圖片轉換失敗' });
              }
            }
          }
          const dataToExport = { ...restOfItem, Photos: photosWithBase64, ExportInfo: { ExportDate: new Date().toISOString(), ExportType: 'PackageDownload' } };
          const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${item.Name || `item_${item.AutoID}`}_package.json`;
          a.click();
          URL.revokeObjectURL(url);
        } catch (error) {
          ERROR_HANDLER.handle(error, 'file-processing', { fallbackMessage: '打包下載失敗，請稍後再試' });
        } finally {
          packageBtn.textContent = 'PACK';
          packageBtn.disabled = false;
          packageBtn.style.background = '#007baf';
        }
      };

      const downloadBtn = document.createElement('button');
      downloadBtn.className = 'download-btn';
      // 使用變體系統：預設按鈕 + 成功主題
      downloadBtn.style.cssText = applyComponentVariant('button', 'default', 'success');
      downloadBtn.dataset.index = i;
      downloadBtn.textContent = 'DL';
      downloadBtn.onclick = () => {
        const { Photos, ...restOfItem } = item;
        const blob = new Blob([JSON.stringify(restOfItem, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${item.Name || `item_${item.AutoID}`}.json`;
        a.click();
        URL.revokeObjectURL(url);
        (Photos || []).forEach((p, j) => {
          const imgA = document.createElement('a');
          imgA.href = p.Photo.startsWith('http') ? p.Photo : location.origin + p.Photo;
          imgA.download = `${item.Name || `item_${item.AutoID}`}_${j + 1}.jpg`;
          imgA.click();
        });
      };

      buttonContainer.appendChild(packageBtn);
      buttonContainer.appendChild(downloadBtn);

      topRow.appendChild(leftContainer);
      topRow.appendChild(buttonContainer);

      const bottomRow = document.createElement('div');
      bottomRow.style.cssText = 'color: #666; font-size: 13px; margin-top: 4px;';
      bottomRow.innerHTML = `ID: ${item.AutoID} | 日期: ${(item.CreateDate || '').split('T')[0]} ${getBidStatusHTML(item)}`;

      div.appendChild(topRow);
      div.appendChild(bottomRow);
      newPanel.appendChild(div);
    });

    // 初始計算選中數量（扣掉有競標者）
    updateSelectedCount();

    document.body.appendChild(newPanel);
  }

  function insertButtons() {
    const addBtn = document.querySelector('button.el-button.el-button--success');
    if (!addBtn || document.querySelector('#tm-stats-btn')) return;

    if (!addBtn.parentNode) {
      console.error('父節點未找到');
      return;
    }

    addBtn.onclick = null; // 載入表單功能已廢棄

    const statsBtn = document.createElement('button');
    statsBtn.type = 'button';
    statsBtn.id = 'tm-stats-btn';
    statsBtn.textContent = '年度統計';
    statsBtn.className = 'el-button el-button--primary el-button--small';
    statsBtn.style.marginLeft = '5px';
    statsBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      FurnitureHelper.setStatsTriggered(true);
      const queryBtn = Array.from(document.querySelectorAll('button.el-button')).find(b => /查\s*詢/.test(b.textContent));
      if (!queryBtn) {
        console.error('查詢按鈕未找到');
        alert('查詢按鈕未找到，請確認頁面已載入');
        FurnitureHelper.setStatsTriggered(false);
        return;
      }
      try {
        if (queryBtn.__vue__ && queryBtn.__vue__.$emit) {
          queryBtn.__vue__.$emit('click');
        } else {
          const clickEvent = new MouseEvent('click', { bubbles: false, cancelable: true, view: window });
          queryBtn.dispatchEvent(clickEvent);
        }
        setTimeout(() => {
          window.postMessage({ source: 'run-vue-stats' }, window.location.origin);
          FurnitureHelper.setStatsTriggered(false);
        }, 1000);
      } catch (error) {
        console.error('觸發查詢按鈕時發生錯誤:', error);
        setTimeout(() => {
          window.postMessage({ source: 'run-vue-stats' }, window.location.origin);
          FurnitureHelper.setStatsTriggered(false);
        }, 500);
      }
    };

    const panelBtn = document.createElement('button');
    panelBtn.type = 'button';
    panelBtn.textContent = '資料面板';
    panelBtn.className = 'el-button el-button--info el-button--small';
    panelBtn.style.marginLeft = '5px';
    panelBtn.onclick = () => {
      const panel = document.getElementById('furniture-panel');
      if (panel) {
        panel.remove();
      } else {
        window.postMessage({ source: 'run-vue-panel' }, window.location.origin);
      }
    };

    const printBtn = document.createElement('button');
    printBtn.type = 'button';
    printBtn.textContent = '列印表格';
    printBtn.className = 'el-button el-button--success el-button--small';
    printBtn.style.marginLeft = '5px';
    printBtn.onclick = () => {
      window.postMessage({ source: 'run-vue-print' }, window.location.origin);
    };

    const quickImportBtn = document.createElement('button');
    quickImportBtn.type = 'button';
    quickImportBtn.textContent = '直接匯入';
    quickImportBtn.className = 'el-button el-button--danger el-button--small';
    quickImportBtn.style.marginLeft = '5px';
    quickImportBtn.title = '選擇包含 Base64 圖片的 JSON 檔案，直接送到伺服器';
    quickImportBtn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.style.display = 'none';
      input.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const processingMsg = document.createElement('div');
        processingMsg.textContent = '正在處理資料，請稍候...';
        processingMsg.style.cssText = UI_COMPONENTS.processing.base;
        document.body.appendChild(processingMsg);
        try {
          const text = await file.text();
          const jsonData = JSON.parse(text);
          const now = new Date();
          const createDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
          const modifyDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + APP_CONSTANTS.BUSINESS.DEFAULT_AUCTION_DURATION_DAYS, 0, 0, 0, 0);
          const formatDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T00:00:00.00`;
          jsonData.StartDate = formatDate(createDate);
          jsonData.EndDate = formatDate(modifyDate);
          await directSubmitToAPI(jsonData);
          processingMsg.remove();
        } catch (error) {
          processingMsg.remove();
          ERROR_HANDLER.handle(error, 'file-processing', { fallbackMessage: '直接匯入失敗，請檢查檔案格式' });
        }
        document.body.removeChild(input);
      });
      document.body.appendChild(input);
      input.click();
    };

    const remoteQuickImportBtn = document.createElement('button');
    remoteQuickImportBtn.type = 'button';
    remoteQuickImportBtn.textContent = '遠端匯入';
    remoteQuickImportBtn.className = 'el-button el-button--danger el-button--small';
    remoteQuickImportBtn.style.marginLeft = '5px';
    remoteQuickImportBtn.title = '從遠端 files.php 獲取 JSON 清單並循序匯入';
    remoteQuickImportBtn.onclick = handleRemoteQuickImport;

    const settingsBtn = document.createElement('button');
    settingsBtn.type = 'button';
    settingsBtn.textContent = '設定';
    settingsBtn.className = 'el-button el-button--info el-button--small';
    settingsBtn.style.marginLeft = '5px';
    settingsBtn.title = '設定 Webhook 網址';
    settingsBtn.onclick = showSettingsPanel;

    // --- 輔助函數定義 --- 

    const DEFAULT_WEBHOOK_URL = 'https://580.blias.com/daobo/files.php?format=json';
    
    function saveWebhookSetting(url) {
      try { localStorage.setItem('furniture-helper-webhook-url', url); } catch (e) { console.error('儲存設定失敗:', e); }
    }
    
    function loadWebhookSetting() {
      try { return localStorage.getItem('furniture-helper-webhook-url') || DEFAULT_WEBHOOK_URL; } catch (e) { return DEFAULT_WEBHOOK_URL; }
    }
    
    function getCurrentWebhookUrl() {
      return loadWebhookSetting();
    }

    function isValidUrl(string) {
      try { new URL(string); return true; } catch (_) { return false; }
    }

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

    function showSettingsPanel() {
      const panelId = 'settings-panel';
      if (document.getElementById(panelId)) document.getElementById(panelId).remove();
      const panel = document.createElement('div');
      panel.id = panelId;
      // 使用變體系統：寬版面板變體
      panel.style.cssText = applyComponentVariant('panel', 'wide');
      panel.innerHTML = `
        <h2 style="${UI_COMPONENTS.panel.header}"><span>系統設定</span><button id="close-settings-panel" style="${UI_COMPONENTS.closeButton.white}">X</button></h2>
        <div style="padding:20px;">
          <label style="display:block;margin-bottom:8px;font-weight:bold;">遠端匯入 Webhook 網址：</label>
          <input type="url" id="webhook-url-input" style="${UI_COMPONENTS.input.url}" value="${getCurrentWebhookUrl()}">
          <div style="margin-top:8px;font-size:12px;color:#666;">預設值：${DEFAULT_WEBHOOK_URL}</div>
          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">
            <button id="reset-webhook-btn" style="${applyComponentVariant('button', 'default', 'secondary')}">重置</button>
            <button id="save-webhook-btn" style="${applyComponentVariant('button', 'default', 'primary')}">儲存</button>
          </div>
          <div style="margin-top:20px;padding-top:20px;border-top:1px solid #eee;"><button id="test-webhook-btn" style="${applyComponentVariant('button', 'fullWidth', 'success')}">測試連線</button></div>
          <div style="margin-top:20px;padding-top:20px;border-top:1px solid #eee;"><button id="open-files-page-btn" style="${applyComponentVariant('button', 'fullWidth', 'purple')}">🔗 開啟 Files.php</button></div>
        </div>`;
      document.body.appendChild(panel);
      document.getElementById('close-settings-panel').onclick = () => panel.remove();
      document.getElementById('save-webhook-btn').onclick = () => { const url = document.getElementById('webhook-url-input').value.trim(); if(isValidUrl(url)){ saveWebhookSetting(url); showNotification('設定已儲存', 'success'); } else { showNotification('請輸入有效的網址格式', 'error'); } };
      document.getElementById('reset-webhook-btn').onclick = () => { document.getElementById('webhook-url-input').value = DEFAULT_WEBHOOK_URL; saveWebhookSetting(DEFAULT_WEBHOOK_URL); showNotification('已重置為預設值', 'success'); };
      document.getElementById('test-webhook-btn').onclick = () => { const url = document.getElementById('webhook-url-input').value.trim(); if(isValidUrl(url)) testWebhookConnection(url); else showNotification('請輸入有效的網址格式', 'error'); };
      document.getElementById('open-files-page-btn').onclick = () => { const url = new URL(getCurrentWebhookUrl()); window.open(`${url.protocol}//${url.host}${url.pathname}`, '_blank'); };
    }

    async function handleRemoteQuickImport(e) {
      e.preventDefault(); e.stopPropagation();
      const processingMsg = document.createElement('div');
      processingMsg.textContent = '正在獲取資料...';
      processingMsg.style.cssText = UI_COMPONENTS.processing.base;
      document.body.appendChild(processingMsg);
      try {
        const webhookUrl = getCurrentWebhookUrl();
        const response = await fetch(webhookUrl);
        if (!response.ok) throw new Error(`無法獲取檔案清單: ${response.statusText}`);
        const filesToImport = await response.json();
        if (!filesToImport || !filesToImport.length) {
          showNotification('遠端沒有需要匯入的檔案', 'info');
        } else {
          buildRemoteImportSelectionPanel(filesToImport);
        }
      } catch (error) {
        ERROR_HANDLER.handle(error, 'remote-import');
      } finally {
        processingMsg.remove();
      }
    }

    function buildRemoteImportSelectionPanel(files = []) {
      const panelId = 'remote-import-selection-panel';
      if(document.getElementById(panelId)) document.getElementById(panelId).remove();
      const newPanel = document.createElement('div');
      newPanel.id = panelId;
      // 使用變體系統：自定義寬度面板變體
      newPanel.style.cssText = applyComponentVariant('panel', 'custom');
      newPanel.innerHTML = `<h2 style="${UI_COMPONENTS.panel.header}"><span>選擇遠端匯入資料</span><button id="close-remote-import-panel" style="${UI_COMPONENTS.closeButton.white}">X</button></h2><input type="text" id="remote-panel-search" placeholder="輸入名稱或價格搜尋" style="${UI_COMPONENTS.input.search}"><div id="remote-import-list-container"></div>`;
      const listContainer = newPanel.querySelector('#remote-import-list-container');
      files.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      files.forEach((fileInfo, i) => {
        const div = document.createElement('div');
        div.style = `padding:10px;border-bottom:1px solid #eee;font-size:14px;background-color:${i % 2 === 0 ? '#fff' : '#f0f2f5'};`;
        div.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;"><strong>${fileInfo.title || '未命名'}</strong><button class="import-single-remote-btn" style="${applyComponentVariant('button', 'default', 'success')}">匯入</button></div><div style="color:#666;font-size:13px;margin-top:4px;">價格: ${fileInfo.price} | 日期: ${fileInfo.date.split(' ')[0]}</div>`;
        const importBtn = div.querySelector('.import-single-remote-btn');
        if (importBtn) importBtn.onclick = () => handleSingleRemoteImport(fileInfo);
        listContainer.appendChild(div);
      });
      document.body.appendChild(newPanel);
      document.getElementById('close-remote-import-panel').onclick = () => newPanel.remove();
      document.getElementById('remote-panel-search').onkeyup = (e) => {
        const inputValue = e.target.value.trim().toLowerCase();
        listContainer.querySelectorAll('div[data-title]').forEach(item => {
          const title = item.dataset.title.toLowerCase();
          const price = item.dataset.price.toLowerCase();
          item.style.display = (title.includes(inputValue) || price.includes(inputValue)) ? '' : 'none';
        });
      };
    }

    async function handleSingleRemoteImport(fileInfo) {
      const progressDiv = createCancellableProgress(fileInfo.title);
      const progressText = progressDiv.querySelector('.progress-text');
      const progressFill = progressDiv.querySelector('.progress-fill');
      try {
        progressText.textContent = '正在下載檔案...';
        progressFill.style.width = '10%';
        const baseUrl = getCurrentWebhookUrl().split('?')[0];
        const downloadUrl = `${baseUrl}?action=download&file=${fileInfo.filename}`;
        const fileContentResponse = await fetch(downloadUrl);
        if (!fileContentResponse.ok) throw new Error(`無法下載檔案: ${fileContentResponse.statusText}`);
        const jsonData = await fileContentResponse.json();
        progressFill.style.width = APP_CONSTANTS.UI_COMPONENTS.PROGRESS.INITIAL;
        if (jsonData.Photos && Array.isArray(jsonData.Photos) && jsonData.Photos.length > 0) {
          const processedPhotos = [];
          for (let i = 0; i < jsonData.Photos.length; i++) {
            progressText.textContent = `處理圖片中... ${i + 1}/${jsonData.Photos.length}`;
            progressFill.style.width = `${APP_CONSTANTS.UI_COMPONENTS.PROGRESS.PROCESSING_BASE + Math.round(((i+1) / jsonData.Photos.length) * APP_CONSTANTS.UI_COMPONENTS.PROGRESS.PROCESSING_RANGE)}%`;
            const photo = jsonData.Photos[i];
            if (photo.Photo && photo.Photo.startsWith('data:image')) {
              const imageFile = optimizedBase64ToFile(photo.Photo, photo.filename || `image_${i + 1}.jpg`);
              const uploadResult = await uploadImage(imageFile);
              processedPhotos.push({ ...photo, Photo: uploadResult.FilePath || uploadResult, uploaded: true });
            } else { processedPhotos.push(photo); }
            await new Promise(resolve => setTimeout(resolve, APP_CONSTANTS.TIMING.API_RETRY_DELAY));
          }
          jsonData.Photos = processedPhotos;
        }
        progressText.textContent = '更新日期資訊...';
        progressFill.style.width = '85%';
        const now = new Date();
        const createDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const modifyDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + APP_CONSTANTS.BUSINESS.DEFAULT_AUCTION_DURATION_DAYS, 0, 0, 0, 0);
        const formatDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T00:00:00.00`;
        jsonData.StartDate = formatDate(createDate);
        jsonData.EndDate = formatDate(modifyDate);
        progressText.textContent = '正在送出資料...';
        progressFill.style.width = APP_CONSTANTS.UI_COMPONENTS.PROGRESS.FINAL;
        await directSubmitToAPI(jsonData);
        progressText.textContent = '匯入完成！';
        progressFill.style.width = APP_CONSTANTS.UI_COMPONENTS.PROGRESS.COMPLETE;
        setTimeout(() => progressDiv.remove(), APP_CONSTANTS.TIMING.PROGRESS_CLEANUP_DELAY);
      } catch (error) {
        progressDiv.remove();
        ERROR_HANDLER.handle(error, 'remote-import', { fallbackMessage: `匯入檔案 ${fileInfo.title} 失敗` });
      }
    }

    function createCancellableProgress(title) {
      const div = document.createElement('div');
      div.innerHTML = `<div class="progress-modal" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:10000;min-width:300px;text-align:center;"><h3 style="margin:0 0 15px 0;color:#007baf;">處理中: ${title}</h3><div class="progress-bar" style="width:100%;height:20px;background:#f0f0f0;border-radius:10px;margin:15px 0;overflow:hidden;"><div class="progress-fill" style="height:100%;background:#007baf;width:0%;transition:width 0.3s;"></div></div><p class="progress-text" style="margin:10px 0;font-size:14px;color:#666;">準備中...</p><button class="cancel-btn" onclick="this.parentElement.parentElement.remove()" style="background:#dc3545;color:white;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;margin-top:10px;font-size:12px;">取消</button></div>`;
      document.body.appendChild(div);
      return div;
    }

    // --- 按鈕插入邏輯 ---
    addBtn.parentNode.insertBefore(statsBtn, addBtn.nextSibling);
    addBtn.parentNode.insertBefore(panelBtn, statsBtn.nextSibling);
    addBtn.parentNode.insertBefore(printBtn, panelBtn.nextSibling);
    addBtn.parentNode.insertBefore(quickImportBtn, printBtn.nextSibling);
    addBtn.parentNode.insertBefore(remoteQuickImportBtn, quickImportBtn.nextSibling);
    addBtn.parentNode.insertBefore(settingsBtn, remoteQuickImportBtn.nextSibling);

    console.log('已插入功能按鈕');
  }



  // 為編輯視窗添加匯入 JSON 按鈕


  function printTable(data = []) {
    if (!data.length) {
      showNotification('沒有資料可列印', 'warning');
      return;
    }

    // 格式化日期
    function formatDate(dateString) {
      if (!dateString) return '無';
      const date = new Date(dateString);
      return date.toISOString().slice(0, 10);
    }

    // 格式化金額
    function formatCurrency(amount) {
      if (!amount && amount !== 0) return '無';
      return new Intl.NumberFormat('zh-TW').format(amount);
    }

    // 取得應付金額
    function getTotalAmount(payment) {
      if (!payment || typeof payment !== 'object') return null;
      return payment.TotalAmount;
    }

    // 取得得標者資訊
    function getWinnerInfo(row) {
      if (!row.WinnerID) return '無得標者';
      
      const nickName = row.NickName || '';
      const account = row.Account || '';
      
      if (nickName && account) {
        return `${nickName}(${account})`;
      } else if (nickName) {
        return nickName;
      } else if (account) {
        return account;
      } else {
        return `ID: ${row.WinnerID}`;
      }
    }

    // 準備列印資料
    const printData = data
      .sort((a, b) => b.AutoID - a.AutoID)
      .map(row => ({
        AutoID: row.AutoID || '無',
        Name: row.Name || '未命名',
        CategoryName: row.CategoryName || '無',
        DistName: row.DistName || '無',
        EndDate: formatDate(row.EndDate),
        TotalAmount: formatCurrency(getTotalAmount(row.Payment)),
        Winner: getWinnerInfo(row)
      }));

    // 建立列印頁面 HTML
    const printHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>新北市再生家具資料表</title>
    <style>
        @media print {
            body { margin: 0; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; }
            .no-print { display: none; }
        }
        
        body {
            font-family: 'Microsoft JhengHei', 'Segoe UI', sans-serif;
            margin: 20px;
            font-size: 12px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 18px;
            color: #333;
        }
        
        .header p {
            margin: 5px 0;
            color: #666;
            font-size: 11px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
            vertical-align: top;
        }
        
        th {
            background-color: #f5f5f5;
            font-weight: bold;
            font-size: 11px;
        }
        
        td {
            font-size: 11px;
        }
        
        .auto-id { width: 80px; }
        .name { width: 200px; }
        .category { width: 100px; }
        .district { width: 80px; }
        .end-date { width: 100px; }
        .total-amount { width: 100px; }
        .winner { width: 120px; }
        
        .no-print {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #007baf;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            z-index: 1000;
        }
    </style>
</head>
<body>
    <div class="no-print" onclick="window.print()">列印</div>
    
    <div class="header">
        <h1>新北市再生家具資料表</h1>
        <p>匯出時間：${new Date().toLocaleString('zh-TW')}</p>
        <p>資料筆數：${printData.length} 筆</p>
    </div>
    
    <table>
        <thead>
            <tr>
                <th class="auto-id">自動編號</th>
                <th class="name">家具名稱</th>
                <th class="category">類別名稱</th>
                <th class="district">行政區</th>
                <th class="end-date">結束日期</th>
                <th class="total-amount">應付金額</th>
                <th class="winner">得標者</th>
            </tr>
        </thead>
        <tbody>
            ${printData.map(row => `
                <tr>
                    <td>${row.AutoID}</td>
                    <td>${row.Name}</td>
                    <td>${row.CategoryName}</td>
                    <td>${row.DistName}</td>
                    <td>${row.EndDate}</td>
                    <td>${row.TotalAmount}</td>
                    <td>${row.Winner}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>`;

    // 開啟新視窗並列印
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printHTML);
    printWindow.document.close();
    
    // 等待頁面載入完成後自動列印
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  }

  // 添加Enter鍵支援，確保使用者可以正常查詢
  function addEnterKeySupport() {
    // 查找所有可能的輸入框
    const inputs = document.querySelectorAll('input[type="text"], input[type="search"], .el-input__inner');

    inputs.forEach(input => {
      // 避免重複綁定
      if (input.dataset.enterKeyBound) return;
      input.dataset.enterKeyBound = 'true';

      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault(); // 阻止預設行為

          // 查找查詢按鈕
          const queryBtn = Array.from(document.querySelectorAll('button.el-button'))
            .find(b => /查\s*詢/.test(b.textContent));

          if (queryBtn) {
            // 確保這不是統計按鈕觸發的
            if (!FurnitureHelper.isStatsTriggered()) {
              try {
                if (queryBtn.__vue__ && queryBtn.__vue__.$emit) {
                  queryBtn.__vue__.$emit('click');
                } else {
                  const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                  });
                  queryBtn.dispatchEvent(clickEvent);
                }
                console.log('Enter鍵觸發查詢成功');
              } catch (error) {
                console.error('Enter鍵觸發查詢失敗:', error);
              }
            }
          }
        }
      });
    });
  }

  insertButtons();
  addEnterKeySupport();

  const buttonContainer = document.querySelector('.el-button-group') || document.body;
  new MutationObserver(() => {
    insertButtons();
    addEnterKeySupport(); // 頁面更新後重新綁定Enter鍵
  }).observe(buttonContainer, { childList: true, subtree: true });
  
  // 取得類別ID的輔助函數
  function getCategoryID(jsonData) {
    // 1. 優先使用現有的 CategoryID
    if (jsonData.CategoryID) {
      return jsonData.CategoryID;
    }
    
    // 2. 從 CategoryName 轉換
    if (jsonData.CategoryName && CATEGORY_MAPPING[jsonData.CategoryName]) {
      return CATEGORY_MAPPING[jsonData.CategoryName];
    }
    
    // 3. 預設值
    return 13;
  }
  
  // 從 CategoryID 取得類別名稱
  function getCategoryNameFromID(categoryID) {
    if (!categoryID) return '';
    
    for (const [name, id] of Object.entries(CATEGORY_MAPPING)) {
      if (id === categoryID) {
        return name;
      }
    }
    return '';
  }

  async function directSubmitToAPI(jsonData) {
    console.log('�� 開始直接 API 送出...');
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
        EndDate: jsonData.EndDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '), // ← 預設為兩周後
        DistID: jsonData.DistID || '231',
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
      }, 2000);
      return result;
    } catch (error) {
      console.error('API 送出失敗:', error);
      alert(` API 送出失敗: ${error.message}`);
      throw error;
    }
  }

  // 刪除單一項目 API
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

  // 批次刪除功能
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
      }, 2000);
    }
  }

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

  // 批次下載前的設定提醒對話框
  function showDownloadSettingsWarning(callback) {
    const existingWarning = document.getElementById('download-settings-warning');
    if (existingWarning) {
      existingWarning.remove();
    }

    const warningModal = document.createElement('div');
    warningModal.id = 'download-settings-warning';
    warningModal.style.cssText = applyComponentVariant('modal', 'default') + 'z-index: 10001; max-width: 600px;';

    warningModal.innerHTML = `
      <h3 style="margin: 0 0 15px 0; color: #d63384; font-size: 20px;">⚠️ 批次下載前必須設定</h3>

      <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin-bottom: 15px;">
        <p style="margin: 0 0 10px 0; font-weight: bold; font-size: 16px;">為了避免按到死，請先設定瀏覽器自動儲存：</p>
        <ol style="margin: 0; padding-left: 20px; font-size: 16px;">
          <li>打開 Chrome 設定 (chrome://settings/)</li>
          <li>搜尋「下載」或點選左側「進階」→「下載」</li>
          <li><strong>關閉</strong>「下載前詢問儲存位置」選項</li>
          <li>設定好預設下載資料夾</li>
        </ol>
      </div>

      <div style="background: #d1ecf1; border: 1px solid #b8daff; padding: 10px; border-radius: 4px; margin-bottom: 15px;">
        <p style="margin: 0; font-size: 16px;">
          <strong>說明：</strong>批次下載會產生多個檔案，如果沒有設定自動儲存，
          每個檔案都會跳出儲存對話框，非常麻煩。
        </p>
      </div>

      <div style="text-align: right; display: flex; gap: 10px; justify-content: flex-end;">
        <button id="cancel-download" style="${applyComponentVariant('button', 'default', 'secondary')}">
          取消下載
        </button>
        <button id="confirm-download" style="${applyComponentVariant('button', 'default', 'primary')}">
          我已設定完成，開始下載
        </button>
      </div>
    `;

    document.body.appendChild(warningModal);

    // 綁定按鈕事件
    document.getElementById('cancel-download').onclick = () => {
      warningModal.remove();
    };

    document.getElementById('confirm-download').onclick = () => {
      warningModal.remove();
      if (callback && typeof callback === 'function') {
        callback();
      }
    };

    // ESC 鍵關閉
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        warningModal.remove();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
  }

  // 多檔案順序下載功能
  async function downloadMultipleFiles(selectedItems) {
    if (!selectedItems || selectedItems.length === 0) {
      showNotification('沒有選擇任何項目', 'warning');
      return;
    }

    const timestamp = new Date().toISOString().slice(0,19).replace(/:/g,'-');
    const exportPrefix = `furniture_export_${timestamp}`;

    // 創建主索引檔案
    const manifest = {
      exportInfo: {
        exportDate: new Date().toISOString(),
        exportType: 'BatchExport',
        totalItems: selectedItems.length,
        exportPrefix: exportPrefix
      },
      itemList: selectedItems.map(item => ({
        autoID: item.AutoID,
        filename: `${exportPrefix}_item_${item.AutoID}.json`,
        name: item.Name || '未命名',
        hasPhotos: item.Photos && item.Photos.length > 0,
        createDate: item.CreateDate
      }))
    };

    // 檔案下載佇列
    const filesToDownload = [];

    // 加入主索引檔案
    filesToDownload.push({
      name: `${exportPrefix}_manifest.json`,
      content: JSON.stringify(manifest, null, 2),
      type: 'application/json'
    });

    // 使用 PACK 方式處理每個項目（包含 base64 圖片）
    for (const item of selectedItems) {
      try {
        const { Photos, ...restOfItem } = item;
        const photosWithBase64 = [];

        if (Photos && Array.isArray(Photos) && Photos.length > 0) {
          for (const photo of Photos) {
            const photoUrl = photo.Photo.startsWith('http') ? photo.Photo : location.origin + photo.Photo;
            try {
              const base64 = await convertImageToBase64(photoUrl);
              photosWithBase64.push({ ...photo, Photo: base64, PhotoUrl: photoUrl });
            } catch (error) {
              console.warn(`圖片轉換失敗 ${photoUrl}:`, error);
              photosWithBase64.push({ ...photo, PhotoUrl: photoUrl, Error: '圖片轉換失敗' });
            }
          }
        }

        const itemData = {
          ...restOfItem,
          Photos: photosWithBase64,
          ExportInfo: {
            ExportDate: new Date().toISOString(),
            ExportType: 'BatchExportItem',
            OriginalIndex: selectedItems.indexOf(item)
          }
        };

        filesToDownload.push({
          name: `${exportPrefix}_item_${item.AutoID}.json`,
          content: JSON.stringify(itemData, null, 2),
          type: 'application/json'
        });

      } catch (error) {
        console.error(`處理項目 ${item.AutoID} 時發生錯誤:`, error);
        ERROR_HANDLER.handle(error, 'file-processing');
      }
    }

    // 順序下載所有檔案（間隔 200ms 避免瀏覽器限制）
    showNotification(`開始下載 ${filesToDownload.length} 個檔案...`, 'info', 3000);

    for (let i = 0; i < filesToDownload.length; i++) {
      const file = filesToDownload[i];
      setTimeout(() => {
        try {
          const blob = new Blob([file.content], { type: file.type });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.name;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          if (i === filesToDownload.length - 1) {
            setTimeout(() => {
              showNotification('所有檔案下載完成！', 'success', 3000);
            }, 500);
          }
        } catch (error) {
          console.error(`下載檔案 ${file.name} 失敗:`, error);
          ERROR_HANDLER.handle(error, 'file-download');
        }
      }, i * 200);
    }
  }

  // 選擇性匯入功能
  function showImportModal() {
    const importModal = document.createElement('div');
    importModal.id = 'import-modal';
    importModal.style.cssText = applyComponentVariant('modal', 'wide') + 'z-index: 10002;';

    importModal.innerHTML = `
      <h3 style="margin: 0 0 20px 0; color: #28a745; font-size: 18px;">📁 批次匯入資料</h3>

      <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #d73502; font-size: 16px;">📁 請選擇整個匯出目錄的所有檔案</p>
        <input type="file" id="manifest-file-input" accept=".json" multiple
               style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;">
        <div style="margin: 10px 0 0 0; font-size: 14px; color: #155724;">
          <p style="margin: 0 0 5px 0; font-weight: bold;">操作方法：</p>
          <ol style="margin: 0; padding-left: 20px;">
            <li><strong>Ctrl+A</strong> 全選目錄中的所有 .json 檔案</li>
            <li>或按住 <strong>Ctrl 鍵</strong>，依序選擇所有檔案</li>
          </ol>
          <p style="margin: 5px 0 0 0; color: #856404; background: #fff3cd; padding: 5px; border-radius: 3px;">
            <strong>重點：</strong>manifest.json 和所有 item_*.json 檔案都在同一個目錄，一次選完即可
          </p>
        </div>
      </div>

      <div id="import-items-container" style="display: none;">
        <div style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; border-radius: 4px; margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h4 style="margin: 0; color: #495057; font-size: 16px;">選擇要匯入的項目：</h4>
            <div style="display: flex; gap: 10px;">
              <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                <input type="checkbox" id="select-all-import" checked style="transform: scale(1.1);">
                <span style="font-weight: bold;">全選</span>
              </label>
              <span id="import-selected-count" style="color: #6c757d; font-size: 14px;"></span>
            </div>
          </div>
          <div id="import-items-list" style="max-height: 300px; overflow-y: auto; border: 1px solid #dee2e6; border-radius: 4px; background: white;">
          </div>
        </div>

        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 4px; margin-bottom: 15px;">
          <p style="margin: 0; font-size: 14px;">
            <strong>注意：</strong>請確保所有相關的項目檔案都在同一個資料夾中，匯入時會自動尋找對應的檔案。
          </p>
        </div>

        <div style="text-align: right;">
          <button id="start-import" style="${applyComponentVariant('button', 'default', 'success')}" disabled>
            開始匯入到系統
          </button>
        </div>
      </div>

      <div style="text-align: right; margin-top: 20px;">
        <button id="cancel-import" style="${applyComponentVariant('button', 'default', 'secondary')}">
          取消
        </button>
      </div>
    `;

    document.body.appendChild(importModal);

    // 綁定事件
    setupImportModalEvents(importModal);
  }

  function setupImportModalEvents(modal) {
    const manifestInput = modal.querySelector('#manifest-file-input');
    const itemsContainer = modal.querySelector('#import-items-container');
    const itemsList = modal.querySelector('#import-items-list');
    const selectAllImport = modal.querySelector('#select-all-import');
    const selectedCountSpan = modal.querySelector('#import-selected-count');
    const startImportBtn = modal.querySelector('#start-import');
    const cancelBtn = modal.querySelector('#cancel-import');

    let manifestData = null;
    let itemFiles = {};

    // 處理多檔案選擇
    manifestInput.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      try {
        // 找出 manifest 檔案
        const manifestFile = files.find(file => file.name.includes('manifest.json'));
        if (!manifestFile) {
          throw new Error('請選擇包含 manifest.json 的檔案');
        }

        // 讀取 manifest
        const text = await manifestFile.text();
        manifestData = JSON.parse(text);

        if (!manifestData.itemList || !Array.isArray(manifestData.itemList)) {
          throw new Error('無效的 manifest 檔案格式');
        }

        // 建立檔案映射
        itemFiles = {};
        files.forEach(file => {
          console.log('載入檔案:', file.name);
          itemFiles[file.name] = file;
        });

        console.log('itemFiles 中的檔案:', Object.keys(itemFiles));

        displayImportItems(manifestData.itemList, itemsList, selectedCountSpan);
        itemsContainer.style.display = 'block';

        // 顯示項目列表後，允許用戶直接開始匯入
        startImportBtn.disabled = false;
        startImportBtn.textContent = '開始匯入到系統';

        showNotification(`已載入 ${files.length} 個檔案，包含 ${manifestData.itemList.length} 個項目`, 'success');

      } catch (error) {
        console.error('讀取檔案失敗:', error);
        showNotification('讀取檔案失敗: ' + error.message, 'error');
      }
    };

    // 移除不必要的項目檔案選擇邏輯

    // 全選功能
    selectAllImport.onchange = () => {
      const itemCheckboxes = itemsList.querySelectorAll('.import-item-checkbox');
      itemCheckboxes.forEach(cb => cb.checked = selectAllImport.checked);
      updateImportSelectedCount();
    };

    // 更新選中數量
    function updateImportSelectedCount() {
      const itemCheckboxes = itemsList.querySelectorAll('.import-item-checkbox');
      const checkedCount = Array.from(itemCheckboxes).filter(cb => cb.checked).length;
      selectedCountSpan.textContent = `(已選 ${checkedCount} 項)`;
    }

    // 開始匯入
    startImportBtn.onclick = async () => {
      const selectedItems = getSelectedImportItems();
      if (selectedItems.length === 0) {
        showNotification('請至少選擇一個項目', 'warning');
        return;
      }

      // 檢查是否有對應的項目檔案
      const missingFiles = selectedItems.filter(item => !itemFiles[item.filename]);
      if (missingFiles.length > 0) {
        const missingNames = missingFiles.map(item => item.filename);
        showNotification(`缺少檔案：${missingNames.join(', ')}，請確認已選擇所有相關檔案`, 'warning', 8000);
        return;
      }

      // 直接開始匯入
      modal.remove();
      await processImportedItems(selectedItems, itemFiles);
    };

    // 取消
    cancelBtn.onclick = () => modal.remove();

    // ESC 關閉
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);

    function getSelectedImportItems() {
      const selectedItems = [];
      const itemCheckboxes = itemsList.querySelectorAll('.import-item-checkbox:checked');
      itemCheckboxes.forEach(cb => {
        const itemData = JSON.parse(cb.dataset.itemData);
        selectedItems.push(itemData);
      });
      return selectedItems;
    }
  }

  // 刪除確認對話框
  function showDeleteConfirmationModal(selectedItems) {
    const deleteModal = document.createElement('div');
    deleteModal.id = 'delete-confirmation-modal';
    deleteModal.style.cssText = applyComponentVariant('modal', 'medium') + 'z-index: 10003;';

    deleteModal.innerHTML = `
      <h3 style="margin: 0 0 20px 0; color: #dc3545; font-size: 20px;">🗑️ 批次刪除確認</h3>

      <div style="background: #f8d7da; border: 1px solid #f5c2c7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
          <span style="font-size: 24px;">⚠️</span>
          <h4 style="margin: 0; color: #721c24; font-size: 18px;">危險操作警告</h4>
        </div>
        <p style="margin: 0 0 10px 0; color: #721c24; font-size: 16px; font-weight: bold;">
          您即將刪除 <span style="color: #dc3545; font-size: 20px;">${selectedItems.length}</span> 個項目
        </p>
        <p style="margin: 0; color: #721c24; font-size: 16px;">
          此操作<strong>無法撤銷</strong>，請確認您真的要執行此操作。
        </p>
      </div>

      <div style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; border-radius: 8px; margin-bottom: 20px; max-height: 300px; overflow-y: auto;">
        <h4 style="margin: 0 0 10px 0; color: #495057; font-size: 16px;">即將刪除的項目：</h4>
        <div id="delete-items-list">
          ${selectedItems.map((item, index) => `
            <div style="padding: 8px; border-bottom: 1px solid #dee2e6; display: flex; align-items: center; gap: 10px; background: ${index % 2 === 0 ? '#ffffff' : '#f8f9fa'};">
              <span style="color: #dc3545; font-weight: bold; font-size: 16px;">[${item.AutoID}]</span>
              <span style="flex: 1; font-size: 16px;">${item.Name || '未命名'}</span>
              <span style="font-size: 14px; color: #6c757d;">${item.CategoryName || ''}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 16px; color: #856404;">
          <strong>請再次確認：</strong>刪除後這些項目將從系統中永久移除，無法恢復。
        </p>
      </div>

      <div style="display: flex; justify-content: space-between; gap: 15px;">
        <button id="cancel-delete" style="${applyComponentVariant('button', 'default', 'secondary')}">
          取消
        </button>
        <button id="confirm-delete" style="${applyComponentVariant('button', 'default', 'danger')} font-weight: bold;">
          確認刪除 ${selectedItems.length} 個項目
        </button>
      </div>
    `;

    document.body.appendChild(deleteModal);

    // 綁定事件
    const confirmBtn = deleteModal.querySelector('#confirm-delete');
    const cancelBtn = deleteModal.querySelector('#cancel-delete');

    confirmBtn.onclick = async () => {
      deleteModal.remove();
      await processBatchDelete(selectedItems);
    };

    cancelBtn.onclick = () => deleteModal.remove();

    // ESC 關閉
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        deleteModal.remove();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
  }

  function displayImportItems(items, container, countSpan) {
    container.innerHTML = '';

    items.forEach((item, index) => {
      const itemDiv = document.createElement('div');
      itemDiv.style.cssText = `
        padding: 10px;
        border-bottom: 1px solid #dee2e6;
        display: flex;
        align-items: center;
        gap: 10px;
        background: ${index % 2 === 0 ? '#ffffff' : '#f8f9fa'};
      `;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'import-item-checkbox';
      checkbox.checked = true;
      checkbox.dataset.itemData = JSON.stringify(item);
      checkbox.style.cssText = 'transform: scale(1.1);';
      checkbox.onchange = () => {
        const allCheckboxes = container.querySelectorAll('.import-item-checkbox');
        const checkedCount = Array.from(allCheckboxes).filter(cb => cb.checked).length;
        countSpan.textContent = `(已選 ${checkedCount} 項)`;

        const selectAll = document.getElementById('select-all-import');
        if (checkedCount === 0) {
          selectAll.indeterminate = false;
          selectAll.checked = false;
        } else if (checkedCount === allCheckboxes.length) {
          selectAll.indeterminate = false;
          selectAll.checked = true;
        } else {
          selectAll.indeterminate = true;
        }
      };

      const itemInfo = document.createElement('div');
      itemInfo.style.cssText = 'flex-grow: 1;';
      itemInfo.innerHTML = `
        <div style="font-weight: bold; color: #495057; font-size: 16px;">${item.name}</div>
        <div style="font-size: 14px; color: #6c757d;">
          ID: ${item.autoID} | 檔案: ${item.filename} |
          ${item.hasPhotos ? '包含圖片' : '無圖片'} |
          ${item.createDate ? item.createDate.split('T')[0] : '無日期'}
        </div>
      `;

      itemDiv.appendChild(checkbox);
      itemDiv.appendChild(itemInfo);
      container.appendChild(itemDiv);
    });

    // 初始化計數
    const checkedCount = items.length;
    countSpan.textContent = `(已選 ${checkedCount} 項)`;
  }

  async function processImportedItems(selectedItems, itemFiles) {
    showNotification(`開始批次匯入 ${selectedItems.length} 個項目到系統...`, 'info');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < selectedItems.length; i++) {
      const item = selectedItems[i];
      try {
        showNotification(`正在匯入項目 ${i + 1}/${selectedItems.length}: ${item.name}`, 'info', 2000);

        console.log('查找檔案:', item.filename);
        console.log('可用檔案:', Object.keys(itemFiles));

        const file = itemFiles[item.filename];
        if (!file) {
          console.warn(`檔案不存在: ${item.filename}`);
          console.warn(`可用的檔案名稱:`, Object.keys(itemFiles));
          errorCount++;
          continue;
        }

        const text = await file.text();
        const itemData = JSON.parse(text);

        // 驗證資料完整性
        if (itemData.AutoID !== item.autoID) {
          console.warn(`檔案內容不匹配: ${item.filename}`);
          errorCount++;
          continue;
        }

        // 調用現有的 API 上傳功能
        await directSubmitToAPI(itemData);
        successCount++;

        console.log(`✅ 項目 ${item.name} (${item.autoID}) 匯入成功`);

        // 項目間隔 1 秒，避免 API 請求過於頻繁
        if (i < selectedItems.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`處理項目 ${item.filename} 時發生錯誤:`, error);
        errorCount++;
        showNotification(`項目 ${item.name} 匯入失敗: ${error.message}`, 'error', 3000);
      }
    }

    // 顯示最終結果
    const message = `批次匯入完成！成功: ${successCount} 項，失敗: ${errorCount} 項`;
    if (errorCount === 0) {
      showNotification(message, 'success', 5000);
    } else if (successCount === 0) {
      showNotification(message, 'error', 5000);
    } else {
      showNotification(message, 'warning', 5000);
    }

    // 刷新頁面資料
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
            console.log('批次匯入完成，已刷新資料');
          } catch (error) {
            console.error('刷新資料時發生錯誤:', error);
          }
        }
      }, 2000);
    }
  }

})();