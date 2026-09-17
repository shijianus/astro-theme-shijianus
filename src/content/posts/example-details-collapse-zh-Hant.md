---
title: "範例：摺疊面板、手風琴與下拉選單格式展示"
description: "全面展示原生 details、手風琴摺疊組、巢狀摺疊與特殊的下拉選單選擇器元件。"
pubDate: 2026-08-28
draft: false
toc: true
tags: ["example", "showcase", "collapse", "dropdown"]
category: "範例"
series: "功能範例"
math: false
mermaid: false
i18nKey: "example-details-collapse"
lang: "zh-Hant"
aiTranslatedFrom: "zh-CN"
---

本篇範例專用於驗證與測試部落格正文中的 **摺疊面板（Details）、手風琴組（Accordions）以及特殊的下拉選單（Dropdown Selectors）** 元件。

所有元件均優先基於瀏覽器原生語義或輕量 Islands 架構實現，確保交付零或極小客戶端開銷。

---

## 一、原生美化摺疊（Single Details / Summary）

支援平滑箭頭旋轉動畫與卡片邊框流光。

<details class="article-accordion" open>
  <summary>
    <span>💡 為什麼靜態網站產生器能達到極高並發？</span>
    <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
  </summary>
  <div class="accordion-content">
    <p>因為靜態產生器在構建期已將所有 Markdown 與元件編譯為純 HTML/CSS 靜態檔案，CDN 節點直接回應請求而無需經過任何資料庫查詢或後端計算，理論並發上限取決於網路吞吐量。</p>
  </div>
</details>

```html
<details class="article-accordion" open>
  <summary>
    <span>💡 為什麼靜態網站產生器能達到極高並發？</span>
    <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
  </summary>
  <div class="accordion-content">
    <p>因為靜態產生器在構建期已將所有 Markdown 與元件編譯為純 HTML/CSS 靜態檔案...</p>
  </div>
</details>
```

---

## 二、互斥手風琴摺疊組（Single-Open Accordion Group）

展開其中任意一項時，同組內的其他展開項將自動平滑關閉：

<div class="article-accordion-group" data-single="true">
  <details class="article-accordion" open>
    <summary>
      <span>🔒 1. 物理層面的高安全性</span>
      <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    </summary>
    <div class="accordion-content">
      <p>沒有公網資料庫連線字串與動態後端程序，完全免疫 SQL 注入與伺服器端命令注入攻擊。</p>
    </div>
  </details>

  <details class="article-accordion">
    <summary>
      <span>⚡ 2. 毫秒級全球 CDN 交付</span>
      <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    </summary>
    <div class="accordion-content">
      <p>靜態檔案分佈在全球數百個 CDN 邊緣節點，就近極速命中，TTFB 普遍小於 20ms。</p>
    </div>
  </details>

  <details class="article-accordion">
    <summary>
      <span>💰 3. 幾乎為零的維護成本</span>
      <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    </summary>
    <div class="accordion-content">
      <p>配合 Cloudflare Pages 等託管平台，無需購買昂貴的伺服器主機即可穩定運行。</p>
    </div>
  </details>
</div>

```html
<div class="article-accordion-group" data-single="true">
  <details class="article-accordion" open>
    <summary><span>🔒 1. 物理層面的高安全性</span>...</summary>
    <div class="accordion-content">...</div>
  </details>
  <details class="article-accordion">
    <summary><span>⚡ 2. 毫秒級全球 CDN 交付</span>...</summary>
    <div class="accordion-content">...</div>
  </details>
</div>
```

---

## 三、特殊的下拉選單格式（Dropdown Selectors & Interactive Calc）

### 1. 原生美化下拉選擇框（Custom Styled Select）

<div class="article-select-box">
  <label>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
    <span>選擇執行時架構：</span>
  </label>
  <select class="article-select">
    <option value="static">🚀 純靜態交付 (SSG - 推薦)</option>
    <option value="ssr">⚙️ 混合伺服器端渲染 (SSR)</option>
    <option value="edge">🌐 邊緣計算串流渲染 (Edge)</option>
  </select>
</div>

```html
<div class="article-select-box">
  <label><span>選擇執行時架構：</span></label>
  <select class="article-select">
    <option value="static">🚀 純靜態交付 (SSG - 推薦)</option>
    <option value="ssr">⚙️ 混合伺服器端渲染 (SSR)</option>
    <option value="edge">🌐 邊緣計算串流渲染 (Edge)</option>
  </select>
</div>
```

### 2. 互動式下拉規格計算器（Interactive Calc Dropdown）

選擇不同選項時，右側即時計算並顯示對應的網路與硬體規格：

<div class="interactive-calc-select">
  <div class="article-select-box">
    <label>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx