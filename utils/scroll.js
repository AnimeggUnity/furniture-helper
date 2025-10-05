
((app) => {
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

  app.safeScrollIntoView = safeScrollIntoView;
})(window.FurnitureHelper = window.FurnitureHelper || {});
