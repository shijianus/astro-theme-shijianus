---
title: "Ejemplo: demostración de pestañas múltiples y cambio de versiones de código"
description: "Demostración completa de la pestaña interactiva Tabs y el componente de conmutador de código multilingüe basado en menú desplegable."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["ejemplo", "demostración", "pestañas", "grupo de código"]
category: "Ejemplo"
series: "功能示例"
math: false
mermaid: false
i18nKey: "example-tabs"
lang: "es"
aiTranslatedFrom: "zh-CN"
---
Este ejemplo está diseñado específicamente para demostrar y probar las **pestañas interactivas (Interactive Tabs) y el selector desplegable de múltiples versiones (Dropdown Switcher)** en el cuerpo del artículo del blog.

---

## 1. Pestañas de comandos de instalación de gestores de paquetes (Interactive Tabs)

Los usuarios pueden hacer clic en diferentes pestañas para copiar rápidamente el comando de instalación correspondiente a cada gestor de paquetes:

<div class="article-tabs">
  <div class="article-tabs__nav">
    <button class="article-tabs__button is-active" type="button">pnpm (recomendado)</button>
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

## 2. Implementación de un Selector Desplegable con Múltiples Frameworks Frontend (Interactive Dropdown Switcher)

Seleccione el framework tecnológico deseado a través del menú desplegable en el cuerpo del texto, y el panel de contenido inferior cambiará automáticamente de forma sincronizada:

<div class="article-dropdown-switcher">
  <div class="article-dropdown-switcher__header">
    <div class="article-dropdown-switcher__title">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="m14 9 3 3-3 3"/></svg>
      <span>Seleccionar implementación del framework frontend:</span>
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
      <div class="article-dropdown-panel__title">⚛️ Código del contador de React 19:</div>
      <pre class="no-code-enhance"><code class="language-tsx">import &#123; useState &#125; from 'react';
export function Counter() &#123;
  const [count, setCount] = useState(0);
  return &lt;button onClick=&#123;() =&gt; setCount((c) =&gt; c + 1)&#125;&gt;Count: &#123;count&#125;&lt;/button&gt;;
&#125;</code></pre>
    </div>
    <div class="article-dropdown-panel" data-panel="vue-code">
      <div class="article-dropdown-panel__title">🟢 Código del contador de Vue 3.5:</div>
      <pre class="no-code-enhance"><code class="language-html">&lt;script setup lang="ts"&gt;
import &#123; ref &#125; from 'vue';
const count = ref(0);
&lt;/script&gt;
&lt;template&gt;
  &lt;button @click="count++"&gt;Count: &#123;&#123; count &#125;&#125;&lt;/button&gt;
&lt;/template&gt;</code></pre>
    </div>
    <div class="article-dropdown-panel" data-panel="astro-code">
      <div class="article-dropdown-panel__title">🚀 Código del componente de islas de Astro 6:</div>
      <pre class="no-code-enhance"><code class="language-astro">---
const &#123; label = "Astro 静态组件" &#125; = Astro.props;
---
&lt;div class="astro-card"&gt;
  &lt;h3&gt;&#123;label&#125;&lt;/h3&gt;
&lt;/div&gt;</code></pre>
    </div>
    <div class="article-dropdown-panel" data-panel="svelte-code">
      <div class="article-dropdown-panel__title">🟠 Código del contador de Svelte 5:</div>
      <pre class="no-code-enhance"><code class="language-svelte">&lt;script lang="ts"&gt;
  let count = $state(0);
&lt;/script&gt;
&lt;button onclick=&#123;() =&gt; count++&#125;&gt;Count: &#123;count&#125;&lt;/button&gt;</code></pre>
    </div>
  </div>
</div>