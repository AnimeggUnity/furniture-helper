
((app) => {
  // 刪除確認對話框
  function showDeleteConfirmationModal(selectedItems) {
    const deleteModal = document.createElement('div');
    deleteModal.id = 'delete-confirmation-modal';
    deleteModal.style.cssText = app.applyComponentVariant('modal', 'medium') + 'z-index: 10003;';

    deleteModal.innerHTML = `
      <h3 style="margin: 0 0 20px 0; color: #dc3545; font-size: 20px;">🗑️ 批次刪除確認</h3>

      <div style="background: #f8d7da; border: 1px solid #f5c2c7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
          <span style="font-size: 24px;">⚠️</span>
          <h4 style="margin: 0; color: #721c24; font-size: 18px;">危險操作警告</h4>
        </div>
        <p style="margin: 0 0 10px 0; color: #721c24; font-size: 16px; font-weight: bold;">
          您即將刪除 <span style="color: #dc3545; font-size: 20px;">${selectedItems.length}</span> 個項目
        </p>
        <p style="margin: 0; color: #721c24; font-size: 16px;">
          此操作<strong>無法撤銷</strong>，請確認您真的要執行此操作。
        </p>
      </div>

      <div style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; border-radius: 8px; margin-bottom: 20px; max-height: 300px; overflow-y: auto;">
        <h4 style="margin: 0 0 10px 0; color: #495057; font-size: 16px;">即將刪除的項目：</h4>
        <div id="delete-items-list">
          ${selectedItems.map((item, index) => `
            <div style="padding: 8px; border-bottom: 1px solid #dee2e6; display: flex; align-items: center; gap: 10px; background: ${index % 2 === 0 ? '#ffffff' : '#f8f9fa'};">
              <span style="color: #dc3545; font-weight: bold; font-size: 16px;">[${item.AutoID}]</span>
              <span style="flex: 1; font-size: 16px;">${item.Name || '未命名'}</span>
              <span style="font-size: 14px; color: #6c757d;">${item.CategoryName || ''}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 16px; color: #856404;">
          <strong>請再次確認：</strong>刪除後這些項目將從系統中永久移除，無法恢復。
        </p>
      </div>

      <div style="display: flex; justify-content: space-between; gap: 15px;">
        <button id="cancel-delete" style="${app.applyComponentVariant('button', 'default', 'secondary')}">
          取消
        </button>
        <button id="confirm-delete" style="${app.applyComponentVariant('button', 'default', 'danger')} font-weight: bold;">
          確認刪除 ${selectedItems.length} 個項目
        </button>
      </div>
    `;

    document.body.appendChild(deleteModal);

    const confirmBtn = deleteModal.querySelector('#confirm-delete');
    const cancelBtn = deleteModal.querySelector('#cancel-delete');

    confirmBtn.onclick = async () => {
      deleteModal.remove();
      await processBatchDelete(selectedItems);
    };

    cancelBtn.onclick = () => deleteModal.remove();

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        deleteModal.remove();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
  }

  async function processBatchDelete(selectedItems) {
    app.showNotification(`開始批次刪除 ${selectedItems.length} 個項目...`, 'info');

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < selectedItems.length; i++) {
      const item = selectedItems[i];
      try {
        app.showNotification(`正在刪除項目 ${i + 1}/${selectedItems.length}: ${item.Name}`, 'info', 2000);
        await app.deleteProductAPI(item);
        successCount++;
        console.log(`✅ 刪除成功 ${i + 1}/${selectedItems.length}: ${item.Name}`);
      } catch (error) {
        errorCount++;
        errors.push({ name: item.Name, error: error.message });
        console.error(`❌ 刪除失敗 ${i + 1}/${selectedItems.length}: ${item.Name} - ${error.message}`);
        app.showNotification(`項目 ${item.Name} 刪除失敗: ${error.message}`, 'error', 3000);
      }

      if (i < selectedItems.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const message = `批次刪除完成！成功: ${successCount} 項，失敗: ${errorCount} 項`;
    if (errorCount === 0) {
      app.showNotification(message, 'success', 5000);
    } else if (successCount === 0) {
      app.showNotification(message, 'error', 5000);
    } else {
      app.showNotification(message, 'warning', 5000);
    }

    if (successCount > 0) {
      setTimeout(() => {
        const queryBtn = Array.from(document.querySelectorAll('button.el-button')).find(b => /查\s*詢/.test(b.textContent));
        if (queryBtn) {
          try {
            if (queryBtn.__vue__ && queryBtn.__vue__.$emit) {
              queryBtn.__vue__.$emit('click');
            } else {
              const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
              queryBtn.dispatchEvent(clickEvent);
            }
            console.log('批次刪除完成，已刷新資料');
          } catch (error) {
            console.error('刷新資料時發生錯誤:', error);
          }
        }
      }, 2000);
    }
  }

  app.showDeleteConfirmationModal = showDeleteConfirmationModal;
})(window.FurnitureHelper = window.FurnitureHelper || {});
