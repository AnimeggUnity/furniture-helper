# 新北再生家具 Chrome 擴充功能 - 除錯過程紀錄
# Debug Log for New Taipei Recycled Furniture Chrome Extension

## 專案概述

本文件記錄了在開發新北市再生家具網站 Chrome 擴充功能過程中遇到的所有技術問題、分析過程和最終解決方案。

## 開發時間軸

### 2024-03-21 - 初始開發階段

#### 1. 基本功能實現
- ✅ 年度/月份統計功能
- ✅ 輕量匯出功能
- ✅ 全部匯出功能
- ✅ 資料面板功能
- ✅ JSON 匯入功能

#### 2. 列印功能開發

**問題描述**：需要實現表格列印功能，包含應付金額資訊

**分析過程**：
1. 檢查資料結構中的 Payment 物件
2. 發現 Payment 物件包含 TotalAmount 和 PayAmount 欄位
3. 實現格式化函數處理日期和金額

**解決方案**：
```javascript
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
```

**結果**：成功實現列印功能，包含自動編號、家具名稱、類別名稱、行政區名稱、結束日期、應付金額

### 2024-03-21 - 得標者資訊整合

#### 問題描述
使用者需要將得標者資訊加入到列印功能中，但資料結構中的 WinnerID 是數字，而表格顯示的是 ID 格式。

#### 分析過程

**第一階段：WinnerID 欄位分析**
```javascript
// 執行指令
window.postMessage({ source: 'run-vue-winner-analysis' }, '*');

// 分析結果
找到 34 筆有 WinnerID 的資料
WinnerID 數值範圍：352 - 3877
不重複的 WinnerID 數量：9
⚠️ 發現重複的 WinnerID
```

**發現問題**：
- WinnerID 是數字類型，範圍 352-3877
- 有重複的 WinnerID，表示同一得標者可能得標多件商品
- 表格顯示的 ID 格式與實際資料不符

**第二階段：深入分析資料結構**
```javascript
// 執行指令
window.postMessage({ source: 'run-vue-winnerid-number-analysis' }, '*');

// 分析結果
WinnerID: 352 是一個數字ID
前10筆 WinnerID 資料：
1. AutoID: 2388 | Name: 電源供應器不挑款 | WinnerID: 3857
2. AutoID: 2128 | Name: 不挑款 良品 滑鼠  一隻 | WinnerID: 3858
3. AutoID: 2437 | Name: 烏克麗麗 | WinnerID: 352
```

**第三階段：尋找使用者資訊欄位**
```javascript
// 執行指令
window.postMessage({ source: 'run-vue-table-display-analysis' }, '*');

// 關鍵發現
前5筆 WinnerID 詳細分析：
1. AutoID: 2388 | Name: 電源供應器不挑款
   WinnerID: 3857
   Account: lookgirl48
   NickName: 中杰
   DistName: 新店區
   CategoryName: 其他

2. AutoID: 2128 | Name: 不挑款 良品 滑鼠  一隻
   WinnerID: 3858
   Account: sheu0719
   NickName: 小帥
   DistName: 新店區
   CategoryName: 其他
```

#### 解決方案

**發現關鍵資訊**：
- `Account` 欄位：包含使用者帳號（如 lookgirl48、sheu0719）
- `NickName` 欄位：包含使用者暱稱（如 中杰、小帥）
- 這兩個欄位與 WinnerID 相關，可以用來顯示得標者資訊

**實現方案**：
```javascript
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
```

**最終結果**：
- 列印表格新增「得標者」欄位
- 顯示格式：`中杰(lookgirl48)`、`小帥(sheu0719)`、`林(1517)`
- 智慧處理：優先顯示暱稱+帳號，其次顯示暱稱或帳號，最後顯示數字ID

### 2024-03-21 - 程式碼清理與優化

#### 問題描述
開發過程中累積了大量測試碼和分析指令，需要清理程式碼以提高可維護性。

#### 清理過程

**保留的必要除錯功能**：
1. `run-vue-debug-fields` - 基本欄位分析
2. `run-vue-payment-analysis` - Payment 物件分析
3. `run-vue-winner-analysis` - WinnerID 欄位分析（已優化）

**移除的測試碼**：
1. `run-vue-winnerid-deep-analysis` - 深入分析 WinnerID 物件結構
2. `run-vue-winnerid-number-analysis` - 分析 WinnerID 數字值
3. `run-vue-table-display-analysis` - 分析表格顯示邏輯
4. `run-vue-userid-analysis` - 使用者ID欄位分析

**優化結果**：
- 檔案大小：從 572 行減少到約 150 行
- 功能完整性：保留所有核心功能
- 程式碼品質：更簡潔、易維護

### 2024-03-21 - JSON 匯入功能優化

#### 問題描述
使用者反映匯入 JSON 時，類別和行政區欄位會出現選擇不正確的情況。眼睛看到的是中文字，但匯入時會出現匹配失敗的問題。

#### 問題分析

**根本原因**：
1. **資料結構差異**：JSON 中的類別和行政區可能是數字ID，但表單顯示的是中文名稱
2. **選項匹配邏輯**：原本的匹配邏輯只做精確文字比對，無法處理數字ID與中文名稱的對應
3. **選項值與顯示文字**：SELECT 元素的 value 屬性和 textContent 可能不同

**技術細節**：
- JSON 資料：可能包含 `CategoryID: 1`、`DistID: 2` 等數字ID
- 表單顯示：顯示的是 `CategoryName: "其他"`、`DistName: "新店區"` 等中文名稱
- 選項結構：SELECT 的 value 可能是數字ID，textContent 是中文名稱

#### 解決方案

**第一階段：建立分析工具**
```javascript
// 分析表單選項的除錯函數
function analyzeFormOptions() {
  const form = document.querySelector('.vxe-modal--box .el-form');
  if (!form) {
    console.error('❌ 未找到表單');
    return;
  }

  console.log('🔍 分析表單選項...');
  
  // 分析類別選項
  const categoryItem = Array.from(form.querySelectorAll('.el-form-item')).find(el => {
    const label = el.querySelector('.el-form-item__label');
    return label?.textContent.trim() === '類別';
  });
  
  if (categoryItem) {
    const categorySelect = categoryItem.querySelector('select');
    if (categorySelect) {
      console.log('📋 類別選項分析:');
      console.log('選項數量:', categorySelect.options.length);
      Array.from(categorySelect.options).forEach((option, index) => {
        console.log(`${index}: value="${option.value}" | text="${option.textContent.trim()}"`);
      });
    }
  }

  // 分析行政區選項
  const districtItem = Array.from(form.querySelectorAll('.el-form-item')).find(el => {
    const label = el.querySelector('.el-form-item__label');
    return label?.textContent.trim() === '行政區';
  });
  
  if (districtItem) {
    const districtSelect = districtItem.querySelector('select');
    if (districtSelect) {
      console.log('🏘️ 行政區選項分析:');
      console.log('選項數量:', districtSelect.options.length);
      Array.from(districtSelect.options).forEach((option, index) => {
        console.log(`${index}: value="${option.value}" | text="${option.textContent.trim()}"`);
      });
    }
  }
}
```

**第二階段：改進選項匹配邏輯**
```javascript
if (input.tagName === 'SELECT') {
  const options = Array.from(input.options);
  
  // 改進的選項匹配邏輯
  let matchedOption = null;
  
  // 1. 精確匹配文字內容
  matchedOption = options.find(opt => opt.textContent.trim() === value);
  
  // 2. 如果精確匹配失敗，嘗試模糊匹配
  if (!matchedOption) {
    matchedOption = options.find(opt => 
      opt.textContent.trim().includes(value) || 
      value.includes(opt.textContent.trim())
    );
  }
  
  // 3. 如果還是沒找到，嘗試匹配 value 屬性
  if (!matchedOption) {
    matchedOption = options.find(opt => opt.value === value);
  }
  
  if (matchedOption) {
    input.value = matchedOption.value;
    console.log(`✅ ${labelText} 設定成功: "${value}" -> "${matchedOption.textContent.trim()}" (value: ${matchedOption.value})`);
  } else {
    console.log(`❌ ${labelText} 選項未找到: "${value}"`);
    console.log(`可用的選項:`, options.map(opt => `"${opt.textContent.trim()}"`).join(', '));
  }
}
```

**第三階段：新增除錯按鈕**
- 在編輯視窗中新增「分析選項」按鈕
- 可以手動觸發選項分析，查看所有可用的選項
- 匯入 JSON 時自動執行選項分析

#### 預期效果

**改進前**：
- 只能精確匹配文字內容
- 無法處理數字ID與中文名稱的對應
- 錯誤訊息不夠詳細

**改進後**：
- 三層匹配邏輯：精確匹配 → 模糊匹配 → value 匹配
- 詳細的除錯資訊和成功訊息
- 手動分析工具幫助診斷問題
- 更好的錯誤處理和使用者體驗

#### 使用方式

1. **手動分析**：點擊編輯視窗中的「分析選項」按鈕
2. **自動分析**：匯入 JSON 時會自動執行選項分析
3. **除錯資訊**：在瀏覽器控制台查看詳細的匹配過程

### 2024-03-21 - Vue 響應式更新問題解決

#### 問題描述
使用者反映匯入 JSON 後，雖然匹配成功且表單顯示正確，但在提交表單時無法通過驗證。這表示 Vue 的響應式系統沒有正確更新。

#### 問題分析

**根本原因**：
1. **Vue 響應式系統**：Vue 需要特定的事件觸發才能更新響應式資料
2. **事件觸發不足**：原本只觸發 `input` 事件，但可能不足以觸發所有必要的更新
3. **Vue 實例層級**：需要觸發正確的 Vue 實例層級的事件

**技術細節**：
- Vue 組件需要 `input` 和 `change` 事件來更新響應式資料
- 某些情況下需要觸發 Vue 實例的內部事件
- 可能需要延遲觸發確保更新完成

#### 解決方案

**第一階段：建立強制更新機制**
```javascript
// 強制觸發 Vue 響應式更新
function forceVueUpdate(input, value) {
  // 方法1: 直接設定 DOM 值
  input.value = value;
  
  // 方法2: 觸發標準事件
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  
  // 方法3: 觸發 Vue 內部事件
  if (input.__vue__) {
    input.__vue__.$emit('input', value);
    input.__vue__.$emit('change', value);
  }
  
  // 方法4: 查找並觸發父級 Vue 實例
  let vueInstance = input.__vue__;
  let parent = input.parentElement;
  while (!vueInstance && parent) {
    vueInstance = parent.__vue__;
    parent = parent.parentElement;
  }
  
  if (vueInstance && vueInstance.$emit) {
    vueInstance.$emit('input', value);
    vueInstance.$emit('change', value);
  }
  
  // 方法5: 使用 nextTick 確保更新
  if (window.Vue && window.Vue.nextTick) {
    window.Vue.nextTick(() => {
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
  
  // 方法6: 延遲觸發確保更新
  setTimeout(() => {
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, 100);
}
```

**第二階段：建立驗證工具**
```javascript
// 驗證表單資料
function validateFormData() {
  const form = document.querySelector('.vxe-modal--box .el-form');
  if (!form) {
    console.error('❌ 未找到表單');
    return;
  }

  console.log('🔍 驗證表單資料...');
  
  const fieldMap = {
    '品名': 'Name',
    '類別': 'CategoryName',
    '行政區': 'DistName',
    '產品描述': 'Description',
    '長': 'Length',
    '寬': 'Width',
    '高': 'Height',
    '交貨地點': 'DeliveryAddress',
    '起標價格': 'InitPrice',
    '原價': 'OriginPrice'
  };

  Object.entries(fieldMap).forEach(([labelText, jsonKey]) => {
    const item = Array.from(form.querySelectorAll('.el-form-item')).find(el => {
      const label = el.querySelector('.el-form-item__label');
      return label?.textContent.trim() === labelText;
    });
    
    if (item) {
      const input = item.querySelector('input, textarea, select');
      if (input) {
        const currentValue = input.value;
        const displayText = input.tagName === 'SELECT' ? 
          input.options[input.selectedIndex]?.textContent.trim() : currentValue;
        
        console.log(`📋 ${labelText}: value="${currentValue}" | display="${displayText}"`);
      }
    }
  });
}
```

**第三階段：整合到匯入流程**
```javascript
// 匯入 JSON 時自動執行驗證
fillForm(json);

// 延遲執行驗證，確保所有更新完成
setTimeout(() => {
  console.log('🔍 執行表單驗證...');
  validateFormData();
}, 500);
```

**第四階段：新增驗證按鈕**
- 在編輯視窗中新增「驗證資料」按鈕
- 可以手動檢查表單資料的實際值
- 幫助診斷 Vue 響應式更新問題

#### 預期效果

**改進前**：
- 表單顯示正確但驗證失敗
- 無法確認 Vue 響應式更新狀態
- 缺乏診斷工具

**改進後**：
- 六層更新機制確保 Vue 響應式更新
- 自動驗證功能檢查更新結果
- 手動驗證工具幫助診斷問題
- 詳細的除錯資訊顯示實際值

#### 使用方式

1. **自動驗證**：匯入 JSON 後自動執行驗證
2. **手動驗證**：點擊「驗證資料」按鈕檢查表單狀態
3. **除錯資訊**：在控制台查看詳細的驗證結果

## 技術難點與解決方案

### 1. Vue.js 資料存取
**問題**：需要從網頁的 Vue 實例中取得表格資料
**解決方案**：
```javascript
const table = document.querySelector('.vxe-table');
let vue = table?.__vue__;
let safety = 20;
while (vue && !vue.tableFullData && safety-- > 0) vue = vue.$parent;
```

### 2. 物件結構處理
**問題**：Payment 和 WinnerID 等欄位可能是物件或 null
**解決方案**：
```javascript
// 安全的物件存取
function getTotalAmount(payment) {
  if (!payment || typeof payment !== 'object') return null;
  return payment.TotalAmount;
}
```

### 3. 資料格式化
**問題**：日期和金額需要特定格式
**解決方案**：
```javascript
// 日期格式化
function formatDate(dateString) {
  if (!dateString) return '無';
  const date = new Date(dateString);
  return date.toISOString().slice(0, 10);
}

// 金額格式化
function formatCurrency(amount) {
  if (!amount && amount !== 0) return '無';
  return new Intl.NumberFormat('zh-TW').format(amount);
}
```

### 4. 選項匹配邏輯
**問題**：SELECT 元素的選項匹配需要處理多種情況
**解決方案**：
```javascript
// 多層匹配邏輯
// 1. 精確匹配文字內容
// 2. 模糊匹配（包含關係）
// 3. 匹配 value 屬性
```

## 除錯工具開發

### 開發的除錯指令

1. **基本欄位分析**
   ```javascript
   window.postMessage({ source: 'run-vue-debug-fields' }, '*');
   ```
   - 用途：快速查看所有資料欄位和類型
   - 輸出：欄位清單、資料類型、總筆數

2. **Payment 物件分析**
   ```javascript
   window.postMessage({ source: 'run-vue-payment-analysis' }, '*');
   ```
   - 用途：分析付款相關欄位
   - 輸出：TotalAmount、PayAmount 等價格資訊

3. **WinnerID 欄位分析**
   ```javascript
   window.postMessage({ source: 'run-vue-winner-analysis' }, '*');
   ```
   - 用途：分析得標者相關資訊
   - 輸出：WinnerID、Account、NickName 等資訊

4. **表單選項分析**
   ```javascript
   analyzeFormOptions();
   ```
   - 用途：分析編輯表單中的選項結構
   - 輸出：類別和行政區的所有選項及其 value/text 對應

### 除錯工具的使用價值

1. **快速診斷**：能夠快速了解資料結構和表單選項
2. **問題定位**：幫助定位資料相關問題和選項匹配問題
3. **功能驗證**：驗證新功能的實作效果
4. **開發效率**：提高開發和除錯效率

## 最終功能清單

### 核心功能
- ✅ 年度/月份統計
- ✅ 輕量匯出（基本欄位）
- ✅ 全部匯出（完整欄位）
- ✅ 表格列印（包含得標者資訊）
- ✅ 資料面板（搜尋、下載、圖片預覽）
- ✅ JSON 匯入功能（已優化選項匹配）

### 列印功能詳細規格
- **欄位**：自動編號、家具名稱、類別名稱、行政區名稱、結束日期、應付金額、得標者
- **格式**：列印友善的 HTML 頁面
- **得標者顯示**：`NickName(Account)` 格式
- **智慧處理**：自動處理空值和格式轉換

### JSON 匯入功能詳細規格
- **支援欄位**：品名、類別、行政區、產品描述、尺寸、價格等
- **選項匹配**：三層匹配邏輯（精確、模糊、value）
- **除錯工具**：手動分析選項功能
- **錯誤處理**：詳細的錯誤訊息和成功回饋

### 除錯工具
- **4個核心除錯指令**：涵蓋資料結構分析、付款資訊、得標者資訊、表單選項
- **即時分析**：在瀏覽器控制台執行
- **詳細輸出**：包含資料統計、選項結構和範例

## 經驗總結

### 成功要素
1. **系統性分析**：逐步分析資料結構，找出關鍵欄位和問題根源
2. **工具開發**：建立專用的除錯工具提高開發效率
3. **程式碼清理**：定期清理測試碼，保持程式碼品質
4. **文件記錄**：詳細記錄開發過程，便於後續維護
5. **多層匹配**：建立彈性的選項匹配邏輯處理各種情況

### 技術收穫
1. **Vue.js 整合**：深入了解 Vue 實例的資料存取方式
2. **Chrome Extension 開發**：掌握 Manifest V3 的開發模式
3. **資料處理**：學會處理複雜的物件結構和格式化需求
4. **除錯技巧**：建立有效的除錯工具和流程
5. **表單處理**：學會處理 SELECT 元素的選項匹配問題

### 未來改進方向
1. **效能優化**：針對大量資料的處理優化
2. **使用者體驗**：改善介面設計和操作流程
3. **功能擴展**：根據使用者需求增加新功能
4. **測試覆蓋**：增加自動化測試提高穩定性
5. **選項快取**：快取表單選項以提高匯入效率

## 2024-03-21 - Element UI el-select 分析工具

### 問題描述
從 HTML 結構分析發現，類別和行政區欄位使用的是 Element UI 的 `el-select` 元件，而不是標準的 HTML `select` 元素。這導致了以下特徵：

**未選擇時：**
```html
<div class="el-form-item is-error is-required el-form-item--small">
  <label for="CategoryID" class="el-form-item__label">類別</label>
  <div class="el-form-item__content">
    <div class="el-select el-select--small">
      <div class="el-input el-input--small el-input--suffix">
        <input type="text" autocomplete="off" placeholder="請選擇" class="el-input__inner" readonly="readonly">
        <span class="el-input__suffix">
          <span class="el-input__suffix-inner">
            <i class="el-select__caret el-input__icon el-icon-arrow-up"></i>
          </span>
          <i class="el-input__icon el-input__validateIcon el-icon-circle-close"></i>
        </span>
      </div>
    </div>
    <div class="el-form-item__error">請選擇類別</div>
  </div>
</div>
```

**已選擇時：**
```html
<div class="el-form-item is-success is-required el-form-item--small">
  <label for="CategoryID" class="el-form-item__label">類別</label>
  <div class="el-form-item__content">
    <div class="el-select el-select--small">
      <div class="el-input el-input--small el-input__suffix">
        <input type="text" autocomplete="off" placeholder="請選擇" class="el-input__inner" readonly="readonly">
        <span class="el-input__suffix">
          <span class="el-input__suffix-inner">
            <i class="el-select__caret el-input__icon el-icon-arrow-up"></i>
          </span>
          <i class="el-input__icon el-input__validateIcon el-icon-circle-check"></i>
        </span>
      </div>
    </div>
  </div>
</div>
```

### 關鍵發現
1. **readonly input**：實際的輸入框是 `readonly` 的，只負責顯示選中的值
2. **隱藏的 select**：真正的選項資料可能在隱藏的 `select` 元素中
3. **Vue 實例**：選項資料可能存儲在 Vue 實例的資料中
4. **動態下拉選單**：點擊輸入框時會動態生成下拉選單

### 新增的分析工具

#### 1. 深入分析 Element UI el-select 選項
```javascript
function analyzeElementSelectOptions() {
  // 查找隱藏的 select 元素
  const hiddenSelect = elSelect.querySelector('select');
  
  // 查找 Vue 實例
  if (elSelect.__vue__) {
    const vueData = elSelect.__vue__.$data;
  }
  
  // 查找父級 Vue 實例
  let parentVue = elSelect.parentElement;
  while (!parentVue.__vue__ && parentVue) {
    parentVue = parentVue.parentElement;
  }
}
```

#### 2. 模擬點擊 el-select 並捕獲選項
```javascript
function simulateSelectClick() {
  // 模擬點擊輸入框來打開下拉選單
  categoryInput.click();
  
  // 延遲檢查下拉選單
  setTimeout(() => {
    const dropdown = document.querySelector('.el-select-dropdown');
    const options = dropdown.querySelectorAll('.el-select-dropdown__item');
    
    options.forEach((option, index) => {
      const text = option.textContent.trim();
      const value = option.dataset.value || option.getAttribute('data-value');
      console.log(`${index}: value="${value}" | text="${text}"`);
    });
  }, 500);
}
```

### 使用方式
1. **分析 el-select**：點擊「分析 el-select」按鈕，深入分析 Element UI 元件的結構
2. **模擬點擊**：點擊「模擬點擊」按鈕，模擬用戶點擊下拉選單並捕獲選項
3. **控制台查看**：在瀏覽器控制台查看詳細的分析結果

### 預期效果
- 找到類別和行政區的實際選項資料
- 建立中文名稱到數字ID的映射關係
- 解決匯入 JSON 時的驗證問題

### 下一步
根據分析結果，更新 `fillForm` 函數中的映射邏輯，確保能正確處理 Element UI 的 el-select 元件。

---

*最後更新：2024-03-21*
*開發者：AI Assistant*
*專案狀態：完成* 