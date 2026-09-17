---
title: "Beispiel: Interaktive Tabs und Dropdown‑Switcher für mehrere Code‑Versionen"
description: "Umfassende Demonstration interaktiver Tabs und eines auf Dropdown‑Basis mehrsprachigen Code‑Switchers."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["beispiel", "vorführung", "tabs", "code-gruppe"]
category: "Beispiel"
series: "Funktionsbeispiele"
math: false
mermaid: false
i18nKey: "example-tabs"
lang: "de"
aiTranslatedFrom: "zh-CN"
---

Dieses Beispiel dient ausschließlich der Demonstration und dem Test von **interaktiven Tabs (Interactive Tabs) und einem Dropdown‑Switcher für mehrere Versionen (Dropdown Switcher)** im Blog‑Inhalt.

---

## 1. Paketmanager‑Installationsbefehle (Interactive Tabs)

Benutzer können verschiedene Registerkarten anklicken, um die jeweiligen Installationsbefehle des Paketmanagers schnell zu kopieren:

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

## 2. Dropdown‑Switcher für mehrere Frontend‑Frameworks (Interactive Dropdown Switcher)

Durch das Dropdown‑Menü im Text können Sie das gewünschte Frontend‑Framework auswählen; das darunterliegende Inhalts‑Panel wird automatisch synchron umgeschaltet:

<div class="article-dropdown-switcher">
  <div class="article-dropdown-switcher__header">
    <div class="article-dropdown-switcher__title">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="m14 9 3 3-3 3"/></svg>
      <span>Wählen Sie die Frontend‑Framework‑Implementierung:</span>
    </div>
    <select class="article-select dropdown-switcher__select">
      <option value="react-code">⚛️ React 19 (Hooks)</option>
      <option value="vue-code">🟢 Vue 3.5 (Composition API)</option>
      <option value="astro-code">🚀 Astro 6 (Islands)</option>
      <option value="svelte-code">🟠 Svelte 5 (Runes)</option>
    </select>
  </div>
  <div class="