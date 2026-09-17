---
title: "Exemple : affichage avec onglets multiples et bascule de versions de code"
description: "Présentation complète des composants interactifs d'onglets (Tabs) et du sélecteur de code multilingue basé sur un menu déroulant."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["exemple", "vitrine", "onglets", "groupe-de-code"]
category: "Exemples"
series: "Exemples de fonctionnalités"
math: false
mermaid: false
i18nKey: "example-tabs"
lang: "fr"
aiTranslatedFrom: "zh-CN"
---

Cet exemple est dédié à la démonstration et au test des **onglets interactifs (Interactive Tabs)** et du **sélecteur de bascule par menu déroulant (Dropdown Switcher)** au sein du corps de l'article.

---

## 1. Onglets pour les commandes d'installation des gestionnaires de paquets (Interactive Tabs)

L'utilisateur peut cliquer sur différents onglets pour copier rapidement la commande d'installation correspondant au gestionnaire de paquets souhaité :

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

## 2. Sélecteur de bascule par menu déroulant pour plusieurs frameworks front-end (Interactive Dropdown Switcher)

En sélectionnant le framework technique cible via le menu déroulant dans le corps de l'article, le panneau de contenu ci-dessous bascule automatiquement en synchronisation :

<div class="article-dropdown-switcher">
  <div class="article-dropdown-switcher__header">
    <div class="article-dropdown-switcher__title">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="m14 9 3 3-3 3"/></svg>
      <span>Sélectionner l'implémentation du framework front-end :</span>
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
      <div class="article-dropdown-panel__title">⚛️ Code du compteur React 19 :</div>
      <pre class="no-code-enhance"><code class="language-tsx">import &#123; useState &#125; from 'react';
export function Counter() &#123;
  const [count, setCount] = useState(0);
  return &lt;button onClick=&#123;() =&gt; setCount((c) =&gt; c + 1)&#125;&gt;Count: &#123;count&#125;&lt;/button&gt;;
&#125;</code></pre>
    </div>
    <div class="article-dropdown-panel" data-panel="vue-code">
      <div class="article-dropdown-panel__title">🟢 Code du compteur Vue 3.5 :</div>
      <pre class="no-code-enhance"><code class="language-html">&lt;script setup lang="ts"&gt;
import &#123; ref &#125; from 'vue';
const count = ref(0);
&lt;/script&gt;
&lt;template&gt;
  &lt;button @click="count++"&gt;Count: &#123;&#123; count &#125;&#125;&lt;/button&gt;
&lt;/template&gt;</code></pre>
    </div>
    <div class="article-dropdown-panel" data-panel="astro-code">
      <div class="article-dropdown-panel__title">🚀 Code du composant îlot Astro 6 :</div>
      <pre class="no-code-enhance"><code class="language-astro">---
const &#123; label = "Astro 静态组件" &#125; = Astro.props;
---
&lt;div class="astro-card"&gt;
  &lt;h3&gt;&#123;label&#125;&lt;/h3&gt;
&lt;/div&gt;</code></pre>
    </div>
    <div class="article-dropdown-panel" data-panel="svelte-code">
      <div class="article-dropdown-panel__title">🟠 Code du compteur Svelte 5 :</div>
      <pre class="no-code-enhance"><code class="language-svelte">&lt;script lang="ts"&gt;
  let count = $state(0);
&lt;/script&gt;
&lt;button onclick=&#123;() =&gt; count++&#125;&gt;Count: &#123;count&#125;&lt;/button&gt;</code></pre>
    </div>
  </div>
</div>