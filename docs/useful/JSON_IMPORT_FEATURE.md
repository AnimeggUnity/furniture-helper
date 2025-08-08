# 匯入 JSON 功能完整程式碼

## 功能說明
這個功能可以讓使用者在編輯表單時匯入 JSON 檔案，自動填充表單欄位，並正確處理 Element UI 的 Select 元件。

## 需要加入的函數

### 1. 強制更新 Vue 組件函數
```javascript
// 強制更新 Vue 組件
function forceVueUpdate(input, value) {
  // 直接設定值
  input.value = value;
  
  // 觸發 Vue 的響應式更新
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  
  // 如果是數字輸入框，確保值為數字
  if (input.type === 'number' && typeof value === 'string') {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      input.value = numValue;
    }
  }
}
```

### 2. 驗證表單資料函數
```javascript
// 驗證表單資料
function validateFormData() {
  const form = document.querySelector('.vxe-modal--box .el-form');
  if (!form) {
    console.error('❌ 未找到表單');
    return;
  }

  const formItems = form.querySelectorAll('.el-form-item');
  formItems.forEach(item => {
    const label = item.querySelector('.el-form-item__label');
    const input = item.querySelector('input, textarea, select');
    
    if (label && input) {
      const labelText = label.textContent.trim();
      const value = input.value;
      const display = input.type === 'file' ? input.files?.[0]?.name || '無檔案' : value;
    }
  });
}
```

### 3. 填充表單函數（核心功能）
```javascript
// 填充表單
function fillForm(json) {
  const form = document.querySelector('.vxe-modal--box .el-form');
  if (!form) {
    console.error('❌ 未找到表單');
    return;
  }

  const formItems = form.querySelectorAll('.el-form-item');
  formItems.forEach(item => {
    const label = item.querySelector('.el-form-item__label');
    const input = item.querySelector('input, textarea, select');
    
    if (!label || !input) return;
    
    const labelText = label.textContent.trim();
    let value = '';

    // 根據標籤文字映射 JSON 欄位
    switch (labelText) {
      case '品名':
        value = json.Name || '';
        break;
      case '類別':
        value = json.CategoryName || '';
        break;
      case '行政區':
        value = json.DistName || '';
        break;
      case '產品描述':
        value = json.Description || '';
        break;
      case '長':
        value = json.Length || '';
        break;
      case '寬':
        value = json.Width || '';
        break;
      case '高':
        value = json.Height || '';
        break;
      case '交貨地點':
        value = json.DeliveryAddress || '';
        break;
      case '起標價格':
        value = json.InitPrice || '';
        break;
      case '原價':
        value = json.OriginPrice || '';
        break;
      default:
        return;
    }

    if (value === '') return;

    // 處理 Element UI Select 元件（包含模擬點擊功能）
    if (input.type === 'text' && (labelText === '類別' || labelText === '行政區')) {
      const elSelect = input.closest('.el-select');
      if (elSelect) {
        const dropdown = elSelect.querySelector('.el-select-dropdown');
        if (dropdown) {
          const options = dropdown.querySelectorAll('.el-select-dropdown__item');
          const matchedOption = Array.from(options).find(option => 
            option.textContent.trim() === value
          );
          
          if (matchedOption) {
            // 模擬點擊功能：點擊輸入框開啟下拉選單
            input.click();
            
            // 延遲一下確保下拉選單開啟
            setTimeout(() => {
              // 點擊選項
              matchedOption.click();
              
              // 觸發必要的事件
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }, 100);
            
          } else {
            // 如果找不到匹配選項，嘗試直接設定
            forceVueUpdate(input, value);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        } else {
          // 使用備用方案
          forceVueUpdate(input, value);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      } else {
        // 使用備用方案
        forceVueUpdate(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else {
      forceVueUpdate(input, value);
    }
  });
}
```

## 在 insertButtons() 函數中加入的程式碼

### 4. 匯入按鈕插入函數
```javascript
// 為編輯視窗添加匯入 JSON 按鈕
const insertImportButton = () => {
  const modal = document.querySelector('.vxe-modal--box');
  if (!modal) {
    setTimeout(insertImportButton, 1000);
    return;
  }

  const header = modal.querySelector('.vxe-modal--header');
  if (!header || header.querySelector('#import-json-btn')) {
    setTimeout(insertImportButton, 1000);
    return;
  }

  // 匯入 JSON 按鈕
  const importBtn = document.createElement('button');
  importBtn.id = 'import-json-btn';
  importBtn.className = 'el-button el-button--success el-button--small';
  importBtn.innerHTML = '<span><i class="fa fa-upload"></i> 匯入 JSON</span>';
  importBtn.style.marginLeft = '10px';
  importBtn.style.verticalAlign = 'middle';
  importBtn.onclick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const json = JSON.parse(reader.result);
          if (!json.AutoID || !json.Name) {
            alert('❌ JSON 格式不符合要求，需包含 AutoID 和 Name');
            return;
          }
          
          console.log('📥 開始匯入 JSON 資料...');
          
          // 填充表單
          fillForm(json);
          
          // 延遲執行驗證，確保所有更新完成
          setTimeout(() => {
            validateFormData();
          }, 500);
        } catch (e) {
          alert('❌ 匯入失敗，格式錯誤');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  header.appendChild(importBtn);
};

// 在 insertButtons() 函數的最後加入這行
insertImportButton();
```

## 使用方式

### 1. 將函數加入到 content.js
- 將 `forceVueUpdate`、`validateFormData`、`fillForm` 函數加入到 content.js
- 在 `insertButtons()` 函數中加入 `insertImportButton()` 的調用

### 2. JSON 格式要求
```json
{
  "AutoID": 2047,
  "Name": "E27 夾式筒燈 - 6",
  "CategoryName": "燈具、燈飾",
  "DistName": "新店區",
  "CreateDate": "2025-04-19T18:17:15.643",
  "Description": "產品描述...",
  "Length": 0,
  "Width": 0,
  "Height": 0,
  "DeliveryAddress": "新北市新店區薏仁坑路自強巷2-3號",
  "InitPrice": 20,
  "OriginPrice": 20,
  "Photos": [...]
}
```

### 3. 功能特點
- **自動填充**：根據 JSON 資料自動填充表單欄位
- **模擬點擊**：正確處理 Element UI Select 元件的類別和行政區欄位
- **事件觸發**：確保 Vue 組件狀態正確更新
- **驗證支援**：觸發表單驗證確保資料正確

### 4. 模擬點擊流程
1. 找到 Element UI Select 元件
2. 找到下拉選單和選項
3. 點擊輸入框開啟下拉選單
4. 延遲 100ms 確保下拉選單完全開啟
5. 點擊匹配的選項
6. 觸發必要的事件

## 注意事項
- 確保這些函數在主要程式碼之前定義
- 模擬點擊功能是解決 Element UI Select 驗證問題的關鍵
- 延遲時間（100ms）可能需要根據網路速度調整 