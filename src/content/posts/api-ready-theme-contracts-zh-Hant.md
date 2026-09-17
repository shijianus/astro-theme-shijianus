---
title: "將主題配置設計成可供 API 串接的契約"
pubDate: 2026-04-08
description: "真正方便後續與 API 串接的方式，不是先撰寫請求，而是先把頁面依賴的資料形狀穩定下來。"
author: "shijianus"
category: "系統設計"
group: "配置契約"
cover: "/media/shijianus/system.jpg"
coverAlt: "系統板"
featured: true
sticky: 2
tags: ["API", "配置", "架構"]
i18nKey: "api-ready-theme-contracts"
lang: "zh-Hant"
aiTranslatedFrom: "zh-CN"
---

# 為何先建立契約

如果一個主題的每個區塊都直接在模板中讀取原始資料，那麼一旦日後要從本地 Markdown 切換到 API，幾乎每個頁面都必須重寫。

## 目前的處理方式

這次我先把這些能力抽離成統一的 helper：

- 文章排序
- 歸檔聚合
- 分類聚合
- 標籤聚合
- 相關文章推薦

## 這樣做的效益

當資料來源變化時，理論上只需要替換資料入口，而不是改動 UI 元件本身。

## 對主題擴展的意義

這意味著日後要串接：

- 自訂儀表板 API
- 外部搜尋 API
- 遠端文章摘要服務

都不會將目前的元件層拆解重來。