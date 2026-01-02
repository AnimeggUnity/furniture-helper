
((app) => {
  // 新的階層式統計顯示函數
  function showHierarchicalModal(hierarchicalStats) {
    let modal = document.getElementById('vue-stats-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'vue-stats-modal';

      modal.style.cssText = app.applyComponentVariant('modal', 'stats');
      modal.innerHTML = `
        <span style="${app.UI_COMPONENTS.closeButton.base}"
              onclick="this.parentNode.style.display='none'">X</span>
        <h3 style="font-size:24px; margin-top:0; text-align:center; color:#333;">📊 統計資料總覽</h3>
        <div style="text-align: center; margin-bottom: 20px; padding: 0 20px;">
          <label style="margin-right: 20px; font-size: 14px; color: #333;">
            <input type="radio" name="stats-mode" value="detailed" checked style="margin-right: 5px;">
            詳細樹狀
          </label>
          <label style="font-size: 14px; color: #333;">
            <input type="radio" name="stats-mode" value="quarterly" style="margin-right: 5px;">
            季報摘要
          </label>
        </div>
        <div style="max-height: 70vh; overflow-y: auto; padding: 10px;">
          <div id="hierarchical-stats-container"></div>
        </div>
      `;
      document.body.appendChild(modal);
    } else {
      const detailedRadio = modal.querySelector('input[value="detailed"]');
      const quarterlyRadio = modal.querySelector('input[value="quarterly"]');
      if (detailedRadio) detailedRadio.checked = true;
      if (quarterlyRadio) quarterlyRadio.checked = false;
    }

    const container = modal.querySelector('#hierarchical-stats-container');

    function renderStatsContent(mode) {
      container.innerHTML = '';

      if (mode === 'quarterly') {
        if (hierarchicalStats.createDate) {
          const createDateSection = generateQuarterlyView(hierarchicalStats.createDate, '📅 建立時間分布', '#4A90E2');
          container.appendChild(createDateSection);
        }

        if (hierarchicalStats.endDate) {
          const endDateSection = generateQuarterlyView(hierarchicalStats.endDate, '🎯 競標結束時間分布', '#ff6b35');
          container.appendChild(endDateSection);
        }
      } else {
        if (hierarchicalStats.createDate) {
          const createDateSection = createStatsTree(hierarchicalStats.createDate, '📅 建立時間分布 (CreateDate)', '#4A90E2');
          container.appendChild(createDateSection);
        }

        if (hierarchicalStats.endDate) {
          const endDateSection = createStatsTree(hierarchicalStats.endDate, '🎯 競標結束時間分布 (EndDate)', '#ff6b35');
          container.appendChild(endDateSection);
        }
      }
    }

    const modeRadios = modal.querySelectorAll('input[name="stats-mode"]');
    modeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        renderStatsContent(e.target.value);
      });
    });

    renderStatsContent('detailed');
    modal.style.display = 'block';
  }

  function createStatsTree(dateData, title, color) {
    const section = createStatsSection(title, color);
    const content = section.querySelector('.stats-content');

    const sortedYears = Object.keys(dateData).sort((a, b) => b - a);
    sortedYears.forEach(year => {
      const yearSection = createYearSection(dateData[year], year, color);
      content.appendChild(yearSection);
    });

    return section;
  }

  function createStatsSection(title, color) {
    const section = document.createElement('div');
    section.style.cssText = 'margin-bottom: 30px; border: 1px solid #e0e0e0; border-radius: 8px; background: #f8f9fa;';

    const header = document.createElement('div');
    header.style.cssText = `background: ${color}; color: white; padding: 12px; font-size: 16px; font-weight: bold; border-radius: 7px 7px 0 0; cursor: pointer;`;
    header.innerHTML = `${title} <span class="section-toggle">▶</span>`;

    const content = document.createElement('div');
    content.className = 'stats-content';
    content.style.cssText = 'padding: 15px; display: none;';

    header.onclick = () => {
      const isHidden = content.style.display === 'none';
      content.style.display = isHidden ? 'block' : 'none';
      header.querySelector('.section-toggle').textContent = isHidden ? '▼' : '▶';
    };

    section.appendChild(header);
    section.appendChild(content);
    return section;
  }

  function createYearSection(yearData, year, color) {
    const yearDiv = document.createElement('div');
    yearDiv.style.cssText = 'margin-bottom: 15px; border-left: 3px solid #ddd; padding-left: 10px;';

    const yearTotal = calculateYearTotal(yearData);

    const yearHeader = document.createElement('div');
    yearHeader.style.cssText = 'font-weight: bold; font-size: 14px; color: #333; cursor: pointer; padding: 5px 0; user-select: none;';
    yearHeader.innerHTML = `<span class="toggle">▶</span> ${year}年: ${yearTotal}筆`;

    const yearContent = document.createElement('div');
    yearContent.style.cssText = 'margin-left: 15px; display: none;';

    yearHeader.onclick = (e) => {
      e.stopPropagation();
      const isHidden = yearContent.style.display === 'none';
      yearContent.style.display = isHidden ? 'block' : 'none';
      yearHeader.querySelector('.toggle').textContent = isHidden ? '▼' : '▶';
    };

    const sortedMonths = Object.keys(yearData).sort((a, b) => b.localeCompare(a));
    sortedMonths.forEach(month => {
      const monthSection = createMonthSection(yearData[month], month, color);
      yearContent.appendChild(monthSection);
    });

    yearDiv.appendChild(yearHeader);
    yearDiv.appendChild(yearContent);
    return yearDiv;
  }

  function calculateYearTotal(yearData) {
    let total = 0;
    Object.keys(yearData).forEach(month => {
      Object.keys(yearData[month]).forEach(day => {
        total += yearData[month][day].length;
      });
    });
    return total;
  }

  function createDateSeparator(dateStr, color) {
    const separator = document.createElement('div');
    separator.style.cssText = `
      margin: 8px 0 6px 0;
      padding: 4px 8px;
      font-size: 12px;
      font-weight: 600;
      color: ${color};
      background: linear-gradient(to right, ${color}15 0%, transparent 100%);
      border-left: 3px solid ${color};
      display: flex;
      align-items: center;
    `;

    const dateLabel = document.createElement('span');
    dateLabel.textContent = dateStr;
    dateLabel.style.cssText = 'margin-right: 8px;';

    const line = document.createElement('span');
    line.style.cssText = `
      flex: 1;
      height: 1px;
      background: linear-gradient(to right, ${color}40, transparent);
      margin-left: 8px;
    `;

    separator.appendChild(dateLabel);
    separator.appendChild(line);

    return separator;
  }

  function createMonthSection(monthData, month, color) {
    const monthDiv = document.createElement('div');
    monthDiv.style.cssText = 'margin-bottom: 10px; border-left: 2px solid #ccc; padding-left: 10px;';

    // 扁平化所有日期的項目到單一陣列
    const allItems = [];
    Object.keys(monthData).forEach(day => {
      monthData[day].forEach(item => {
        allItems.push({ ...item, _displayDate: day });
      });
    });

    const monthTotal = allItems.length;

    const monthHeader = document.createElement('div');
    monthHeader.style.cssText = 'font-weight: 600; font-size: 13px; color: #555; cursor: pointer; padding: 3px 0; user-select: none;';
    monthHeader.innerHTML = `<span class="toggle">▶</span> ${month}: ${monthTotal}筆`;

    const monthContent = document.createElement('div');
    monthContent.style.cssText = 'margin-left: 15px; display: none;';

    monthHeader.onclick = (e) => {
      e.stopPropagation();
      const isHidden = monthContent.style.display === 'none';

      // 延遲載入：只在第一次展開時渲染內容
      if (isHidden && monthContent.innerHTML === '') {
        // 排序：日期 desc → AutoID desc
        allItems.sort((a, b) => {
          const dateCompare = b._displayDate.localeCompare(a._displayDate);
          if (dateCompare !== 0) return dateCompare;
          return b.AutoID - a.AutoID;
        });

        // 渲染項目，並在日期變化時插入分隔線
        let currentDate = null;
        allItems.forEach(item => {
          if (item._displayDate !== currentDate) {
            currentDate = item._displayDate;
            const dateSeparator = createDateSeparator(currentDate, color);
            monthContent.appendChild(dateSeparator);
          }
          const itemElement = formatItemDisplay(item, color);
          monthContent.appendChild(itemElement);
        });
      }

      monthContent.style.display = isHidden ? 'block' : 'none';
      monthHeader.querySelector('.toggle').textContent = isHidden ? '▼' : '▶';
    };

    monthDiv.appendChild(monthHeader);
    monthDiv.appendChild(monthContent);
    return monthDiv;
  }

  function formatItemDisplay(item, color) {
    const itemDiv = document.createElement('div');
    itemDiv.style.cssText = 'font-size: 13px; color: #333; padding: 4px 8px; margin: 2px 0; background: #fff; border-radius: 3px; border-left: 2px solid ' + color + '; line-height: 1.4;';

    const itemContainer = document.createElement('div');
    itemContainer.style.cssText = 'display: flex; align-items: center; gap: 10px;';

    const idPart = document.createElement('span');
    idPart.style.cssText = 'min-width: 55px; font-weight: 600; color: #4A90E2; font-family: monospace;';
    idPart.textContent = `#${item.AutoID}`;

    const namePart = document.createElement('span');
    namePart.style.cssText = 'flex: 1; font-weight: 500; word-wrap: break-word;';
    namePart.textContent = item.Name;

    const statusPart = document.createElement('span');
    statusPart.style.cssText = 'min-width: 70px; font-weight: 600; text-align: center; font-size: 12px;';
    statusPart.innerHTML = app.ITEM_STATUS_SYSTEM.generateStatusHTML(item.IsPay, item.IsGet);

    const bidPart = document.createElement('span');
    bidPart.style.cssText = 'min-width: 180px; font-size: 12px; white-space: nowrap;';
    bidPart.innerHTML = app.BID_STATUS_SYSTEM.generateBidDisplay(item, 'inline');

    app.BID_STATUS_SYSTEM.applyContainerStyle(itemDiv, item);

    itemContainer.appendChild(idPart);
    itemContainer.appendChild(namePart);
    itemContainer.appendChild(statusPart);
    itemContainer.appendChild(bidPart);

    itemDiv.appendChild(itemContainer);

    app.ITEM_STATUS_SYSTEM.applyStatusStyle(itemDiv, item.IsPay, item.IsGet);

    return itemDiv;
  }

  function countItemsWithWinner(monthData) {
    let count = 0;
    Object.keys(monthData).forEach(day => {
      monthData[day].forEach(item => {
        // 判斷有得標者: WinnerID 存在，或競標中 (HasBids=true 且有 Bidder)
        if (item.WinnerID || (item.HasBids === true && item.Bidder)) {
          count++;
        }
      });
    });
    return count;
  }

  function generateQuarterlyView(dateData, title, color) {
    const section = document.createElement('div');
    section.style.cssText = 'margin-bottom: 30px; border: 1px solid #e0e0e0; border-radius: 8px; background: #f8f9fa;';

    const header = document.createElement('div');
    header.style.cssText = `background: ${color}; color: white; padding: 12px; font-size: 16px; font-weight: bold; border-radius: 7px 7px 0 0;`;
    header.textContent = title;

    const quarterInfo = document.createElement('div');
    quarterInfo.style.cssText = 'padding: 10px 15px; background: #fff3cd; border-bottom: 1px solid #e0e0e0; font-size: 13px; color: #856404;';
    quarterInfo.innerHTML = '📋 季度劃分: <strong>Q1(3-4月)</strong> | <strong>Q2(5-7月)</strong> | <strong>Q3(8-10月)</strong> | <strong>Q4(11-2月)</strong>';

    const content = document.createElement('div');
    content.style.cssText = 'padding: 20px;';

    const sortedYears = Object.keys(dateData).sort((a, b) => b - a);

    sortedYears.forEach(year => {
      const yearData = dateData[year];

      const yearHeader = document.createElement('div');
      yearHeader.style.cssText = 'font-size: 18px; font-weight: bold; color: #333; margin-bottom: 15px; margin-top: 20px;';
      yearHeader.textContent = `${year}年`;
      if (year === sortedYears[0]) yearHeader.style.marginTop = '0';

      let yearTotal = 0;
      Object.keys(yearData).forEach(month => {
        Object.keys(yearData[month]).forEach(day => {
          yearTotal += yearData[month][day].length;
        });
      });

      const yearTotalSpan = document.createElement('span');
      yearTotalSpan.style.cssText = 'font-size: 14px; color: #666; font-weight: normal; margin-left: 10px;';
      yearTotalSpan.textContent = `(總計: ${yearTotal}筆)`;
      yearHeader.appendChild(yearTotalSpan);

      const monthGrid = document.createElement('div');
      monthGrid.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;';

      const sortedMonths = Object.keys(yearData).sort((a, b) => a.localeCompare(b));

      sortedMonths.forEach(month => {
        const monthData = yearData[month];

        let monthTotal = 0;
        Object.keys(monthData).forEach(day => {
          monthTotal += monthData[day].length;
        });

        const monthBox = document.createElement('div');
        monthBox.style.cssText = `
          background: white;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 12px;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        `;

        const monthLabel = document.createElement('div');
        monthLabel.style.cssText = 'font-size: 14px; color: #666; margin-bottom: 5px;';
        monthLabel.textContent = month;

        const monthCount = document.createElement('div');
        monthCount.style.cssText = `font-size: 20px; font-weight: bold; color: ${color};`;

        // 如果是「競標結束時間分布」，額外顯示得標者數量
        if (title.includes('競標結束')) {
          const winnerCount = countItemsWithWinner(monthData);
          if (winnerCount > 0) {
            monthCount.innerHTML = `${monthTotal}筆<br><span style="font-size: 14px; color: #666; font-weight: normal;">(${winnerCount}筆得標)</span>`;
          } else {
            monthCount.textContent = `${monthTotal}筆`;
          }
        } else {
          monthCount.textContent = `${monthTotal}筆`;
        }

        monthBox.appendChild(monthLabel);
        monthBox.appendChild(monthCount);
        monthGrid.appendChild(monthBox);
      });

      content.appendChild(yearHeader);
      content.appendChild(monthGrid);
    });

    section.appendChild(header);

    // 只在「建立時間分布」顯示季度說明
    if (title.includes('建立時間')) {
      section.appendChild(quarterInfo);
    }

    section.appendChild(content);
    return section;
  }

  app.showHierarchicalModal = showHierarchicalModal;
})(window.FurnitureHelper = window.FurnitureHelper || {});
