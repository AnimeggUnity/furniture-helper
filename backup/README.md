# 新北再生家具 - 年度統計 Chrome 擴充功能
# New Taipei Recycled Furniture - Annual Statistics Chrome Extension

## 專案簡介 | Project Description

這是一個 Chrome 擴充功能，用於統計新北市再生家具網站的每月和年度資料筆數，並提供資料匯出、列印與 JSON 匯入功能。本擴充功能可以幫助使用者快速了解網站上的資料分布情況，並方便地匯出、列印所需資料。

This is a Chrome extension that provides statistics for monthly and annual data counts on the New Taipei City Recycled Furniture website, with data export, printing and JSON import capabilities. This extension helps users quickly understand data distribution on the website and conveniently export, print required data.

## 功能特點 | Features

### 📊 資料統計
- **年度/月份統計**
  - 自動計算並顯示每月和每年的資料筆數
  - 以彈出視窗方式呈現統計結果
  - 支援按年份和月份排序

### 📥 資料匯出
- **輕量匯出**：包含基本欄位（編號、名稱、行政區、建立日期）
- **全部匯出**：包含完整資料欄位（編號、名稱、類別、行政區、建立日期、產品描述、尺寸、交貨地點、起標價格、原價）
- **CSV 格式**：支援 Excel 開啟的標準格式

### 🖨️ 表格列印
- **列印友善設計**：專為列印優化的頁面佈局
- **完整欄位**：自動編號、家具名稱、類別名稱、行政區名稱、結束日期、應付金額
- **自動格式化**：日期格式化和金額千分位符號
- **智慧處理**：自動處理空值和物件結構

### 📷 圖片預覽
- **大圖預覽**：400x400px 高品質圖片顯示
- **全螢幕查看**：點擊圖片可全螢幕查看細節
- **互動效果**：滑鼠懸停放大效果
- **多圖支援**：支援多張圖片切換瀏覽

### 🔍 搜尋功能
- **AutoID 搜尋**：支援編號快速搜尋
- **即時過濾**：即時顯示搜尋結果
- **視覺回饋**：搜尋結果高亮顯示

### 📦 單筆資料下載
- **JSON 格式**：下載單筆資料的完整 JSON 檔案
- **圖片下載**：自動下載相關圖片檔案
- **檔案命名**：使用家具名稱自動命名檔案
- **打包下載**：將商品所有圖片轉換為 Base64 編碼，打包到單一 JSON 檔案中

### 📋 JSON 匯入
- **表單自動填入**：支援 JSON 格式資料匯入
- **欄位驗證**：自動驗證必要欄位
- **錯誤處理**：友善的錯誤提示訊息
- **一鍵上傳**：支援打包 JSON 檔案，自動上傳 Base64 圖片並建立預覽
- **自動裁切**：自動處理網站內建的圖片裁切介面，完全自動化流程

## 技術架構 | Technical Architecture

- **Chrome Extension Manifest V3**
  - 使用最新的擴充功能架構
  - 支援現代瀏覽器安全特性

- **Content Script 注入**
  - 與網頁進行無縫整合
  - 確保功能穩定運行

- **Vue.js 整合**
  - 與網頁 Vue 實例進行資料交換
  - 確保資料即時更新

- **資料格式支援**
  - CSV 格式匯出
  - JSON 格式匯入/匯出
  - HTML 列印格式
  - 圖片檔案下載

## 安裝方式 | Installation

1. 下載此專案
   ```bash
   git clone [repository-url]
   ```

2. 開啟 Chrome 瀏覽器
   - 進入擴充功能頁面 (chrome://extensions/)
   - 開啟右上角的「開發人員模式」

3. 載入擴充功能
   - 點選「載入未封裝項目」
   - 選擇專案資料夾

## 使用方式 | Usage

### 基本操作
1. 前往新北市再生家具網站
   - 網址：https://recycledstuff.ntpc.gov.tw/BidMgr/

2. 使用擴充功能按鈕
   - 📈 年度統計：查看每月/年度資料統計
   - 📥 輕量匯出：匯出基本資料欄位
   - 📥 全部匯出：匯出完整資料欄位
   - 🖨️ 列印表格：列印包含應付金額的表格
   - 📂 資料面板：開啟單筆資料下載面板

### 進階功能
- **圖片預覽**：點擊資料面板中的 📦 圖示
- **打包下載**：點擊資料面板中的「打包下載」按鈕，將商品圖片轉為 Base64 並打包下載
- **JSON 匯入**：在編輯視窗中點擊「匯入 JSON」按鈕
- **一鍵上傳**：選擇打包的 JSON 檔案，自動上傳圖片並建立預覽
- **自動裁切**：自動處理圖片裁切介面，無需手動操作
- **搜尋功能**：在資料面板中輸入 AutoID 進行搜尋

## 開發者工具 | Developer Tools

### 除錯指令
在瀏覽器控制台 (F12 → Console) 中執行以下指令：

#### 1. 查看完整欄位清單
```javascript
window.postMessage({ source: 'run-vue-debug-fields' }, window.location.origin);
```
**功能**：顯示所有可用的資料欄位及其資料類型

#### 2. 分析 Payment 物件
```javascript
window.postMessage({ source: 'run-vue-payment-analysis' }, window.location.origin);
```
**功能**：分析 Payment 物件中的價格相關欄位（TotalAmount、PayAmount）

#### 3. 分析 WinnerID 欄位
```javascript
window.postMessage({ source: 'run-vue-winner-analysis' }, window.location.origin);
```
**功能**：分析得標者相關欄位，顯示 WinnerID、Account、NickName 等資訊

### 資料欄位說明
- **AutoID**: 自動編號（主要識別碼）
- **Name**: 家具名稱
- **CategoryName**: 類別名稱
- **DistName**: 行政區名稱
- **CreateDate**: 建立日期
- **EndDate**: 結束日期
- **Payment**: 付款物件（包含 TotalAmount、PayAmount 等）
- **WinnerID**: 得標者ID（數字）
- **Account**: 得標者帳號
- **NickName**: 得標者暱稱

## 開發者資訊 | Developer Information

- **版本**：1.0
- **支援網站**：https://recycledstuff.ntpc.gov.tw/BidMgr/*
- **權限需求**：僅需要目標網站的存取權限
- **相容性**：Chrome 88.0 或更新版本

## 授權條款 | License

MIT License

## 貢獻指南 | Contributing

歡迎提交 Pull Request 或開立 Issue 來協助改進此專案。在提交之前，請確保：

1. 程式碼符合專案規範
2. 新增功能包含適當的測試
3. 更新相關文件

## 注意事項 | Notes

- 本擴充功能僅供新北市再生家具網站使用
- 請確保您的瀏覽器已更新至最新版本
- 使用時請遵守相關網站的使用條款
- 建議定期備份匯出的資料
- 列印功能會在新視窗中開啟，請允許彈出視窗
- 除錯指令僅供開發者使用，一般使用者無需使用

## 聯絡方式 | Contact

如有任何問題或建議，歡迎透過以下方式聯絡：

- 開立 GitHub Issue
- 發送 Pull Request
- 聯絡開發團隊

---

*最後更新：2024-03-21* 