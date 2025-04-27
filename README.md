# 新北再生家具 - 年度統計 Chrome 擴充功能
# New Taipei Recycled Furniture - Annual Statistics Chrome Extension

## 專案簡介 | Project Description

這是一個 Chrome 擴充功能，用於統計新北市再生家具網站的每月和年度資料筆數，並提供資料匯出與 JSON 匯入功能。本擴充功能可以幫助使用者快速了解網站上的資料分布情況，並方便地匯出所需資料。

This is a Chrome extension that provides statistics for monthly and annual data counts on the New Taipei City Recycled Furniture website, with data export and JSON import capabilities. This extension helps users quickly understand data distribution on the website and conveniently export required data.

## 功能特點 | Features

- 📊 **年度/月份統計**
  - 自動計算並顯示每月和每年的資料筆數
  - 以彈出視窗方式呈現統計結果
  - 支援按年份和月份排序

- 📥 **資料匯出**
  - 支援 CSV 格式匯出
  - 包含完整資料欄位（編號、名稱、行政區、建立日期等）
  - 可選擇匯出單筆或全部資料

- 📷 **圖片預覽**
  - 支援家具相關圖片預覽
  - 彈出式圖片瀏覽介面
  - 支援多張圖片切換

- 🔍 **搜尋功能**
  - 支援 AutoID 搜尋
  - 即時過濾顯示結果
  - 方便快速定位特定資料

- 📦 **單筆資料下載**
  - 可下載單筆資料的 JSON 檔案
  - 自動下載相關圖片
  - 保持原始資料格式

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

1. 前往新北市再生家具網站
   - 網址：https://recycledstuff.ntpc.gov.tw/BidMgr/

2. 使用擴充功能
   - 點選擴充功能圖示
   - 選擇需要的功能（統計、匯出等）

3. 資料操作
   - 查看統計結果
   - 匯出所需資料
   - 預覽和下載圖片

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

## 聯絡方式 | Contact

如有任何問題或建議，歡迎透過以下方式聯絡：

- 開立 GitHub Issue
- 發送 Pull Request
- 聯絡開發團隊

---

*最後更新：2024-03-21* 