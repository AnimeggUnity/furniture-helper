# 正確的文件總覽

此文件總結了「家具助手」擴充功能當前所有正確且相關的文件。過時或不正確的文件已被移至 `del` 資料夾。

## 主要文件

- **`PROJECT_BACKUP_SUMMARY.md`**: 提供專案的核心功能、架構和關鍵函數的高層次概覽。
- **`FEATURE_PACKAGED_DOWNLOAD.md`**: 解釋「打包下載」功能，此功能會將產品資料和以 Base64 編碼的圖片打包到一個 JSON 檔案中以供備份。

## 功能性文件 (`docs/useful/`)

- **`README.md`**: `useful` 資料夾中的主要說明檔案，概述了關鍵功能。
- **`API_ANALYSIS_RESULTS.md`**: 記錄了用於獲取競標紀錄的正確 API 端點 (`api/Product/GetBidLog`)，這對資料面板功能至關重要。
- **`BID_LOG_FEATURE.md`**: 詳細說明了在資料面板中直接顯示競標紀錄功能的實現，與 `inject.js` 中的目前程式碼相符。
- **`INTEGRATION_GUIDE.md`**: 提供了整合競標紀錄功能的確切程式碼片段，反映了目前的實作方式。
- **`JSON_IMPORT_FEATURE.md`**: 描述了匯入 JSON 檔案以填寫新增/編輯表單的功能，包括處理下拉式選單的邏輯，這部分存在於 `content.js` 中。
- **`ONE_CLICK_IMPORT_FEATURE.md`**: 解釋了「一鍵匯入」功能，該功能會繞過使用者介面，直接將資料提交到後端 API。
- **`ONE_CLICK_UPLOAD_FEATURE.md`**: 詳細說明了「一鍵上傳」流程，即使用帶有 Base64 圖片的打包 JSON 自動填寫表單並上傳圖片。
- **`OPTIMIZED_UPLOAD_FEATURE.md`**: 描述了圖片上傳功能的優化版本，如 `content.js` 中所見，使用 `fetch` 和 `Promise.all` 以提高效能。

## 測試指南 (`docs/useful/`)

- **`PACKAGE_DOWNLOAD_TEST.md`**: 「打包下載」功能的測試指南。
- **`ONE_CLICK_UPLOAD_TEST.md`**: 「一鍵上傳」功能的測試指南。
- **`UPLOAD_FIX_TEST.md`**: 針對圖片上傳和預覽功能的特定修復的測試指南。
