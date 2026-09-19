---
title: "封面、圖床與影片適配實驗室"
pubDate: 2026-04-26
updatedDate: 2026-04-26
description: "集中驗證文章頭圖、遠端圖床、本機資源、影片封面、失效回退以及不同寬度下的媒體展示效果。"
author: "shijianus"
category: "前端工程"
group: "媒體適配"
coverVideo: "/media/shijianus/avatar-dynamic.mp4"
coverVideoPoster: "/media/shijianus/workbench.jpg"
coverAlt: "封面與媒體適配實驗室"
featured: true
sticky: 2
tags: ["媒體適配", "Markdown", "主題重構", "Astro"]
i18nKey: "media-capability-lab"
lang: "zh-Hant"
aiTranslatedFrom: "zh-CN"
---

# 封面與媒體適配總檢

這篇文章專門用來測試 `post-hero__cover`、內文圖片、遠端圖床、影片與預設佔位圖是否都能穩定運作。目前的規則如下：

- 文章頭圖可以直接使用本機圖片
- 文章頭圖也可以使用本機影片並搭配 `poster`
- 內文中的圖片如果載入失敗，會自動回退到預設封面
- 內文中的影片如果沒有 `poster`，會自動補上預設封面

## 本機圖片

下面這張圖使用的是本機資源：

![本機工作台圖片](/media/shijianus/workbench.jpg)

## 遠端圖床圖片

下面故意混入一張遠端圖片，用來確認遠端資源也能正常顯示：

![遠端示例圖](https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1600&q=80)

## 失效圖片回退

下面這張圖是一個故意寫錯的位址，用來確認預設佔位圖會自動補上：

![失效圖片回退測試](/media/shijianus/does-not-exist.jpg)

## 原生影片

內文影片同樣需要支援本機位址，並在各種裝置上保持可控的播放體驗：

<video src="/media/shijianus/avatar-dynamic.mp4" poster="/media/shijianus/default.png" muted loop playsinline controls></video>

## 沒有 poster 的影片

下面這個影片不寫 `poster`，用來驗證主題是否會自動補上預設佔位：

<video src="/media/shijianus/avatar-dynamic.mp4" muted loop playsinline controls></video>

## 寬圖、窄圖與長圖

![寬圖示例](/media/shijianus/hero.jpg)

![直式 QR Code 長圖](/media/shijianus/tg-group.jpg)

當這些內容同時出現時，頁面需要保證：

1. 圖片不會撐破內文寬度。
2. 影片在手機端仍能正常顯示控制列。
3. 失效資源不會留下破碎的佔位。
4. 頭圖影片失效時會自動回退到預設圖片。

## 結論

如果你在煙測（Smoke Test）中看到這篇文章的頭圖可以播放、內文圖片能依寬度收束、錯誤圖片被預設封面取代、內文影片可播放，那麼這一層媒體適配就可以繼續進入更細緻的視覺打磨了。