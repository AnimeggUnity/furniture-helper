(function () {
  // 注入 inject.js 到頁面
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('inject.js');
  script.onload = () => console.log('✅ inject.js 載入成功');
  script.onerror = () => console.error('❌ inject.js 載入失敗');
  document.documentElement.appendChild(script);

  window.addEventListener('message', event => {
    if (event.source !== window || event.origin !== window.location.origin) return;
    const msg = event.data;
    if (!msg || !msg.source) {
      console.error('❌ 無效的消息格式', msg);
      return;
    }
    console.log('Received Message:', msg.source);
    if (msg.source === 'vue-stats') {
      if (!msg.monthly || !msg.yearly) {
        console.error('❌ vue-stats 數據格式錯誤', msg);
        alert('統計數據格式錯誤');
        return;
      }
      showModal(msg.monthly, msg.yearly);
    }
    if (msg.source === 'vue-export') {
      if (!Array.isArray(msg.data) || !msg.data.length) {
        alert('⚠️ 輕量匯出失敗，沒有資料');
        return;
      }
      exportToCSV(msg.data);
    }
    if (msg.source === 'vue-export-all') {
      if (!Array.isArray(msg.data) || !msg.data.length) {
        alert('⚠️ 全部匯出失敗，沒有資料');
        return;
      }
      console.log('Exporting Full CSV:', msg.data);
      exportAllToCSV(msg.data);
    }
    if (msg.source === 'vue-panel-data') {
      if (!Array.isArray(msg.data)) {
        console.error('❌ vue-panel-data 數據格式錯誤', msg);
        return;
      }
      buildPanel(msg.data);
    }
  });

  function showModal(monthly, yearly) {
    const currentYear = new Date().getFullYear().toString();
    const lines = [];
    Object.keys(monthly).filter(m => m.startsWith(currentYear + '-')).sort().reverse()
      .forEach(m => lines.push(`${m}：${monthly[m]} 筆`));
    Object.keys(yearly).filter(y => y !== currentYear).sort((a, b) => b - a)
      .forEach(y => lines.push(`${y}年：${yearly[y]} 筆`));

    let modal = document.getElementById('vue-stats-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'vue-stats-modal';
      Object.assign(modal.style, {
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        background: '#fff', border: '0.5px solid #ddd', padding: '24px', zIndex: '9999',
        width: 'auto', maxWidth: '90%', maxHeight: '80%', overflow: 'auto',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)', borderRadius: '6px'
      });
      modal.innerHTML = `
        <span style="position:absolute; top:12px; right:16px; cursor:pointer; font-size:24px;"
              onclick="this.parentNode.style.display='none'">✖</span>
        <h3 style="font-size:24px; margin-top:0;">📊 年度/月份統計</h3>
        <ul id="vue-stats-list" style="padding-left:24px; margin:0; font-size:24px;"></ul>
      `;
      document.body.appendChild(modal);
    }
    const ul = modal.querySelector('#vue-stats-list');
    ul.innerHTML = '';
    lines.forEach(text => {
      const li = document.createElement('li');
      li.textContent = text;
      ul.appendChild(li);
    });
    modal.style.display = 'block';
  }

  function exportToCSV(data) {
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

  function exportAllToCSV(data) {
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
      Object.assign(modal.style, {
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        background: '#fff', border: '1px solid #ccc', padding: '16px', zIndex: '10000',
        maxHeight: '60%', overflow: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', borderRadius: '4px'
      });
      modal.innerHTML = `
        <span style="position:absolute; top:8px; right:12px; cursor:pointer;"
              onclick="this.parentNode.style.display='none'">✖</span>
        <h3 style="margin-top:0;">📷 圖片預覽</h3>
        <div id="photo-preview-container" style="display: flex; flex-wrap: wrap; gap: 10px;"></div>
      `;
      document.body.appendChild(modal);
    }

    const container = modal.querySelector('#photo-preview-container');
    container.innerHTML = '';
    if (photos && Array.isArray(photos) && photos.length > 0) {
      photos.forEach((photo, index) => {
        const img = document.createElement('img');
        img.src = photo.Photo;
        img.style.maxWidth = '200px';
        img.style.maxHeight = '200px';
        img.alt = `Photo ${index + 1}`;
        container.appendChild(img);
      });
    } else {
      container.innerHTML = '<p>無圖片可顯示</p>';
    }
    modal.style.display = 'block';
  }

  function buildPanel(data) {
    if (!Array.isArray(data) || !data.length) {
      console.warn('❌ 無有效資料');
      return;
    }

    const panelId = 'furniture-panel';
    const panel = document.getElementById(panelId);
    if (panel) panel.remove(); // 確保舊面板移除

    const newPanel = document.createElement('div');
    newPanel.id = panelId;
    newPanel.style = `
      position: fixed; top: 80px; right: 0;
      width: 320px; height: calc(100% - 100px);
      overflow-y: auto; background: white;
      border-left: 2px solid #007baf;
      box-shadow: -2px 0 5px rgba(0,0,0,0.2);
      font-family: 'Segoe UI', 'Noto Sans TC', sans-serif;
      z-index: 99999;
    `;
    newPanel.innerHTML = `
      <h2 style="margin: 0; background: #007baf; color: white; padding: 12px; font-size: 16px; display: flex; justify-content: space-between;">
        <span>📥 匯出家具資料</span>
        <button id="close-panel" style="background: none; border: none; color: white; font-size: 16px; cursor: pointer;">✖</button>
      </h2>
      <input type="text" id="panel-search" placeholder="輸入 AutoID 搜尋" style="width: calc(100% - 20px); padding: 8px; margin: 10px; border: 1px solid #ccc; border-radius: 4px;">
    `;

    data.sort((a, b) => b.AutoID - a.AutoID);
    data.forEach((item, i) => {
      const div = document.createElement('div');
      div.dataset.autoid = item.AutoID; // 新增 data-autoid 屬性
      div.style = 'padding: 10px; border-bottom: 1px solid #eee; font-size: 14px;';
      div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>
            <span class="photo-preview-icon" style="cursor: pointer;">📦</span>
            <strong>${item.Name || '未命名'}</strong>
          </span>
          <button style="background: #007baf; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px;" data-index="${i}">下載</button>
        </div>
        <div style="color: #666; font-size: 13px; margin-top: 4px;">
          🆔 ${item.AutoID} 📍 ${item.DistName || '無'} 🕒 ${(item.CreateDate || '').split('T')[0]}
        </div>
      `;
      const photoIcon = div.querySelector('.photo-preview-icon');
      photoIcon.addEventListener('click', () => showPhotoPreview(item.Photos));
      div.querySelector('button').onclick = () => {
        const {
          AutoID, Name, CategoryName, DistName, CreateDate, Description,
          Length, Width, Height, DeliveryAddress, InitPrice, OriginPrice, Photos
        } = item;
        const dataToExport = {
          AutoID,
          Name,
          CategoryName,
          DistName,
          CreateDate,
          Description,
          Length,
          Width,
          Height,
          DeliveryAddress,
          InitPrice,
          OriginPrice,
          Photos
        };
        const name = Name || `item_${i}`;
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name}.json`;
        a.click();
        URL.revokeObjectURL(url);

        const base = location.origin;
        (Photos || []).forEach((p, j) => {
          const imgA = document.createElement('a');
          imgA.href = p.Photo.startsWith('http') ? p.Photo : base + p.Photo;
          imgA.download = `${name}_${j}.jpg`;
          imgA.click();
        });
      };
      newPanel.appendChild(div);
    });

    document.body.appendChild(newPanel);
    document.getElementById('close-panel').onclick = () => {
      newPanel.remove(); // 銷毀面板
    };

    // 搜尋功能
    document.getElementById('panel-search').onkeyup = (e) => {
      const inputValue = e.target.value.trim();
      if (!inputValue) {
        // 清除高亮
        newPanel.querySelectorAll('[data-autoid]').forEach(item => {
          item.style.background = '';
        });
        return;
      }
      const item = newPanel.querySelector(`[data-autoid="${inputValue}"]`);
      if (item) {
        // 清除其他高亮
        newPanel.querySelectorAll('[data-autoid]').forEach(other => {
          if (other !== item) other.style.background = '';
        });
        // 滾動並高亮
        item.scrollIntoView({ behavior: 'smooth', block: 'center' });
        item.style.background = '#e6f3ff';
        setTimeout(() => item.style.background = '', 2000); // 2 秒後移除高亮
      } else {
        console.log('無匹配 AutoID:', inputValue);
      }
    };
  }

  function insertButtons() {
    const addBtn = document.querySelector('button.el-button.el-button--success');
    if (!addBtn || document.querySelector('#tm-stats-btn')) return;

    if (!addBtn.parentNode) {
      console.error('❌ 父節點未找到');
      return;
    }

    addBtn.onclick = () => {
      setTimeout(() => {
        const modal = document.querySelector('.vxe-modal--box');
        if (!modal) {
          console.log('❌ 未找到 vxe-modal--box');
          return;
        }

        const header = modal.querySelector('.vxe-modal--header');
        const title = header && header.querySelector('.vxe-modal--title');
        if (!header || !title || title.textContent !== '編輯視窗') {
          console.log('❌ 未找到 header 或標題不是「編輯視窗」', { header, title: title?.textContent });
          return;
        }

        if (!document.getElementById('import-json-btn')) {
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
                  fillForm(json);
                } catch (e) {
                  alert('❌ 匯入失敗，格式錯誤');
                }
              };
              reader.readAsText(file);
            };
            input.click();
          };

          header.appendChild(importBtn);
          console.log('📥 匯入 JSON 按鈕已插入到編輯視窗 header');
        }
      }, 1000);
    };

    const statsBtn = document.createElement('button');
    statsBtn.id = 'tm-stats-btn';
    statsBtn.textContent = '📈 年度統計';
    statsBtn.className = 'el-button el-button--primary el-button--small';
    statsBtn.style.marginLeft = '5px';
    statsBtn.onclick = () => {
      const queryBtn = Array.from(document.querySelectorAll('button.el-button'))
        .find(b => /查\s*詢/.test(b.textContent));
      if (!queryBtn) {
        console.error('❌ 查詢按鈕未找到');
        alert('查詢按鈕未找到，請確認頁面已載入');
        return;
      }
      queryBtn.click();
      setTimeout(() => window.postMessage({ source: 'run-vue-stats' }, window.location.origin), 1000);
    };

    const exportBtn = document.createElement('button');
    exportBtn.textContent = '📥 輕量匯出';
    exportBtn.className = 'el-button el-button--warning el-button--small';
    exportBtn.style.marginLeft = '5px';
    exportBtn.onclick = () => {
      window.postMessage({ source: 'run-vue-export' }, window.location.origin);
    };

    const exportAllBtn = document.createElement('button');
    exportAllBtn.textContent = '📥 全部匯出';
    exportAllBtn.className = 'el-button el-button--warning el-button--small';
    exportAllBtn.style.marginLeft = '5px';
    exportAllBtn.onclick = () => {
      window.postMessage({ source: 'run-vue-export-all' }, window.location.origin);
    };

    const panelBtn = document.createElement('button');
    panelBtn.textContent = '📂 資料面板';
    panelBtn.className = 'el-button el-button--info el-button--small';
    panelBtn.style.marginLeft = '5px';
    panelBtn.onclick = () => {
      const panel = document.getElementById('furniture-panel');
      if (panel) {
        panel.remove(); // 銷毀面板
      } else {
        window.postMessage({ source: 'run-vue-panel' }, window.location.origin);
      }
    };

    if (!statsBtn || !exportBtn || !exportAllBtn || !panelBtn) {
      console.error('❌ 按鈕未正確定義');
      return;
    }

    addBtn.parentNode.insertBefore(statsBtn, addBtn.nextSibling);
    addBtn.parentNode.insertBefore(exportBtn, statsBtn.nextSibling);
    addBtn.parentNode.insertBefore(exportAllBtn, exportBtn.nextSibling);
    addBtn.parentNode.insertBefore(panelBtn, exportAllBtn.nextSibling);
    console.log('✅ 已插入統計、輕量匯出、全部匯出、資料面板按鈕');
  }

  function fillForm(json) {
    const form = document.querySelector('.vxe-modal--box .el-form');
    if (!form) {
      console.error('❌ 未找到表單');
      return;
    }

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
      if (!item) {
        console.log(`❌ 未找到欄位: ${labelText}`);
        return;
      }

      const input = item.querySelector('input, textarea, select');
      if (!input) {
        console.log(`❌ 未找到輸入元素: ${labelText}`);
        return;
      }

      const value = json[jsonKey];
      if (value === undefined || value === null) {
        console.log(`❌ JSON 缺少值: ${jsonKey}`);
        return;
      }

      if (input.tagName === 'SELECT') {
        const options = Array.from(input.options);
        const option = options.find(opt => opt.textContent.trim() === value);
        if (option) {
          input.value = option.value;
        } else {
          console.log(`❌ 選項未找到: ${jsonKey} = ${value}`);
        }
      } else {
        input.value = value;
      }

      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  insertButtons();
  const buttonContainer = document.querySelector('.el-button-group') || document.body;
  new MutationObserver(insertButtons).observe(buttonContainer, { childList: true, subtree: true });
})();