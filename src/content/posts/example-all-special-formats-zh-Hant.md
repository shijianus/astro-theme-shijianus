---
title: "範例：Astro 特殊格式與特異功能綜合測試大全"
description: "一站式執行所有 13 種 Callout、文章格式、下拉式選單切換器、手風琴、密碼解密、公式、圖表與排版元件。"
pubDate: 2026-08-28
draft: false
toc: true
tags: ["範例", "展示", "一站式", "測試"]
category: "範例"
series: "功能範例"
math: true
mermaid: true
postFormat: "standard"
i18nKey: "example-all-special-formats"
lang: "zh-Hant"
aiTranslatedFrom: "zh-CN"
---

本篇為 **一站式綜合驗收與全景壓力測試示範文章（All-in-one Master Showcase）**，用於快速自動化測試內文欄的所有格式與特異功能。

---

## 1. 提示框（Callouts）

> [!TIP]
> **技巧**：使用快捷鍵 <kbd>Ctrl</kbd> + <kbd>K</kbd> 喚起搜尋。

> [!WARNING]
> **警告**：請妥善保管私鑰。

---

## 2. 下拉式選單與手風琴（Dropdowns & Accordions）

<div class="article-dropdown-switcher">
<div class="article-dropdown-switcher__header">
<div class="article-dropdown-switcher__title">
<span>選擇框架：</span>
</div>
<select class="article-select dropdown-switcher__select">
<option value="react-tab">⚛️ React 19</option>
<option value="vue-tab">🟢 Vue 3.5</option>
</select>
</div>
<div class="article-dropdown-switcher__body">
<div class="article-dropdown-panel is-active" data-panel="react-tab">
<p>React 19 元件程式碼已載入。</p>
</div>
<div class="article-dropdown-panel" data-panel="vue-tab">
<p>Vue 3.5 單檔案元件程式碼已載入。</p>
</div>
</div>
</div>

<details class="article-accordion" open>
  <summary>
    <span>💡 點擊展開：效能最佳化說明</span>
    <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
  </summary>
  <div class="accordion-content">
    <p>Astro 採用 Islands 架構，預設交付 0KB JS。</p>
  </div>
</details>

---

## 3. 數學公式與 Mermaid 圖表（Math & Mermaid）

行內公式：$E = mc^2$，高斯積分：$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$。

區塊級馬克士威方程式：

$$
\nabla \cdot \mathbf{E} = \frac{\rho}{\varepsilon_0}, \quad \nabla \times \mathbf{B} = \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}
$$

```mermaid
graph LR
    A[Markdown 原始碼] --> B[Astro 建構編譯器]
    B --> C[純靜態 HTML 交付]
```

---

## 4. 安全密碼解密與高斯模糊

<div class="article-encrypted-box" data-hash="d7fb6c64b9aa44cc0c3b427edaa623369dee1a9778329801f68fdaa34b09d351" data-hint="💡 驗證提示：演示金鑰請直接輸入 shijianus2026">
  <div class="encrypted-box__lock">
    <div class="encrypted-box__icon">🔒</div>
    <div class="encrypted-box__title">受保護加密資產</div>
    <div class="encrypted-box__desc">請輸入授權密碼後解鎖。</div>
    <button class="encrypted-box__btn" type="button">點擊輸入密碼解鎖</button>
  </div>
  <div class="encrypted-box__content">
    <div class="admonition admonition-success">
      <div class="admonition-title"><span>🎉 解密成功</span></div>
      <div class="admonition-content">
        <p>私有令牌：<code>shijian_sec_9988_a1b2c3d4e5f6</code></p>
      </div>
    </div>
  </div>
</div>

- 高斯模糊文字：<span class="blur-text">懸浮即可看清劇透內容！</span>
- 黑幕馬賽克：<span class="mosaic-text">機密資料：SHA256-7f83b1657ff1fc53</span>
- Discord 劇透：||雙豎線劇透遮罩||
- 內聯鎖：%%百分號隱藏內容%%

---

## 5. 文章格式（便條、狀態、音訊與畫廊）

<div class="article-aside">
  <p><strong>💡 隨筆</strong>：保持專注，持續交付純粹價值。</p>
</div>

<div class="article-audio-card">
  <div class="audio-card__cover">
    <img src="/media/shijianus/workbench.jpg" alt="唱片封面" />
  </div>
  <div class="audio-card__info">
    <div class="audio-card__title">星河漫步</div>
    <div class="audio-card__author">shijianus · 原創專注白噪音</div>
    <audio controls preload="none" src="https://music.163.com/song/media/outer/url?id=186016.mp3"></audio>
  </div>
</div>