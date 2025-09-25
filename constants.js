// ===================================================================
// 常數與配置定義 - 統一管理所有應用常數
// ===================================================================

// 預設 Webhook URL
const DEFAULT_WEBHOOK_URL = 'https://580.blias.com/daobo/files.php?format=json';

// UI 元件樣式系統
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

// 通知類型到樣式的映射表
const NOTIFICATION_TYPE_MAP = {
  success: UI_COMPONENTS.notification.success,
  error: UI_COMPONENTS.notification.error,
  warning: UI_COMPONENTS.notification.warning,
  info: UI_COMPONENTS.notification.info
};

// 商品狀態系統 - 消除 IsPay/IsGet 的 if/else 地獄
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

  getStatus(isPaid, isDelivered) {
    const key = `${isPaid ? 'paid' : 'unpaid'}-${isDelivered ? 'delivered' : 'pending'}`;
    return this.combinations[key] || this.combinations['unpaid-pending'];
  },

  generateStatusHTML(isPaid, isDelivered) {
    const status = this.getStatus(isPaid, isDelivered);
    return `<span style="color:${status.color};font-weight:600;text-align:center;">${status.text}</span>`;
  },

  applyStatusStyle(element, isPaid, isDelivered) {
    const status = this.getStatus(isPaid, isDelivered);
    element.style.borderLeftColor = status.borderColor;
    if (status.background && status.background !== '#f8f9fa') {
      element.style.background = status.background;
    }
  }
};

// 元件變體配置系統
const COMPONENT_VARIANTS = {
  // 模態框變體配置
  modal: {
    default: {},
    stats: {
      width: '1000px',
      maxWidth: '95vw'
    },
    wide: {
      width: '1200px',
      maxWidth: '95vw',
      maxHeight: '85vh'
    },
    photo: {
      top: '10%',
      border: '2px solid #007baf',
      zIndex: '10000',
      minWidth: '600px',
      maxWidth: '90vw'
    },
    form: {
      width: '600px',
      padding: '30px'
    }
  },

  // 面板變體配置
  panel: {
    default: {},
    wide: {
      width: '400px'
    },
    narrow: {
      width: '280px'
    },
    custom: {
      width: '380px'
    }
  },

  // 按鈕變體配置
  button: {
    default: {},
    small: {
      padding: '5px 10px',
      fontSize: '11px'
    },
    large: {
      padding: '12px 24px',
      fontSize: '14px'
    },
    fullWidth: {
      width: '100%'
    },
    compact: {
      padding: '4px 8px',
      fontSize: '10px'
    }
  }
};

// 錯誤處理系統
const ERROR_HANDLER = {
  // 錯誤上下文映射
  contextMessages: {
    'file-upload': '檔案上傳時發生錯誤',
    'file-download': '檔案下載時發生錯誤',
    'file-processing': '檔案處理時發生錯誤',
    'json-parsing': 'JSON 資料解析時發生錯誤',
    'api-call': 'API 請求時發生錯誤',
    'network-request': '網路請求時發生錯誤',
    'remote-import': '遠端匯入時發生錯誤',
    'ui-operation': '介面操作時發生錯誤',
    'dom-manipulation': 'DOM 操作時發生錯誤',
    'event-handling': '事件處理時發生錯誤',
    'data-conversion': '資料轉換時發生錯誤',
    'local-storage': '本地儲存操作時發生錯誤',
    'validation': '資料驗證時發生錯誤',
    'unknown': '操作時發生錯誤'
  },

  handle(error, context = 'unknown', options = {}) {
    const {
      userFriendly = true,
      showNotification = true,
      logToConsole = true,
      fallbackMessage = null
    } = options;

    if (logToConsole) {
      console.error(`[${context.toUpperCase()}]`, error);
    }

    if (showNotification && userFriendly && typeof window.showNotification === 'function') {
      const userMessage = this.getUserFriendlyMessage(error, context, fallbackMessage);
      window.showNotification(userMessage, 'error', APP_CONSTANTS.TIMING.NOTIFICATION_ERROR_DURATION);
    }

    return {
      context,
      originalError: error,
      message: error.message,
      userMessage: this.getUserFriendlyMessage(error, context, fallbackMessage),
      timestamp: new Date().toISOString()
    };
  },

  getUserFriendlyMessage(error, context, fallbackMessage) {
    if (fallbackMessage) return fallbackMessage;

    const contextMessage = this.contextMessages[context] || this.contextMessages['unknown'];

    if (error.name === 'SyntaxError') {
      return `${contextMessage}：資料格式不正確`;
    }
    if (error.name === 'NetworkError' || error.message.includes('Failed to fetch')) {
      return `${contextMessage}：網路連線問題，請檢查網路狀態`;
    }
    if (error.name === 'TypeError') {
      return `${contextMessage}：資料類型錯誤`;
    }

    return `${contextMessage}：${error.message}`;
  },

  async withErrorHandling(fn, context, options = {}) {
    try {
      return await fn();
    } catch (error) {
      const errorInfo = this.handle(error, context, options);
      if (options.rethrow !== false) {
        throw errorInfo;
      }
      return null;
    }
  },

  createHandler(context, defaultOptions = {}) {
    return (error, options = {}) => {
      return this.handle(error, context, { ...defaultOptions, ...options });
    };
  }
};

// 應用常數定義
const APP_CONSTANTS = {
  // 時間相關常數（毫秒）
  TIMING: {
    NOTIFICATION_DEFAULT_DURATION: 3000,
    NOTIFICATION_ERROR_DURATION: 4000,
    HIGHLIGHT_RESET_DELAY: 2000,
    API_RETRY_DELAY: 200,
    PROGRESS_CLEANUP_DELAY: 2000
  },

  // 檔案大小相關常數（bytes）
  FILE_SIZE: {
    MB: 1024 * 1024,
    IMAGE_WARNING_THRESHOLD: 2 * 1024 * 1024,
    KB: 1024
  },

  // UI 尺寸相關常數
  UI_DIMENSIONS: {
    MODAL_MIN_WIDTH: 600,
    PANEL_DEFAULT_WIDTH: 320,
    PANEL_WIDE_WIDTH: 400,
    PANEL_CUSTOM_WIDTH: 380,
    MODAL_STATS_WIDTH: 1000
  },

  // Z-index 層級管理
  Z_INDEX: {
    PANEL: 99999,
    MODAL: 9999,
    MODAL_HIGH: 10000,
    NOTIFICATION: 10000,
    PROGRESS: 10000
  },

  // API 相關常數
  API: {
    DEFAULT_DISTRICT_ID: '231',
    CATEGORY_DEFAULT_ID: 13,
    AUCTION_DURATION_DAYS: 14,
    IMAGE_QUALITY: 0.8
  },

  // 顏色常數（語義化）
  COLORS: {
    PRIMARY: '#007baf',
    SUCCESS: '#28a745',
    WARNING: '#ffc107',
    DANGER: '#dc3545',
    INFO: '#667eea',
    SECONDARY: '#6c757d',
    TEXT_MUTED: '#666'
  },

  // UI組件相關常數
  UI_COMPONENTS: {
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
    DEFAULT_AUCTION_DURATION_DAYS: 14
  }
};

// 類別映射表
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

  const BID_STATUS_SYSTEM = {
    // 競標狀態定義：每種狀態的樣式和行為
    states: {
      loading: {
        // 正在查詢競標資料
        text: '查詢中...',
        color: '#6c757d',
        background: '#f8f9fa',
        displayMode: 'simple'
      },
      noBids: {
        // 確認無競標
        text: '無競標',
        color: '#856404',
        background: '#fff3cd',
        displayMode: 'simple'
      },
      hasBids: {
        // 有競標資料
        text: '',  // 動態生成
        color: '#0056b3',
        background: '#ffebee',
        displayMode: 'detailed'
      }
    },

  determineState(item) {
    if (!item.HasBids) return 'noBids';
    if (item.BidPrice && item.Bidder) return 'hasBids';
    return 'loading';
  },

  formatBidderName(item) {
    const { NickName, Bidder } = item;
    const nameFormats = {
      withNick: `${Bidder} (${NickName})`,
      bidderOnly: Bidder,
      nickOnly: NickName,
      unknown: '未知用戶'
    };

    if (Bidder && NickName && Bidder !== NickName) return nameFormats.withNick;
    if (Bidder) return nameFormats.bidderOnly;
    if (NickName) return nameFormats.nickOnly;
    return nameFormats.unknown;
  },

  generateBidDisplay(item, displayMode = 'inline') {
    const state = this.determineState(item);
    const config = this.states[state];

    if (config.displayMode === 'simple' || state !== 'hasBids') {
      const style = `color:${config.color};`;
      return `<span style="${style}">${config.text}</span>`;
    }

    const bidderName = this.formatBidderName(item);
    const nameStyle = `color:#666;font-size:12px;`;
    const priceStyle = `color:${config.color};font-weight:600;`;

    // 競標者放到金額前面，縮成一排，整段加上淡紅色背景
    const containerStyle = `background:${config.background};padding:2px 6px;border-radius:3px;`;
    return `<span style="${containerStyle}"><span style="${nameStyle}">${bidderName}</span> <span style="${priceStyle}">$${item.BidPrice}</span></span>`;
  },

  applyContainerStyle(element, item) {
    // 移除整行背景色設置，改為只對競標文字設置背景色
  }
};

// 家具助手應用狀態管理
const FurnitureHelper = {
  state: {
    isStatsButtonTriggered: false,
    version: '4.0.0'
  },

  setState(key, value) {
    if (this.state.hasOwnProperty(key)) {
      this.state[key] = value;
      console.debug(`[FurnitureHelper] State updated: ${key} = ${value}`);
    }
  },

  getState(key) {
    return this.state[key];
  },

  setStatsTriggered(value) {
    this.setState('isStatsButtonTriggered', value);
  },

  isStatsTriggered() {
    return this.getState('isStatsButtonTriggered');
  }
};

// 暴露到全域
window.DEFAULT_WEBHOOK_URL = DEFAULT_WEBHOOK_URL;
window.UI_COMPONENTS = UI_COMPONENTS;
window.NOTIFICATION_TYPE_MAP = NOTIFICATION_TYPE_MAP;
window.ITEM_STATUS_SYSTEM = ITEM_STATUS_SYSTEM;
window.COMPONENT_VARIANTS = COMPONENT_VARIANTS;
window.ERROR_HANDLER = ERROR_HANDLER;
window.APP_CONSTANTS = APP_CONSTANTS;
window.CATEGORY_MAPPING = CATEGORY_MAPPING;
window.BID_STATUS_SYSTEM = BID_STATUS_SYSTEM;
window.FurnitureHelper = FurnitureHelper;