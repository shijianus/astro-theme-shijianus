---
title: "Example: Comprehensive Test of Astro's Special Formats and Unique Features"
description: "A one-stop demonstration covering all 13 types of Callouts, Post Formats, dropdown switchers, accordions, password decryption, formulas, diagrams, and layout components."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["example", "showcase", "all-in-one", "test"]
category: "Example"
series: "Feature Examples"
math: true
mermaid: true
postFormat: "standard"
i18nKey: "example-all-special-formats"
lang: "en"
aiTranslatedFrom: "zh-CN"
---

This article serves as an **All-in-one Master Showcase** for comprehensive acceptance testing and full-scale stress testing, designed to quickly and automatically verify all formats and unique features within the main content area.

---

## 1. Callouts

> [!TIP]
> **Tip**: Use the shortcut <kbd>Ctrl</kbd> + <kbd>K</kbd> to open search.

> [!WARNING]
> **Warning**: Please keep your private key secure.

---

## 2. Dropdowns & Accordions

<div class="article-dropdown-switcher">
<div class="article-dropdown-switcher__header">
<div class="article-dropdown-switcher__title">
<span>Select Framework:</span>
</div>
<select class="article-select dropdown-switcher__select">
<option value="react-tab">⚛️ React 19</option>
<option value="vue-tab">🟢 Vue 3.5</option>
</select>
</div>
<div class="article-dropdown-switcher__body">
<div class="article-dropdown-panel is-active" data-panel="react-tab">
<p>React 19 component code loaded.</p>
</div>
<div class="article-dropdown-panel" data-panel="vue-tab">
<p>Vue 3.5 single-file component code loaded.</p>
</div>
</div>
</div>

<details class="article-accordion" open>
  <summary>
    <span>💡 Click to Expand: Performance Optimization Details</span>
    <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
  </summary>
  <div class="accordion-content">
    <p>Astro uses an Islands Architecture, delivering 0KB JS by default.</p>
  </div>
</details>

---

## 3. Math Formulas & Mermaid Diagrams

Inline formula: $E = mc^2$, Gaussian integral: $\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$.

Block-level Maxwell's equations:

$$
\nabla \cdot \mathbf{E} = \frac{\rho}{\varepsilon_0}, \quad \nabla \times \mathbf{B} = \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}
$$

```mermaid
graph LR
    A[Markdown Source] --> B[Astro Build Compiler]
    B --> C[Pure Static HTML Delivery]
```

---

## 4. Secure Password Decryption & Gaussian Blur

<div class="article-encrypted-box" data-hash="d7fb6c64b9aa44cc0c3b427edaa623369dee1a9778329801f68fdaa34b09d351" data-hint="💡 Verification Hint: For the demo key, please enter shijianus2026 directly">
  <div class="encrypted-box__lock">
    <div class="encrypted-box__icon">🔒</div>
    <div class="encrypted-box__title">Protected Encrypted Asset</div>
    <div class="encrypted-box__desc">Please enter the authorized password to unlock.</div>
    <button class="encrypted-box__btn" type="button">Click to Enter Password and Unlock</button>
  </div>
  <div class="encrypted-box__content">
    <div class="admonition admonition-success">
      <div class="admonition-title"><span>🎉 Decryption Successful</span></div>
      <div class="admonition-content">
        <p>Private Token: <code>shijian_sec_9988_a1b2c3d4e5f6</code></p>
      </div>
    </div>
  </div>
</div>

- Gaussian Blur Text: <span class="blur-text">Hover to reveal spoiler content!</span>
- Blackout Mosaic: <span class="mosaic-text">Confidential Data: SHA256-7f83b1657ff1fc53</span>
- Discord Spoiler: ||Double vertical bar spoiler mask||
- Inline Lock: %%Percentage sign hidden content%%

---

## 5. Post Formats (Notes, Status, Audio & Gallery)

<div class="article-aside">
  <p><strong>💡 Note</strong>: Stay focused, continuously deliver pure value.</p>
</div>

<div class="article-audio-card">
  <div class="audio-card__cover">
    <img src="/media/shijianus/workbench.jpg" alt="Album Cover" />
  </div>
  <div class="audio-card__info">
    <div class="audio-card__title">Starlight Stroll</div>
    <div class="audio-card__author">shijianus · Original Focus White Noise</div>
    <audio controls preload="none" src="https://music.163.com/song/media/outer/url?id=186016.mp3"></audio>
  </div>
</div>