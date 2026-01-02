
((app) => {
  /**
   * 基礎元件樣式定義 - 現代扁平風
   */
  const UI_COMPONENTS = {
    modal: {
      base: 'position:fixed;top:20%;left:50%;transform:translateX(-50%);background:#fff;border:none;padding:28px;z-index:9999;width:auto;max-width:90%;max-height:80%;overflow:auto;box-shadow:0 8px 32px rgba(0,0,0,0.12);border-radius:12px;',
      wide: 'width:1000px;max-width:95vw;',
      photo: 'top:10%;border:2px solid #4A90E2;z-index:10000;min-width:600px;max-width:90vw;'
    },
    button: {
      base: 'border:none;padding:10px 18px;cursor:pointer;border-radius:8px;font-size:13px;font-weight:500;transition:all 0.2s ease;',
      primary: 'background:#4A90E2;color:white;',
      success: 'background:#5CB85C;color:white;',
      danger: 'background:#E57373;color:white;',
      secondary: 'background:#9E9E9E;color:white;',
      warning: 'background:#FFB74D;color:#212529;',
      purple: 'background:#9575CD;color:white;',
      info: 'background:#64B5F6;color:white;',
      small: 'padding:6px 12px;font-size:12px;'
    },
    panel: {
      base: 'position:fixed;top:80px;right:0;width:450px;height:calc(100% - 100px);overflow-y:auto;background:white;border-left:3px solid #4A90E2;box-shadow:-4px 0 20px rgba(0,0,0,0.08);font-family:"Segoe UI","Noto Sans TC",sans-serif;z-index:99999;',
      wide: 'width:400px;',
      header: 'margin:0;background:#4A90E2;color:white;padding:14px 16px;font-size:16px;font-weight:600;display:flex;justify-content:space-between;'
    },
    input: {
      search: 'width:calc(100% - 20px);padding:10px 12px;margin:10px;border:1px solid #E0E0E0;border-radius:8px;font-size:13px;transition:border-color 0.2s ease;',
      url: 'width:100%;padding:10px 12px;border:1px solid #E0E0E0;border-radius:8px;font-size:13px;transition:border-color 0.2s ease;'
    },
    notification: {
      base: 'position:fixed;top:20px;right:20px;padding:14px 22px;border-radius:10px;z-index:10000;box-shadow:0 6px 20px rgba(0,0,0,0.12);font-size:14px;font-weight:500;',
      success: 'background:#5CB85C;color:white;',
      error: 'background:#E57373;color:white;',
      warning: 'background:#FFB74D;color:#212529;',
      info: 'background:#64B5F6;color:white;'
    },
    processing: {
      base: 'position:fixed;top:30px;right:30px;background:#fff;padding:18px 36px;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,0.1);z-index:9999;font-size:18px;font-weight:500;'
    },
    closeButton: {
      base: 'position:absolute;top:12px;right:16px;cursor:pointer;font-size:24px;transition:opacity 0.2s ease;',
      white: 'background:none;border:none;color:white;font-size:16px;cursor:pointer;transition:opacity 0.2s ease;'
    }
  };

  /**
   * 元件變體配置系統
   */
  const COMPONENT_VARIANTS = {
    modal: {
      default: {},
      stats: { width: '1000px', maxWidth: '95vw' },
      wide: { width: '1200px', maxWidth: '95vw', maxHeight: '85vh' },
      photo: { top: '10%', border: '2px solid #4A90E2', zIndex: '10000', minWidth: '600px', maxWidth: '90vw' },
      form: { width: '600px', padding: '30px' }
    },
    panel: {
      default: {},
      wide: { width: '400px' },
      narrow: { width: '280px' },
      custom: { width: '380px' }
    },
    button: {
      default: {},
      small: { padding: '5px 10px', fontSize: '11px' },
      large: { padding: '12px 24px', fontSize: '14px' },
      fullWidth: { width: '100%' },
      compact: { padding: '4px 8px', fontSize: '10px' }
    }
  };

  function combineStyles(...styles) {
    return styles.filter(Boolean).join('');
  }

  function applyComponentVariant(componentType, variant = 'default', theme = null) {
    const baseStyle = UI_COMPONENTS[componentType]?.base || '';
    const variantConfig = COMPONENT_VARIANTS[componentType]?.[variant] || {};
    const themeStyle = theme ? (UI_COMPONENTS[componentType]?.[theme] || '') : '';

    const variantStyle = Object.entries(variantConfig)
      .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssKey}:${value};`;
      })
      .join('');

    return combineStyles(baseStyle, variantStyle, themeStyle);
  }

  /**
   * 注入現代扁平風的互動樣式
   */
  function injectModernStyles() {
    // 避免重複注入
    if (document.getElementById('furniture-helper-modern-styles')) return;

    const style = document.createElement('style');
    style.id = 'furniture-helper-modern-styles';
    style.textContent = `
      /* 按鈕 Hover 效果 - 優化版：保留原始樣式，只加增強效果 */
      button[style*="border:none"]:hover {
        transform: translateY(-1px) !important;
        box-shadow: 0 6px 20px rgba(0,0,0,0.15) !important;
        opacity: 0.95;
      }

      .el-button:hover {
        transform: translateY(-1px) !important;
        filter: brightness(1.05);
      }

      button[style*="border:none"]:active,
      .el-button:active {
        transform: translateY(0) !important;
      }

      /* Input Focus 效果 */
      input[type="text"]:focus,
      input[type="search"]:focus,
      input[type="number"]:focus,
      .el-input__inner:focus {
        border-color: #4A90E2 !important;
        box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1) !important;
        outline: none;
      }

      /* 關閉按鈕 Hover */
      button[id*="close"]:hover,
      .close-btn:hover {
        opacity: 0.7;
      }

      /* Checkbox 美化 */
      input[type="checkbox"] {
        cursor: pointer;
        accent-color: #4A90E2;
      }

      /* 滾動條美化 - 只針對 Panel 和 Modal */
      #furniture-panel::-webkit-scrollbar,
      [id$="-modal"]::-webkit-scrollbar {
        width: 8px;
      }

      #furniture-panel::-webkit-scrollbar-track,
      [id$="-modal"]::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
      }

      #furniture-panel::-webkit-scrollbar-thumb,
      [id$="-modal"]::-webkit-scrollbar-thumb {
        background: #4A90E2;
        border-radius: 4px;
      }

      #furniture-panel::-webkit-scrollbar-thumb:hover,
      [id$="-modal"]::-webkit-scrollbar-thumb:hover {
        background: #357ABD;
      }

      /* 圖片預覽圖標 Hover */
      .photo-preview-icon:hover {
        color: #4A90E2 !important;
        text-decoration: underline;
      }

      /* 平滑動畫 - 優化版：只針對互動元素，避免效能問題 */
      button, input, select, textarea, a,
      .el-button, .el-input, .el-select,
      [role="button"], [role="link"] {
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      }
    `;
    document.head.appendChild(style);
  }

  // 初始化時自動注入樣式
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectModernStyles);
  } else {
    injectModernStyles();
  }

  app.UI_COMPONENTS = UI_COMPONENTS;
  app.COMPONENT_VARIANTS = COMPONENT_VARIANTS;
  app.combineStyles = combineStyles;
  app.applyComponentVariant = applyComponentVariant;
  app.injectModernStyles = injectModernStyles;
})(window.FurnitureHelper = window.FurnitureHelper || {});
