
((app) => {
  function showPhotoPreview(photos) {
    let modal = document.getElementById('photo-preview-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'photo-preview-modal';

      modal.style.cssText = app.applyComponentVariant('modal', 'photo');
      modal.innerHTML = `
        <span style="${app.UI_COMPONENTS.closeButton.base}color:#666;"
              onclick="this.parentNode.style.display='none'">X</span>
        <h3 style="margin-top:0; margin-bottom:20px; color:#007baf; font-size:20px;">圖片預覽</h3>
        <div id="photo-preview-container" style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center;"></div>
      `;
      document.body.appendChild(modal);
    }

    const container = modal.querySelector('#photo-preview-container');
    container.innerHTML = '';
    if (photos && Array.isArray(photos) && photos.length > 0) {
      photos.forEach((photo, index) => {
        const imgWrapper = document.createElement('div');
        imgWrapper.style.cssText = `
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        `;
        
        const img = document.createElement('img');
        img.src = photo.Photo;
        img.style.cssText = `
          max-width: 400px;
          max-height: 400px;
          width: auto;
          height: auto;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          cursor: pointer;
        `;
        img.alt = `Photo ${index + 1}`;
        
        const imgLabel = document.createElement('div');
        imgLabel.textContent = `圖片 ${index + 1}`;
        imgLabel.style.cssText = `
          font-size: 12px;
          color: #666;
          font-weight: bold;
        `;
        
        imgWrapper.appendChild(img);
        imgWrapper.appendChild(imgLabel);
        container.appendChild(imgWrapper);
      });
    } else {
      container.innerHTML = '<p style="color:#666; font-size:16px;">無圖片可顯示</p>';
    }
    modal.style.display = 'block';
  }

  app.showPhotoPreview = showPhotoPreview;
})(window.FurnitureHelper = window.FurnitureHelper || {});
