---
title: "範例：多分頁與多程式碼版本切換展示"
description: "全面展示互動式 Tabs 分頁與基於下拉選單的多語言程式碼切換器組件。"
pubDate: 2026-08-28
draft: false
toc: true
tags: ["範例", "展示", "分頁", "程式碼組"]
category: "範例"
series: "功能範例"
math: false
mermaid: false
i18nKey: "example-tabs"
lang: "zh-Hant"
aiTranslatedFrom: "zh-CN"
---
本篇範例專用於展示與測試部落格正文中的 **多標籤頁切換（Interactive Tabs）與多版本下拉切換器（Dropdown Switcher）**。

---

## 一、包管理器安裝命令選項卡（Interactive Tabs）

使用者可以點擊不同的標籤頁快速複製對應包管理器的安裝指令：

<div class="article-tabs">
  <div class="article-tabs__nav">
    <button class="article-tabs__button is-active" type="button">pnpm (推薦)</button>
    <button class="article-tabs__button" type="button">npm</button>
    <button class="article-tabs__button" type="button">yarn</button>
    <button class="article-tabs__button" type="button">bun</button>
  </div>
  <div class="article-tabs__panels">
    <div class="article-tabs__panel is-active">
      <pre class="no-code-enhance"><code class="language-bash">pnpm add @astrojs/mdx remark-math rehype-katex katex mermaid</code></pre>
    </div>
    <div class="article-tabs__panel">
      <pre class="no-code-enhance"><code class="language-bash">npm install @astrojs/mdx remark-math rehype-katex katex mermaid</code></pre>
    </div>
    <div class="article-tabs__panel">
      <pre class="no-code-enhance"><code class="language-bash">yarn add @astrojs/mdx remark-math rehype-katex katex mermaid</code></pre>
    </div>
    <div class="article-tabs__panel">
      <pre class="no-code-enhance"><code class="language-bash">bun add @astrojs/mdx remark-math rehype-katex katex mermaid</code></pre>
    </div>
  </div>
</div>

```html
<div class="article-tabs">
  <div class="article-tabs__nav">
    <button class="article-tabs__button is-active" type="button">pnpm</button>
    <button class="article-tabs__button" type="button">npm</button>
  </div>
  <div class="article-tabs__panels">
    <div class="article-tabs__panel is-active">
      <pre><code>pnpm add ...</code></pre>
    </div>
    <div class="article-tabs__panel">
      <pre><code>npm install ...</code></pre>
    </div>
  </div>
</div>
```

---

## 二、多前端框架實現下拉切換器（Interactive Dropdown Switcher）

透過正文內的下拉選單選擇目標技術框架，下方的內容面板將自動同步切換：

<div class="article-dropdown-switcher">
  <div class="article-dropdown-switcher__header">
    <div class="article-dropdown-switcher__title">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="m14 9 3 3-3 3"/></svg>
      <span>選擇前端框架實現：</span>
    </div>
    <select class="article-select dropdown-switcher__select">
      <option value="react-code">⚛️ React 19 (Hooks)</option>
      <option value="vue-code">🟢 Vue 3.5 (Composition API)</option>
      <option value="astro-code">🚀 Astro 6 (Islands)</option>
      <option value="svelte-code">🟠 Svelte 5 (Runes)</option>
    </select>
  </div>
  <div class="article-dropdown-switcher__body">
    <div class="article-dropdown-panel is-active" data-panel="react-code">
      <div class="article-dropdown-panel__title">⚛️ React 19 計數器程式碼：</div>
      <pre class="no-code-enhance"><code class="language-tsx">import { useState } from 'react';
export function Counter() {
  const [count