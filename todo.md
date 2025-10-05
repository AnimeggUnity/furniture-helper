# 程式碼拆分建議 (content.js)

`content.js` 檔案過於龐大，包含了 UI、狀態管理、工具函數、核心邏輯等多種職責，違反了單一職責原則。這使得程式碼難以維護、閱讀和擴展。

我的核心哲學是追求簡潔和良好的 "品味"。一個超過 2000 行的檔案顯然缺乏品味。我們需要將其分解為更小、更專注的模組。

## 【核心判斷】

✅ **值得做**：拆分檔案是必要的。目前的單一檔案結構是個定時炸彈，任何修改都可能引發意想不到的副作用。一個好的架構始於清晰的檔案組織。

## 【關鍵洞察】

*   **資料結構與邏輯分離**: 程式碼中已經有了良好的雛形，如 `UI_COMPONENTS`, `ITEM_STATUS_SYSTEM` 等物件，它們是資料驅動的設計，但它們與操作它們的 UI 程式碼混在一起。
*   **複雜度**: 最大的複雜度來源於 UI 渲染和事件處理邏輯的混合。例如 `buildPanel` 函數，它既負責建立 DOM，又負責綁定複雜的事件。
*   **風險點**: 在單一檔案中修改任何一部分，都可能影響全域狀態或其它不相關的功能，因為它們都在同一個作用域內。

## 【Linus式方案】

我的建議是將程式碼按照職責進行拆分，建立一個清晰的目錄結構。這不是為了理論上的優雅，而是為了實用性——讓未來的開發和除錯更簡單直接。

### 建議的目錄結構

```
.
├── content.js           # 主入口，負責初始化和訊息監聽
├── inject.js
├── manifest.json
├── README.md
├── icon.png
├── todo.md
├── config/
│   ├── constants.js     # 放置 APP_CONSTANTS
│   └── mappings.js      # 放置 CATEGORY_MAPPING
├── core/
│   ├── errorHandler.js  # 放置 ERROR_HANDLER
│   └── messageHandler.js# 放置 messageHandlers 和事件監聽器
├── state/
│   ├── appState.js      # 放置 FurnitureHelper 狀態對象
│   ├── bidStatus.js     # 放置 BID_STATUS_SYSTEM
│   └── itemStatus.js    # 放置 ITEM_STATUS_SYSTEM
├── ui/
│   ├── styles.js        # 放置 UI_COMPONENTS, COMPONENT_VARIANTS 等
│   ├── buttons.js       # 放置 insertButtons
│   ├── notifications.js # 放置 showNotification
│   └── components/
│       ├── dataPanel.js         # 放置 buildPanel
│       ├── deleteModal.js       # 放置 showDeleteConfirmationModal
│       ├── importModal.js       # 放置 showImportModal, handleRemoteQuickImport
│       ├── photoPreview.js      # 放置 showPhotoPreview
│       ├── settingsPanel.js     # 放置 showSettingsPanel
│       └── statsModal.js        # 放置 showHierarchicalModal, createStatsTree 等
└── utils/
    ├── api.js           # 放置 uploadImage, directSubmitToAPI
    ├── csv.js           # 放置 exportToCSV, exportAllToCSV
    ├── image.js         # 放置 convertImageToBase64, base64ToFile
    └── scroll.js        # 放置 safeScrollIntoView
```

### 執行步驟

1.  **建立目錄**: 建立 `config`, `core`, `state`, `ui`, `ui/components`, `utils` 目錄。
2.  **拆分檔案**: 將 `content.js` 的程式碼塊按照上述結構，分別移動到對應的新檔案中。
3.  **模組化**: 每個新檔案將使用 IIFE (立即調用函數表達式) 模式，將其功能附加到一個共享的 `FurnitureHelper` 命名空間上，以避免污染全域作用域。
4.  **修改 `manifest.json`**: 更新 `manifest.json`，在 `content_scripts` 中按正確的依賴順序載入所有新的 Javascript 檔案。
5.  **簡化 `content.js`**: `content.js` 將只保留最核心的啟動邏輯，例如注入 `inject.js` 和初始化事件監聽。

這個方案的目標是讓每個檔案只做一件事，並且做得好。這會讓程式碼庫更健康，也更符合我的標準。
