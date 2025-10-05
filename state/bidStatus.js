
((app) => {
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
      bidding: {
        // 競標中（有出價且未結束）
        text: '',  // 動態生成
        color: '#0056b3',
        background: '#f8f9ff',
        icon: '💰',
        displayMode: 'detailed',
        prefix: '競標中'
      },
      ended: {
        // 競標已結束（有出價且已結束）
        text: '',  // 動態生成
        color: '#155724',
        background: '#d4edda',
        icon: '🏆',
        displayMode: 'detailed',
        prefix: '已結束'
      }
    },

    /**
     * 根據商品資料判斷競標狀態
     * @param {Object} item - 商品物件
     * @returns {string} 狀態鍵 (loading|noBids|bidding|ended)
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

      // 有競標且有價格
      if (item.HasBids === true && item.BidPrice) {
        // 檢查是否已結束：EndDate < 現在時間
        if (item.EndDate) {
          const endDate = new Date(item.EndDate);
          const now = new Date();
          if (endDate < now) {
            return 'ended';  // 競標已結束
          }
        }
        return 'bidding';  // 競標進行中
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
        'none': () => '匿名出價者'                    // 都沒有
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

      // 詳細狀態：bidding, ended
      const bidderName = this.formatBidderName(item);
      const priceStyle = `color:${config.color};font-weight:600;`;
      const nameStyle = `color:#666;`;
      const statusPrefix = config.prefix || '';

      if (displayType === 'inline') {
        return `<span style="${priceStyle}">${item.BidPrice}元</span><span style="${nameStyle}"> / ${bidderName}</span>`;
      } else {
        const bgColor = state === 'ended' ? '#d4edda' : '#ffebee';
        return `<br><span style="background-color:${bgColor};padding:2px 4px;border-radius:3px;">${statusPrefix} - 最高競標價: ${item.BidPrice} 元<br>最高出價者: ${bidderName}</span>`;
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

  app.BID_STATUS_SYSTEM = BID_STATUS_SYSTEM;
})(window.FurnitureHelper = window.FurnitureHelper || {});
