# AI 輔助開發說明檔 (GEMINI.md)

## 1. 專案核心目標

本專案是一個 Chrome 擴充功能，旨在輔助操作「新北市再生家具」後台管理系統。核心目標是解決手動操作效率低下的問題，透過**直接呼叫後端 API** 和**自動化腳本**來實現資料的快速獲取、分析與處理。

---

## 2. 程式碼架構與設計理念

本擴充功能採用了標準的**內容腳本 (`content.js`)** 與 **頁面注入腳本 (`inject.js`)** 的分離模式，以安全、有效地與目標網站的 Vue.js 環境互動。

### 2.1. `content.js` - UI 控制與使用者互動層

`content.js` 是擴充功能的「大腦」和「門面」，它負責所有使用者介面的建立、事件處理和與 `inject.js` 的通訊。

- **職責**:
    1.  **UI 注入**: 動態建立所有功能按鈕 (如「年度統計」、「資料面板」) 和互動面板。
    2.  **使用者事件監聽**: 處理使用者對這些 UI 元素的點擊操作。
    3.  **通訊中樞 (發送指令)**: 將使用者的操作意圖，透過 `window.postMessage` 發送成明確的指令 (如 `run-vue-stats`) 給 `inject.js`。
    4.  **通訊中樞 (接收資料)**: 監聽從 `inject.js` 回傳的訊息，獲取處理後的資料。
    5.  **資料渲染與互動**: 將從 `inject.js` 收到的資料，渲染成可視化的圖表、CSV 檔案、或互動面板。同時，也包含處理複雜 UI 互動的邏輯 (如 JSON 匯入)。

- **關鍵實現策略與原因**:
    - **UI 注入時機 (`MutationObserver`)**: 由於目標網站是動態的單頁應用 (SPA)，按鈕需要被插入的容器在腳本首次執行時可能尚未載入。因此，程式使用 `MutationObserver` 來監聽 DOM 的變化，確保只在目標容器出現後，才執行按鈕的插入操作。這是與現代前端框架網站互動的**最佳實踐**，比 `setInterval` 輪詢更高效、更可靠。

### 2.2. `inject.js` - 資料存取與 API 呼叫層

`inject.js` 是一個「橋樑」，它被注入到目標網頁自身的 JavaScript 執行環境中，因此擁有存取頁面全域變數 (特別是 Vue 實例) 的能力。

- **職責**:
    1.  **存取 Vue 實例**: 它的核心任務是找到並存取頁面中的 Vue 根實例，從而獲取原始的、未經渲染的表格資料 (`tableFullData`)。
    2.  **執行指令**: 監聽從 `content.js` 發來的指令。
    3.  **資料處理/API 呼叫**: 根據指令對 Vue 資料進行處理 (如統計、篩選)，或代表頁面發起 API 請求。
    4.  **回傳資料**: 將處理完畢的資料，透過 `window.postMessage` 回傳給 `content.js` 進行渲染。

- **關鍵實現策略與原因**:
    - **尋找 Vue 實例**: 程式透過 `document.querySelector('.vxe-table').__vue__` 開始，然後向上遍歷父組件 (`$parent`)，直到找到持有 `tableFullData` 陣列的那個 Vue 實例。這是一種「逆向工程」的手段，雖然依賴於前端的具體實現，但在沒有原始碼的情況下是直接且有效的。
    - **從 `inject.js` 呼叫 API (`fetchBidLog`)**: 這是為了**處理使用者認證**。從 `inject.js` 中發起的 `fetch` 請求，會自動攜帶使用者登入後瀏覽器儲存的 session cookie。這使得 API 呼叫能順利通過伺服器的身分驗證，無需在擴充功能中複雜地管理 token 或 cookie。
    - **將 XHR 封裝成 Promise**: `fetchBidLog` 函數將傳統的 `XMLHttpRequest` 封裝在一個 `Promise` 中。這樣做是為了讓主邏輯可以使用更現代、更清晰的 `async/await` 語法來處理非同步的 API 呼叫，提高了程式碼的可讀性和可維護性。

---

## 3. 核心功能詳解

### 3.1. 已驗證的 API 端點

- **功能**: 獲取指定商品的完整競標紀錄 (Bid Log)。
- **方法**: `GET`
- **端點**: `api/Product/GetBidLog`
- **必要參數**: `id` (商品的 UUID，**非 AutoID**)。
- **實現位置**: `inject.js` 中的 `fetchBidLog` 函數。

### 3.2. 競標紀錄分析 (資料面板)

- **目標**: 無需手動點開彈出視窗，直接獲取所有商品的最高出價紀錄。
- **實現流程**:
    1.  (`content.js`) 使用者點擊「資料面板」按鈕。
    2.  (`content.js`) 發送 `run-vue-panel` 指令給 `inject.js`。
    3.  (`inject.js`) 接收指令，獲取所有商品的 `UUID`。
    4.  (`inject.js`) 異步地為每個 `UUID` 呼叫 `fetchBidLog` API。
    5.  (`inject.js`) 處理回傳資料，找出最高價及出價者，並將包含競標資訊的完整資料回傳給 `content.js`。
    6.  (`content.js`) 接收資料，並使用 `buildPanel` 函數建立側邊面板 UI。
- **關鍵策略 - UUID 與欄位映射**: 為了應對後端欄位名不統一的問題，程式在提取 `UUID`、`BidPrice` 和 `Bidder` 時，使用了 `||` 運算符來嘗試多個可能的欄位名稱，增強了程式的穩健性。

### 3.3. JSON 匯入功能 (穩定版)

- **目標**: 讓使用者可以匯入 JSON 檔案，自動、可靠地填寫「新增/編輯」表單。
- **遇到的挑戰與最終解決方案**:
    1.  **挑戰：非同步 UI 操作衝突**。
        - **狀況**: 在同一個事件迴圈中，同時對「類別」和「行政區」等多個複雜的 Element UI 下拉選單 (`el-select`) 進行模擬點擊，會導致它們的下拉層互相干擾，使得後續的點擊操作在一個不可見或過時的 DOM 元素上執行，從而導致失敗（特別是在第二次及以後的操作中）。
        - **最終解決方案 (串行執行)**: `content.js` 中的 `fillForm` 函數被重構為 `async` 函數。它將所有需要操作的表單欄位進行分類，然後使用 `for...of` 迴圈配合 `await`，來確保一次只處理一個複雜的下拉選單。腳本會**等待**前一個下拉選單的「點擊 -> 延遲 -> 尋找選項 -> 點擊選項」的完整非同步流程結束後，**才開始**下一個欄位的處理。這徹底消除了競爭條件，是確保複雜 UI 自動化腳本穩定性的**關鍵**。

    2.  **挑戰：動態渲染的時序問題**。
        - **狀況**: 日期選擇器這類元件的彈出和渲染需要時間，使用固定的 `setTimeout` 延遲並不可靠。
        - **最終解決方案 (動態輪詢)**: 在處理「拍賣期間」欄位時，腳本採用了輪詢檢查機制 (`checkForDatePicker`)。它會反覆、多次地去尋找日期選擇器中的「現在」按鈕，直到找到為止，或在超時後執行備用方案。這比固定的延遲更具彈性和健壯性。

### 3.4. 得標者資訊顯示 (列印功能)

- **目標**: 在列印表格中，顯示有意義的得標者名稱，而非數字 ID。
- **解決方案**: 透過分析 `inject.js` 獲取的完整資料結構，發現 `WinnerID` (數字) 與 `Account` (帳號) 和 `NickName` (暱稱) 欄位相關聯。`content.js` 中的 `getWinnerInfo` 函數利用此關聯，優先顯示 `暱稱(帳號)`，從而提供更佳的使用者體驗。

### 3.5. 圖片上傳功能

- **目標**: 提供將 Base64 圖片資料轉換為可上傳的檔案物件，並透過 API 上傳至後端伺服器的功能。
- **實現位置**: `content.js` 中的 `convertImageToBase64`、`base64ToFile` 和 `uploadImage` 函數。
- **關鍵策略**:
    - `convertImageToBase64`: 將圖片 URL 轉換為 Base64 格式，處理跨域問題。
    - `base64ToFile`: 將 Base64 字串轉換為 `File` 物件，以便於 `FormData` 上傳。
    - `uploadImage`: 負責實際的圖片上傳，目標 API 為 `https://recycledstuff.ntpc.gov.tw/BidMgr/api/Product/UploadFile`，使用 `FormData` 攜帶 `file` 參數，並自動處理瀏覽器認證（session cookie）。

### 3.6. 圖片預覽功能

- **目標**: 在匯入 JSON 資料後，動態顯示已上傳的圖片預覽。
- **實現位置**: `content.js` 中的 `showPhotoPreview` 函數。
- **關鍵策略**: 該功能會建立一個模態視窗，顯示所有圖片的縮圖，並支援點擊放大查看。

### 3.7. 直接匯入功能

- **目標**: 允許使用者選擇包含 Base64 圖片資料的 JSON 檔案，並直接透過 API 將資料提交到後端，無需手動填寫表單。
- **實現位置**: `content.js` 中的 `quickImportBtn` 的點擊事件處理函數，以及 `directSubmitToAPI` 和 `uploadImagesWithCorrectAPI` 函數。
- **關鍵策略**:
    - **日期自動更新**: 自動將 JSON 中的日期欄位 (`StartDate`, `EndDate`) 更新為當前日期和未來 14 天，以符合 API 格式要求。
    - **圖片處理**: 呼叫 `uploadImagesWithCorrectAPI` 函數，將 JSON 中包含的 Base64 圖片資料轉換為檔案並上傳，然後將返回的圖片路徑添加到提交的 `payload` 中。
    - **API 端點**: 提交資料至 `/BidMgr/api/Product/AddProduct`。
    - **自動刷新**: 成功提交後，自動觸發查詢按鈕以刷新頁面表格。

### 3.8. 遠端匯入功能

- **目標**: 允許使用者從遠端伺服器獲取 JSON 檔案清單，並選擇性地匯入單筆資料。
- **實現位置**: `content.js` 中的 `remoteQuickImportBtn` 的點擊事件處理函數，以及 `handleRemoteQuickImport`、`buildRemoteImportSelectionPanel` 和 `handleSingleRemoteImport` 函數。
- **關鍵策略**:
    - **遠端清單獲取**: 從 `https://580.blias.com/daobo/files.php?format=json` 獲取可匯入的 JSON 檔案清單。
    - **選擇面板**: 建立一個側邊面板，顯示遠端檔案清單，支援搜尋和單筆匯入操作。
    - **單筆匯入處理**: `handleSingleRemoteImport` 函數負責下載選定的遠端 JSON 檔案，更新日期格式，並呼叫 `directSubmitToAPI` 進行提交。

---

## 4. 不可行方案 (歷史決策)

- **方案**: 模擬使用者操作，自動點擊按鈕打開彈出視窗，再從中抓取資料。
- **問題**: 此方法流程繁瑣、效率低下、且極易因網站 UI 的微小變動而失效。
- **結論**: 基於上述缺點，此方案被**廢棄**，改為採用更穩定、更高效的**直接 API 呼叫**方案來獲取競標數據。
