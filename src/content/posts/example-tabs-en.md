---
title: "Example: Interactive Tabs and Multi‑Code Version Switcher Showcase"
description: "Comprehensively demonstrate interactive Tabs and a dropdown‑based multi‑language code switcher component."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["example", "showcase", "tabs", "code-group"]
category: "Example"
series: "Feature Examples"
math: false
mermaid: false
i18nKey: "example-tabs"
lang: "en"
aiTranslatedFrom: "zh-CN"
---

This example is dedicated to demonstrating and testing **interactive tab switching (Interactive Tabs) and multi‑version dropdown switcher (Dropdown Switcher)** within blog content.

---

## 1. Package Manager Installation Command Tabs (Interactive Tabs)

Users can click different tabs to quickly copy the corresponding package manager installation command:

<div class="article-tabs">
  <div class="article-tabs__nav">
    <button class="article-tabs__button is-active" type="button">pnpm (recommended)</button>
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

## 2. Multi‑Framework Dropdown Switcher (Interactive Dropdown Switcher)

Select the target frontend framework implementation from the dropdown menu in the article, and the content panel below will automatically switch accordingly:

<div class="article-dropdown-switcher">
  <div class="article-dropdown-switcher__header">
    <div class="article-dropdown-switcher__title">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="m14 9 3 3-3 3"/></svg>
      <span>Select frontend framework implementation:</span>
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
      <div class="article-dropdown-panel__title">⚛️ React 19 Counter Code:</div>
      <pre class="no-code-enhance"><code class="language-tsx">import &#123; useState &#125; from 'react';
export function Counter() &#123;
  const [count, setCount] = useState(0);
  return &lt;button onClick=&#123;() =&gt; setCount((c) =&gt; c + 1)&#125;&gt;Count: &#123;count&#125;&lt;/button&gt;;
&#125;</code></pre>
    </div>
    <div class="article-dropdown-panel" data-panel="vue-code">
      <div class="article-dropdown-panel