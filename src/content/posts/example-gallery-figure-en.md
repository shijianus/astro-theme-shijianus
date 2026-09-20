---
title: "Example: Image Gallery, Polaroid Style Photos, and Lightbox Display"
description: "A comprehensive showcase of responsive image gallery grids, aesthetic Polaroid-style albums, and full-screen lossless image lightbox functionality."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["example", "showcase", "gallery", "lightbox"]
category: "Example"
series: "Feature Examples"
math: false
mermaid: false
i18nKey: "example-gallery-figure"
lang: "en"
aiTranslatedFrom: "zh-CN"
---

This example article is dedicated to showcasing and testing the **Image Gallery** and **Full-Screen Lightbox** components within blog posts.

Clicking any image will activate a full-screen, centered lightbox, which can be closed at any time by pressing the `Esc` key or clicking the overlay.

---

## 1. Responsive 3-Column Image Gallery Grid

<div class="article-gallery">
  <div class="gallery-grid gallery-grid-3">
    <div class="gallery-item">
      <img src="/media/shijianus/workbench.jpg" alt="Workbench R&D Panorama" />
      <div class="gallery-item__caption">Workbench R&D Panorama</div>
    </div>
    <div class="gallery-item">
      <img src="/media/shijianus/system.jpg" alt="Architecture Design Central Dashboard" />
      <div class="gallery-item__caption">Architecture Design Central Dashboard</div>
    </div>
    <div class="gallery-item">
      <img src="/media/shijianus/default.png" alt="Strolling Through the Galaxy Cover Visual" />
      <div class="gallery-item__caption">Strolling Through the Galaxy Cover Visual</div>
    </div>
  </div>
</div>

```html
<div class="article-gallery">
  <div class="gallery-grid gallery-grid-3">
    <div class="gallery-item">
      <img src="/media/shijianus/workbench.jpg" alt="Workbench R&D Panorama" />
      <div class="gallery-item__caption">Workbench R&D Panorama</div>
    </div>
    ...
  </div>
</div>
```

---

## 2. Aesthetic Polaroid-Style Photo Album

<div class="gallery-polaroid">
  <div class="polaroid-card">
    <img src="/media/shijianus/workbench.jpg" alt="2026 R&D Outlook" />
    <div class="polaroid-card__caption">2026.04 Hangzhou · R&D Workshop</div>
  </div>
  <div class="polaroid-card">
    <img src="/media/shijianus/system.jpg" alt="Night of Architectural Evolution" />
    <div class="polaroid-card__caption">2026.08 Architectural Refactoring & Evolution Night</div>
  </div>
</div>

```html
<div class="gallery-polaroid">
  <div class="polaroid-card">
    <img src="/media/shijianus/workbench.jpg" alt="2026 R&D Outlook" />
    <div class="polaroid-card__caption">2026.04 Hangzhou · R&D Workshop</div>
  </div>
</div>
```