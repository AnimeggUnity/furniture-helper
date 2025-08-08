// 🎯 競標紀錄分析工具
// 使用方法：在瀏覽器Console中執行這個腳本

console.log('🎯 競標紀錄分析工具已載入');

// 競標紀錄分析器
class BidLogAnalyzer {
  constructor() {
    this.apiEndpoint = 'api/Product/GetBidLog';
    this.results = [];
  }

  // 取得單一商品的競標紀錄
  async getBidLog(productId) {
    try {
      console.log(`🔍 正在取得商品 ${productId} 的競標紀錄...`);
      
      const response = await fetch(`${this.apiEndpoint}?id=${productId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ 商品 ${productId} 競標紀錄:`, data);
      
      return data;
    } catch (error) {
      console.error(`❌ 取得商品 ${productId} 競標紀錄失敗:`, error);
      return null;
    }
  }

  // 分析競標紀錄，找出特定價格
  analyzeBidLog(bidLog, targetPrice = 18) {
    if (!bidLog || !Array.isArray(bidLog)) {
      console.log('❌ 競標紀錄格式錯誤');
      return [];
    }

    const results = bidLog.filter(bid => bid.price === targetPrice);
    
    if (results.length > 0) {
      console.log(`💰 找到 ${results.length} 筆價格 ${targetPrice} 元的出價:`);
      results.forEach((bid, index) => {
        console.log(`  ${index + 1}. 出價人: ${bid.bidder || bid.userName || '未知'}`);
        console.log(`     價格: ${bid.price} 元`);
        console.log(`     時間: ${bid.bidTime || bid.createTime || '未知'}`);
        console.log(`     狀態: ${bid.status || '未知'}`);
      });
    } else {
      console.log(`❌ 沒有找到價格 ${targetPrice} 元的出價`);
    }

    return results;
  }

  // 批次分析多個商品
  async analyzeMultipleProducts(productIds, targetPrice = 18) {
    console.log(`🚀 開始批次分析 ${productIds.length} 個商品的競標紀錄...`);
    
    const results = [];
    
    for (const productId of productIds) {
      try {
        const bidLog = await this.getBidLog(productId);
        if (bidLog) {
          const targetBids = this.analyzeBidLog(bidLog, targetPrice);
          if (targetBids.length > 0) {
            results.push({
              productId,
              bids: targetBids
            });
          }
        }
        
        // 避免請求過於頻繁
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ 分析商品 ${productId} 失敗:`, error);
      }
    }
    
    console.log(`✅ 批次分析完成，找到 ${results.length} 個商品有價格 ${targetPrice} 元的出價`);
    return results;
  }

  // 從表格資料中取得商品ID列表
  getProductIdsFromTable() {
    const tableData = window.__tableFullData;
    if (!tableData || !Array.isArray(tableData)) {
      console.log('❌ 沒有找到表格資料');
      return [];
    }

    const productIds = tableData.map(item => item.AutoID || item.ID).filter(id => id);
    console.log(`📋 從表格中找到 ${productIds.length} 個商品ID`);
    return productIds;
  }

  // 匯出分析結果
  exportResults(results) {
    if (!results || results.length === 0) {
      console.log('❌ 沒有結果可以匯出');
      return;
    }

    const csv = [
      ['商品ID', '出價人', '價格', '出價時間', '狀態'].join(','),
      ...results.flatMap(item => 
        item.bids.map(bid => 
          [
            item.productId,
            bid.bidder || bid.userName || '未知',
            bid.price,
            bid.bidTime || bid.createTime || '未知',
            bid.status || '未知'
          ].join(',')
        )
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bid-analysis-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('✅ 分析結果已匯出為CSV檔案');
  }

  // 快速分析當前頁面的所有商品
  async quickAnalyze(targetPrice = 18) {
    console.log('🚀 開始快速分析當前頁面所有商品...');
    
    const productIds = this.getProductIdsFromTable();
    if (productIds.length === 0) {
      console.log('❌ 沒有找到商品ID');
      return;
    }

    const results = await this.analyzeMultipleProducts(productIds, targetPrice);
    
    if (results.length > 0) {
      console.log('\n📊 分析結果摘要:');
      results.forEach(item => {
        console.log(`商品 ${item.productId}: ${item.bids.length} 筆 ${targetPrice} 元出價`);
      });
      
      // 詢問是否匯出結果
      if (confirm(`找到 ${results.length} 個商品有 ${targetPrice} 元出價，是否匯出結果？`)) {
        this.exportResults(results);
      }
    } else {
      console.log(`❌ 沒有找到任何商品有 ${targetPrice} 元的出價`);
    }
    
    return results;
  }
}

// 建立全域實例
window.bidAnalyzer = new BidLogAnalyzer();

// 便捷函數
window.getBidLog = (productId) => window.bidAnalyzer.getBidLog(productId);
window.analyzeBids = (targetPrice = 18) => window.bidAnalyzer.quickAnalyze(targetPrice);
window.exportBidResults = (results) => window.bidAnalyzer.exportResults(results);

console.log('📋 可用的函數:');
console.log('  - getBidLog(productId) - 取得單一商品的競標紀錄');
console.log('  - analyzeBids(targetPrice) - 快速分析所有商品 (預設18元)');
console.log('  - exportBidResults(results) - 匯出分析結果');
console.log('\n💡 建議執行: analyzeBids(18) 來分析所有18元出價'); 