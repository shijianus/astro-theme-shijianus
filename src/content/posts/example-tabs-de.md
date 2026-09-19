---
title: "Beispiel: Mehrere Registerkarten und Code-Versionen Umschalten"
description: "Umfassende Demonstration interaktiver Registerkarten und einer Dropdown-basierten mehrsprachigen Code-Umschalter-Komponente."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["Beispiel", "Vorführung", "Registerkarten", "Code-Gruppe"]
category: "Beispiel"
series: "功能示例"
math: false
mermaid: false
i18nKey: "example-tabs"
lang: "de"
aiTranslatedFrom: "zh-CN"
---

Dieses Beispiel dient ausschließlich dazu, die **Mehrfach-Tab-Umschaltung (Interactive Tabs) und die Mehrversions-Dropdown-Umschaltung (Dropdown Switcher)** im Blog-Text zu demonstrieren und zu testen.

---

## 1. Paketmanager-Installationsbefehle-Tab (Interactive Tabs)

Der Benutzer kann durch Klicken auf verschiedene Tabs die entsprechenden Paketmanager-Installationsbefehle schnell kopieren:

<div class="article-tabs">
  <div class="article-tabs__nav">
    <button class="article-tabs__button is-active" type="button">pnpm (empfohlen)</button>
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

## 2. Mehrere Frontend-Framework-Implementierungen für Dropdown-Umschalter (Interactive Dropdown Switcher)

Durch Auswahl des Ziel-Frameworks im Dropdown-Menü im Text wird die darunterliegende Inhaltsanzeige automatisch synchronisiert:

<div class="article-dropdown-switcher">
  <div class="article-dropdown-switcher__header">
    <div class="article-dropdown-switcher__title">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="m14 9 3 3-3 3"/></svg>
      <span>Wählen Sie die Frontend-Framework-Implementierung:</span>
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
      <div class="article-dropdown-panel__title">⚛️ React 19 Zähler-Code:</div>
      <pre class="no-code-enhance"><code class="language-tsx">import { useState } from 'react';
export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount((c) => c + 1)}>Count: {count}</button>;
}</code></pre>
    </div>
    <div class="article-dropdown-panel" data-panel="vue-code">
      <div class="article-dropdown-panel__title">🟢 Vue 3.5 Zähler-Code：</div>
      <pre class="no-code-enhance"><code class="language-html"><script setup lang="ts">
import { ref } from 'vue';
const count = ref(0);
</script>
<template>
  <button @click="count++">Zähler: {{ count }}</button>
</template></code></pre>
    </div>
    <div class="article-dropdown-panel" data-panel="astro-code">
      <div class="article-dropdown-panel__title">🚀 Astro 6 Insel-Komponenten-Code：</div>
      <pre class="no-code-enhance"><code class="language-astro">---
const { label = "Astro statische Komponente" } = Astro.props;
---
<div class="astro-card">
  <h3>{{label}}</h3>
</div></code></pre>
    </div>
    <div class="article-dropdown-panel" data-panel="svelte-code">
      <div class="article-dropdown-panel__title">🟠 Svelte 5 Zähler-Code：</div>
      <pre class="no-code-enhance"><code class="language-svelte"><script lang="ts">
  let count = $state(0);
</script>
<button onclick=() => count++>Zähler: {count}</button></code></pre>
    </div>
  </div>
</div>