---
title: "示例：多标签页与多代码版本切换展示"
description: "全面展示交互式 Tabs 标签页与基于下拉框的多语言代码切换器组件。"
pubDate: 2026-08-28
draft: false
toc: true
tags: ["example", "showcase", "tabs", "code-group"]
category: "Examples"
series: "功能示例"
math: false
mermaid: false
---

本篇示例专用于展示与测试博客正文中的 **多标签页切换（Interactive Tabs）与多版本下拉切换器（Dropdown Switcher）**。

---

## 一、包管理器安装命令选项卡（Interactive Tabs）

用户可以点击不同的标签页快速复制对应包管理器的安装指令：

<div class="article-tabs">
  <div class="article-tabs__nav">
    <button class="article-tabs__button is-active" type="button">pnpm (推荐)</button>
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

## 二、多前端框架实现下拉切换器（Interactive Dropdown Switcher）

通过正文内的下拉菜单选择目标技术框架，下方的内容面板将自动同步切换：

<div class="article-dropdown-switcher">
<div class="article-dropdown-switcher__header">
<div class="article-dropdown-switcher__title">
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="m14 9 3 3-3 3"/></svg>
<span>选择前端框架实现：</span>
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
<p><strong>React 19 计数器代码：</strong></p>
<pre class="no-code-enhance"><code class="language-tsx">import &#123; useState &#125; from 'react';

export function Counter() &#123;
  const [count, setCount] = useState(0);
  return &lt;button onClick=&#123;() =&gt; setCount((c) =&gt; c + 1)&#125;&gt;Count: &#123;count&#125;&lt;/button&gt;;
&#125;</code></pre>
</div>
<div class="article-dropdown-panel" data-panel="vue-code">
<p><strong>Vue 3.5 计数器代码：</strong></p>
<pre class="no-code-enhance"><code class="language-html">&lt;script setup lang="ts"&gt;
import &#123; ref &#125; from 'vue';
const count = ref(0);
&lt;/script&gt;
&lt;template&gt;
  &lt;button @click="count++"&gt;Count: &#123;&#123; count &#125;&#125;&lt;/button&gt;
&lt;/template&gt;</code></pre>
</div>
<div class="article-dropdown-panel" data-panel="astro-code">
<p><strong>Astro 6 群岛组件代码：</strong></p>
<pre class="no-code-enhance"><code class="language-astro">---
const &#123; label = "Astro 静态组件" &#125; = Astro.props;
---
&lt;div class="astro-card"&gt;
  &lt;h3&gt;&#123;label&#125;&lt;/h3&gt;
&lt;/div&gt;</code></pre>
</div>
<div class="article-dropdown-panel" data-panel="svelte-code">
<p><strong>Svelte 5 计数器代码：</strong></p>
<pre class="no-code-enhance"><code class="language-svelte">&lt;script lang="ts"&gt;
  let count = $state(0);
&lt;/script&gt;
&lt;button onclick=&#123;() =&gt; count++&#125;&gt;Count: &#123;count&#125;&lt;/button&gt;</code></pre>
</div>
</div>
</div>
