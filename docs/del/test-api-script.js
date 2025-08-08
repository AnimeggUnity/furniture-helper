// 🔍 API端點分析測試腳本
// 使用方法：在瀏覽器Console中執行這個腳本

console.log('🔍 開始API端點分析測試...');

// 測試函數
function testAPIEndpointAnalysis() {
  console.log('📋 步驟1: 檢查擴充功能是否載入');
  
  // 檢查擴充功能是否載入
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    console.log('✅ Chrome擴充功能API可用');
  } else {
    console.log('❌ Chrome擴充功能API不可用');
  }
  
  // 檢查postMessage是否可用
  if (typeof window.postMessage === 'function') {
    console.log('✅ postMessage可用');
  } else {
    console.log('❌ postMessage不可用');
  }
  
  console.log('\n📋 步驟2: 檢查Vue實例');
  
  // 尋找Vue實例
  const vueInstances = [];
  const walkVueInstances = (element) => {
    if (element.__vue__) {
      vueInstances.push(element.__vue__);
    }
    Array.from(element.children).forEach(child => walkVueInstances(child));
  };
  walkVueInstances(document.body);
  
  console.log(`找到 ${vueInstances.length} 個Vue實例`);
  
  if (vueInstances.length > 0) {
    console.log('✅ Vue實例存在，可以進行分析');
  } else {
    console.log('❌ 沒有找到Vue實例');
  }
  
  console.log('\n📋 步驟3: 檢查競標紀錄按鈕');
  
  // 尋找競標紀錄按鈕
  const bidButtons = document.querySelectorAll('button i.el-icon-search');
  console.log(`找到 ${bidButtons.length} 個競標紀錄按鈕`);
  
  if (bidButtons.length > 0) {
    console.log('✅ 競標紀錄按鈕存在');
    bidButtons.forEach((icon, index) => {
      const button = icon.closest('button');
      console.log(`  按鈕 ${index + 1}: ${button.textContent.trim()}`);
    });
  } else {
    console.log('❌ 沒有找到競標紀錄按鈕');
  }
  
  console.log('\n📋 步驟4: 設定網路請求攔截器');
  
  // 設定網路請求攔截器
  let requestCount = 0;
  const originalFetch = window.fetch;
  
  window.fetch = function(...args) {
    requestCount++;
    const url = args[0];
    const options = args[1] || {};
    
    console.log(`🌐 Fetch請求 ${requestCount}: ${options.method || 'GET'} ${url}`);
    
    if (typeof url === 'string' && 
        (url.includes('bid') || url.includes('history') || url.includes('api'))) {
      console.log(`🎯 發現競標相關API請求: ${url}`);
    }
    
    return originalFetch.apply(this, args);
  };
  
  console.log('✅ 網路請求攔截器已設定');
  
  console.log('\n📋 步驟5: 觸發API端點分析');
  
  // 觸發API端點分析
  try {
    window.postMessage({ source: 'run-vue-api-endpoint-analysis' }, '*');
    console.log('✅ API端點分析已觸發');
  } catch (error) {
    console.error('❌ 觸發API端點分析失敗:', error);
  }
  
  console.log('\n📋 測試完成！');
  console.log('💡 請查看上方的分析結果');
}

// 快速測試函數
function quickTest() {
  console.log('🚀 快速測試開始...');
  
  // 檢查基本環境
  const checks = [
    { name: 'Vue實例', check: () => document.querySelector('[data-v-]') !== null },
    { name: '競標按鈕', check: () => document.querySelectorAll('button i.el-icon-search').length > 0 },
    { name: 'postMessage', check: () => typeof window.postMessage === 'function' },
    { name: 'fetch', check: () => typeof window.fetch === 'function' }
  ];
  
  checks.forEach(({ name, check }) => {
    try {
      const result = check();
      console.log(`${result ? '✅' : '❌'} ${name}: ${result ? '通過' : '失敗'}`);
    } catch (error) {
      console.log(`❌ ${name}: 錯誤 - ${error.message}`);
    }
  });
  
  // 如果基本檢查通過，觸發分析
  if (checks.every(c => c.check())) {
    console.log('\n🎯 基本檢查通過，觸發API端點分析...');
    setTimeout(() => {
      window.postMessage({ source: 'run-vue-api-endpoint-analysis' }, '*');
    }, 1000);
  } else {
    console.log('\n⚠️ 基本檢查失敗，請確認頁面環境');
  }
}

// 模擬API呼叫測試
function simulateAPICall() {
  console.log('🧪 模擬API呼叫測試...');
  
  // 模擬競標相關的API呼叫
  const testEndpoints = [
    '/api/bid/history/12345',
    '/api/furniture/12345/bids',
    '/api/bid/search'
  ];
  
  testEndpoints.forEach((endpoint, index) => {
    setTimeout(() => {
      console.log(`🌐 模擬API呼叫 ${index + 1}: ${endpoint}`);
      fetch(endpoint)
        .catch(error => {
          console.log(`❌ API呼叫失敗 (預期): ${error.message}`);
        });
    }, index * 500);
  });
  
  console.log('✅ 模擬API呼叫已發送');
}

// 分析結果檢查
function checkAnalysisResults() {
  console.log('📊 檢查分析結果...');
  
  // 檢查Console中的分析結果
  const consoleOutput = [];
  const originalLog = console.log;
  
  console.log = function(...args) {
    consoleOutput.push(args.join(' '));
    originalLog.apply(console, args);
  };
  
  // 觸發分析
  window.postMessage({ source: 'run-vue-api-endpoint-analysis' }, '*');
  
  // 等待分析完成
  setTimeout(() => {
    console.log = originalLog;
    
    const results = {
      vueInstances: consoleOutput.some(line => line.includes('Vue實例')),
      apiMethods: consoleOutput.some(line => line.includes('API方法')),
      apiEndpoints: consoleOutput.some(line => line.includes('API端點')),
      networkRequests: consoleOutput.some(line => line.includes('Fetch請求') || line.includes('XHR請求'))
    };
    
    console.log('\n📋 分析結果摘要:');
    Object.entries(results).forEach(([key, found]) => {
      console.log(`${found ? '✅' : '❌'} ${key}: ${found ? '找到' : '未找到'}`);
    });
    
    if (Object.values(results).some(r => r)) {
      console.log('\n🎉 分析成功！發現了相關資訊');
    } else {
      console.log('\n⚠️ 分析未發現相關資訊，可能需要手動檢查');
    }
  }, 3000);
}

// 匯出測試函數
window.testAPIEndpointAnalysis = testAPIEndpointAnalysis;
window.quickTest = quickTest;
window.simulateAPICall = simulateAPICall;
window.checkAnalysisResults = checkAnalysisResults;

console.log('🔧 API端點分析測試腳本已載入');
console.log('📋 可用的測試函數:');
console.log('  - testAPIEndpointAnalysis() - 完整測試');
console.log('  - quickTest() - 快速測試');
console.log('  - simulateAPICall() - 模擬API呼叫');
console.log('  - checkAnalysisResults() - 檢查分析結果');
console.log('\n💡 建議先執行 quickTest() 進行快速檢查'); 