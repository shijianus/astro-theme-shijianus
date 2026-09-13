---
title: "主題重構啟動記錄"
pubDate: 2026-04-02
description: "第一篇重構記錄，確定新的主題不是舊主題的殼，而是一套真正可維護的 Astro 實現。"
author: "shijianus"
category: "前端工程"
group: "遷移記錄"
cover: "/media/shijianus/frontend.jpg"
coverAlt: "frontend workspace"
featured: true
sticky: 3
tags: ["Astro", "Tailwind", "主題重構"]
i18nKey: "hello-world"
lang: "zh-Hant"
aiTranslatedFrom: "zh-CN"
---

# 為什麼要重做

先前的實現最大的問題不是功能少，而是結構不清楚。頁面上混雜了試驗性的品牌、風格和局部組件，最終既不像原主題，也沒有形成自己的秩序。

## 這次重構的判斷

這次的主題重構有兩個前提：

1. 保留原主題強結構首頁、側欄模組和卡片體系的優點。
2. 把實現方式完全切換到 Astro + React + Tailwind 的內容優先架構。

```ts
const themeContract = {
  brand: 'shijianus',
  runtime: 'Astro Islands',
  interaction: ['loading', 'copy-code', 'comments', 'dock'],
};
```

## 首頁應該先解決什麼

首頁不是宣傳頁，它首先是一張資訊地圖。讀者進入第一頁，需要很快看見：

- 品牌與作者身份
- 當前有哪些主要分類
- 最近有哪些值得讀的文章
- 側欄裡還能繼續往哪裡走

## 之後的方向

後續所有區塊都會圍繞同一個目標繼續調整：讓這套主題既有技術感，又不會把普通讀者擋在門外。