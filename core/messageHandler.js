
((app) => {
  let loadingOverlay = null;

  const messageHandlers = {
    'vue-stats': (msg) => {
      if (!msg.hierarchicalStats) {
        app.showNotification('數據格式錯誤', 'error');
        return;
      }
      app.showHierarchicalModal(msg.hierarchicalStats);
    },
    'vue-panel-data': (msg) => app.buildPanel(msg.data || []),
    'vue-print-loading': () => showPrintLoading(),
    'vue-print': (msg) => {
      hidePrintLoading();
      printTable(msg.data || []);
    }
  };

  function showPrintLoading() {
    if (loadingOverlay) return;

    loadingOverlay = document.createElement('div');
    loadingOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      color: white;
      font-family: 'Microsoft JhengHei', sans-serif;
    `;

    const spinner = document.createElement('div');
    spinner.style.cssText = `
      border: 8px solid #f3f3f3;
      border-top: 8px solid #007baf;
      border-radius: 50%;
      width: 60px;
      height: 60px;
      animation: spin 1s linear infinite;
    `;

    const text = document.createElement('div');
    text.textContent = '正在載入競標資料，請稍候...';
    text.style.cssText = 'margin-top: 20px; font-size: 18px; font-weight: bold;';

    loadingOverlay.appendChild(spinner);
    loadingOverlay.appendChild(text);

    // 添加動畫
    const style = document.createElement('style');
    style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
    document.head.appendChild(style);

    document.body.appendChild(loadingOverlay);
  }

  function hidePrintLoading() {
    if (loadingOverlay) {
      loadingOverlay.remove();
      loadingOverlay = null;
    }
  }

  function initializeMessageListener() {
    window.addEventListener('message', event => {
      if (event.source !== window || event.origin !== window.location.origin) return;
      
      const msg = event.data;
      if (!msg || !msg.source) {
        console.error('無效的消息格式', msg);
        return;
      }

      const handler = messageHandlers[msg.source];
      if (handler) {
        handler(msg);
      }
    });
  }

  function printTable(data = []) {
    if (!data.length) {
      app.showNotification('沒有資料可列印', 'warning');
      return;
    }

    function formatDate(dateString) {
      if (!dateString) return '無';
      const date = new Date(dateString);
      return date.toISOString().slice(0, 10);
    }

    function formatCurrency(amount) {
      if (!amount && amount !== 0) return '無';
      return new Intl.NumberFormat('zh-TW').format(amount);
    }

    function getTotalAmount(payment) {
      if (!payment || typeof payment !== 'object') return null;
      return payment.TotalAmount;
    }

    function getWinnerInfo(row) {
      // 如果有競標資料，顯示最高出價者
      if (row.HasBids === true && row.BidPrice && row.Bidder) {
        return {
          text: `${row.Bidder} ($${formatCurrency(row.BidPrice)})`,
          cssClass: 'bidding'
        };
      }

      // 如果明確標記無競標
      if (row.HasBids === false) {
        return {
          text: '無競標',
          cssClass: 'no-bid'
        };
      }

      // 已得標情況 (有 WinnerID)
      if (row.WinnerID) {
        const nickName = row.NickName || '';
        const account = row.Account || '';

        let displayName;
        if (nickName && account) {
          displayName = `${nickName}(${account})`;
        } else if (nickName) {
          displayName = nickName;
        } else if (account) {
          displayName = account;
        } else {
          displayName = `ID: ${row.WinnerID}`;
        }

        return {
          text: displayName,
          cssClass: 'won'
        };
      }

      // 預設
      return {
        text: '無得標者',
        cssClass: 'no-bid'
      };
    }

    const printData = data
      .sort((a, b) => b.AutoID - a.AutoID)
      .map(row => {
        const winnerInfo = getWinnerInfo(row);
        return {
          AutoID: row.AutoID || '無',
          Name: row.Name || '未命名',
          CategoryName: row.CategoryName || '無',
          DistName: row.DistName || '無',
          EndDate: formatDate(row.EndDate),
          TotalAmount: formatCurrency(getTotalAmount(row.Payment)),
          Winner: winnerInfo.text,
          WinnerClass: winnerInfo.cssClass
        };
      });

    const printHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>新北市再生家具資料表</title>
    <style>
        @media print {
            body { margin: 0; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; }
            .no-print { display: none; }
        }
        
        body {
            font-family: 'Microsoft JhengHei', 'Segoe UI', sans-serif;
            margin: 20px;
            font-size: 12px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 18px;
            color: #333;
        }
        
        .header p {
            margin: 5px 0;
            color: #666;
            font-size: 11px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
            vertical-align: top;
        }
        
        th {
            background-color: #f5f5f5;
            font-weight: bold;
            font-size: 11px;
        }
        
        td {
            font-size: 11px;
        }
        
        .auto-id { width: 80px; }
        .name { width: 200px; }
        .category { width: 100px; }
        .district { width: 80px; }
        .end-date { width: 100px; }
        .total-amount { width: 100px; }
        .winner { width: 150px; }

        .bidding {
            color: #0056b3;
            font-weight: bold;
            background-color: #f8f9ff;
            padding: 2px 4px;
            border-radius: 3px;
        }

        .no-bid {
            color: #856404;
        }

        .won {
            color: #155724;
            font-weight: 600;
        }
        
        .no-print {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #007baf;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            z-index: 1000;
        }
    </style>
</head>
<body>
    <div class="no-print" onclick="window.print()">列印</div>
    
    <div class="header">
        <h1>新北市再生家具資料表</h1>
        <p>匯出時間：${new Date().toLocaleString('zh-TW')}</p>
        <p>資料筆數：${printData.length} 筆</p>
    </div>
    
    <table>
        <thead>
            <tr>
                <th class="auto-id">自動編號</th>
                <th class="name">家具名稱</th>
                <th class="category">類別名稱</th>
                <th class="district">行政區</th>
                <th class="end-date">結束日期</th>
                <th class="total-amount">應付金額</th>
                <th class="winner">競標狀態</th>
            </tr>
        </thead>
        <tbody>
            ${printData.map(row => `
                <tr>
                    <td>${row.AutoID}</td>
                    <td>${row.Name}</td>
                    <td>${row.CategoryName}</td>
                    <td>${row.DistName}</td>
                    <td>${row.EndDate}</td>
                    <td>${row.TotalAmount}</td>
                    <td class="${row.WinnerClass}">${row.Winner}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printHTML);
    printWindow.document.close();
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  }

  app.initializeMessageListener = initializeMessageListener;
})(window.FurnitureHelper = window.FurnitureHelper || {});
