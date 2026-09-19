---
title: "Exemple : affichage de plusieurs onglets et de plusieurs versions de code"
description: "Présentation complète des onglets interactifs Tabs et du composant de commutation de code multilingue basé sur un menu déroulant."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["exemple", "exposition", "onglets", "groupe-de-code"]
category: "Exemple"
series: "功能示例"
math: false
mermaid: false
i18nKey: "example-tabs"
lang: "fr"
aiTranslatedFrom: "zh-CN"
---

Cet exemple est dédié à la démonstration et aux tests des **onglets interactifs (Interactive Tabs) et du sélecteur déroulant multi-version (Dropdown Switcher)** dans le corps du blog.

---

## 1. Onglets d'installation des gestionnaires de paquets (Interactive Tabs)

L'utilisateur peut cliquer sur différents onglets pour copier rapidement les commandes d'installation correspondantes du gestionnaire de paquets :

<div class="article-tabs">
  <div class="article-tabs__nav">
    <button class="article-tabs__button is-active" type="button">pnpm (recommandé)</button>
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

## 2. Sélecteur déroulant multi-frontend (Interactive Dropdown Switcher)

En sélectionnant le cadre technologique cible via le menu déroulant dans le corps du texte, le panneau de contenu ci-dessous basculera automatiquement :

<div class="article-dropdown-switcher">
  <div class="article-dropdown-switcher__header">
    <div class="article-dropdown-switcher__title">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="m14 9 3 3-3 3"/></svg>
      <span>Choisir la mise en œuvre du cadre frontend :</span>
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
      <div class="article-dropdown-panel__title">⚛️ React 19 Code du compteur :</div>
      <pre class="no-code-enhance"><code class="language-tsx">import &#123; useState &#125; from 'react';
export function Counter() &#123;
  const [count, setCount] = useState(0);
  return &lt;button onClick=&#123;() =&gt; setCount((c) =&gt; c + 1)&#125;&gt;Count: &#123;count&#125;&lt;/button&gt;;
&#125;</code></pre>
    </div>
    <div class="article-dropdown-panel" data-panel="vue-code">
      <div class="article-dropdown-panel__title">🟢 Vue 3.5 code du compteur：</div>
      <pre class="no-code-enhance"><code class="language-html"><script setup lang="ts">
import { ref } from 'vue';
const count = ref(0);
</script>
<template>
  <button @click="count++">Compteur: {{ count }}</button>
</template></code></pre>
    </div>
    <div class="article-dropdown-panel" data-panel="astro-code">
      <div class="article-dropdown-panel__title">🚀 Astro 6 code du composant île：</div>
      <pre class="no-code-enhance"><code class="language-astro">---
const { label = "Astro composant statique" } = Astro.props;
---
<div class="astro-card">
  <h3>{label}</h3>
</div></code></pre>
    </div>
    <div class="article-dropdown-panel" data-panel="svelte-code">
      <div class="article-dropdown-panel__title">🟠 Svelte 5 code du compteur：</div>
      <pre class="no-code-enhance"><code class="language-svelte"><script lang="ts">
  let count = $state(0);
</script>
<button onclick=() => count++>Compteur: {count}</button></code></pre>
    </div>
  </div>
</div>