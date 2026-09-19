---
title: "範例：圖片畫廊、拍立得相紙與燈箱展示"
description: "全面展示自適應圖片畫廊網格、人文拍立得相簿與全螢幕無損圖片燈箱功能。"
pubDate: 2026-08-28
draft: false
toc: true
tags: ["範例", "展示", "畫廊", "燈箱"]
category: "範例"
series: "功能範例"
math: false
mermaid: false

i18nKey: "example-gallery-figure"
lang: "zh-Hant"
aiTranslatedFrom: "zh-CN"
---

本篇範例專用於展示與測試部落格正文中的 **圖片畫廊（Gallery）與全螢幕燈箱（Lightbox）** 元件。

點擊任意圖片皆可喚起全螢幕置中放大燈箱，支援 `Esc` 快捷鍵或點擊遮罩隨時關閉。

---

## 一、自適應 3 列圖片畫廊網格

<div class="article-gallery">
  <div class="gallery-grid gallery-grid-3">
    <div class="gallery-item">
      <img src="/media/shijianus/workbench.jpg" alt="工作台研發全景" />
      <div class="gallery-item__caption">工作台研發全景</div>
    </div>
    <div class="gallery-item">
      <img src="/media/shijianus/system.jpg" alt="架構設計中樞大螢幕" />
      <div class="gallery-item__caption">架構設計中樞大螢幕</div>
    </div>
    <div class="gallery-item">
      <img src="/media/shijianus/default.png" alt="星河漫步封面視覺" />
      <div class="gallery-item__caption">星河漫步封面視覺</div>
    </div>
  </div>
</div>

```html
<div class="article-gallery">
  <div class="gallery-grid gallery-grid-3">
    <div class="gallery-item">
      <img src="/media/shijianus/workbench.jpg" alt="工作台研發全景" />
      <div class="gallery-item__caption">工作台研發全景</div>
    </div>
    ...
  </div>
</div>
```

---

## 二、人文質感拍立得相簿（Polaroid Style）

<div class="gallery-polaroid">
  <div class="polaroid-card">
    <img src="/media/shijianus/workbench.jpg" alt="2026 研發展望" />
    <div class="polaroid-card__caption">2026.04 杭州·研發工坊</div>
  </div>
  <div class="polaroid-card">
    <img src="/media/shijianus/system.jpg" alt="架構演進之夜" />
    <div class="polaroid-card__caption">2026.08 架構重構演進夜</div>
  </div>
</div>

```html
<div class="gallery-polaroid">
  <div class="polaroid-card">
    <img src="/media/shijianus/workbench.jpg" alt="2026 研發展望" />
    <div class="polaroid-card__caption">2026.04 杭州·研發工坊</div>
  </div>
</div>
```