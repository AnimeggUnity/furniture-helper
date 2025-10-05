
((app) => {
  /**
   * 基礎元件樣式定義
   */
  const UI_COMPONENTS = {
    modal: {
      base: 'position:fixed;top:20%;left:50%;transform:translateX(-50%);background:#fff;border:0.5px solid #ddd;padding:24px;z-index:9999;width:auto;max-width:90%;max-height:80%;overflow:auto;box-shadow:0 2px 8px rgba(0,0,0,0.15);border-radius:6px;',
      wide: 'width:1000px;max-width:95vw;',
      photo: 'top:10%;border:2px solid #007baf;z-index:10000;min-width:600px;max-width:90vw;'
    },
    button: {
      base: 'border:none;padding:8px 16px;cursor:pointer;border-radius:4px;font-size:12px;',
      primary: 'background:#007baf;color:white;',
      success: 'background:#28a745;color:white;',
      danger: 'background:#dc3545;color:white;',
      secondary: 'background:#6c757d;color:white;',
      warning: 'background:#ffc107;color:#212529;',
      purple: 'background:#6f42c1;color:white;',
      small: 'padding:5px 10px;font-size:11px;'
    },
    panel: {
      base: 'position:fixed;top:80px;right:0;width:320px;height:calc(100% - 100px);overflow-y:auto;background:white;border-left:2px solid #007baf;box-shadow:-2px 0 5px rgba(0,0,0,0.2);font-family:"Segoe UI","Noto Sans TC",sans-serif;z-index:99999;',
      wide: 'width:400px;',
      header: 'margin:0;background:#007baf;color:white;padding:12px;font-size:16px;display:flex;justify-content:space-between;'
    },
    input: {
      search: 'width:calc(100% - 20px);padding:8px;margin:10px;border:1px solid #ccc;border-radius:4px;',
      url: 'width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;'
    },
    notification: {
      base: 'position:fixed;top:20px;right:20px;padding:12px 20px;border-radius:6px;z-index:10000;box-shadow:0 4px 12px rgba(0,0,0,0.15);font-size:14px;',
      success: 'background:#28a745;color:white;',
      error: 'background:#E53E3E;color:white;',
      warning: 'background:#FF6B35;color:white;',
      info: 'background:#667eea;color:white;'
    },
    processing: {
      base: 'position:fixed;top:30px;right:30px;background:#fff;padding:16px 32px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.13);z-index:9999;font-size:18px;'
    },
    closeButton: {
      base: 'position:absolute;top:12px;right:16px;cursor:pointer;font-size:24px;',
      white: 'background:none;border:none;color:white;font-size:16px;cursor:pointer;'
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
      photo: { top: '10%', border: '2px solid #007baf', zIndex: '10000', minWidth: '600px', maxWidth: '90vw' },
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

  app.UI_COMPONENTS = UI_COMPONENTS;
  app.COMPONENT_VARIANTS = COMPONENT_VARIANTS;
  app.combineStyles = combineStyles;
  app.applyComponentVariant = applyComponentVariant;
})(window.FurnitureHelper = window.FurnitureHelper || {});
