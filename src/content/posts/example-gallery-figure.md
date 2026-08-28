---
title: "示例：图片画廊、拍立得相纸与灯箱展示"
description: "全面展示自适应图片画廊网格、人文拍立得相册与全屏无损图片灯箱功能。"
pubDate: 2026-08-28
draft: false
toc: true
tags: ["example", "showcase", "gallery", "lightbox"]
category: "Examples"
series: "功能示例"
math: false
mermaid: false
---

本篇示例专用于展示与测试博客正文中的 **图片画廊（Gallery）与全屏灯箱（Lightbox）** 组件。

点击任意图片均可唤起全屏居中放大灯箱，支持 `Esc` 快捷键或点击遮罩随时关闭。

---

## 一、自适应 3 列图片画廊网格

<div class="article-gallery">
  <div class="gallery-grid gallery-grid-3">
    <div class="gallery-item">
      <img src="/media/shijianus/workbench.jpg" alt="工作台研发全景" />
      <div class="gallery-item__caption">工作台研发全景</div>
    </div>
    <div class="gallery-item">
      <img src="/media/shijianus/system.jpg" alt="架构设计中枢大屏" />
      <div class="gallery-item__caption">架构设计中枢大屏</div>
    </div>
    <div class="gallery-item">
      <img src="/media/shijianus/default-cover.jpg" alt="星河漫步封面视觉" />
      <div class="gallery-item__caption">星河漫步封面视觉</div>
    </div>
  </div>
</div>

```html
<div class="article-gallery">
  <div class="gallery-grid gallery-grid-3">
    <div class="gallery-item">
      <img src="/media/shijianus/workbench.jpg" alt="工作台研发全景" />
      <div class="gallery-item__caption">工作台研发全景</div>
    </div>
    ...
  </div>
</div>
```

---

## 二、人文质感拍立得相册（Polaroid Style）

<div class="gallery-polaroid">
  <div class="polaroid-card">
    <img src="/media/shijianus/workbench.jpg" alt="2026 研发展望" />
    <div class="polaroid-card__caption">2026.04 杭州·研发工坊</div>
  </div>
  <div class="polaroid-card">
    <img src="/media/shijianus/system.jpg" alt="架构演进之夜" />
    <div class="polaroid-card__caption">2026.08 架构重构演进夜</div>
  </div>
</div>

```html
<div class="gallery-polaroid">
  <div class="polaroid-card">
    <img src="/media/shijianus/workbench.jpg" alt="2026 研发展望" />
    <div class="polaroid-card__caption">2026.04 杭州·研发工坊</div>
  </div>
</div>
```
