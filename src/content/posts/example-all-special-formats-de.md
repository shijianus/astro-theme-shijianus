---
title: "Beispiel: Umfassender Test der speziellen Formate und Funktionen von Astro"
description: "Testet alle 13 Arten von Callouts, Post-Formaten, Dropdown-Umschaltern, Akkordeons, Passwortentschlüsselung, Formeln, Diagrammen und Layout-Komponenten an einem Ort."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["Beispiel", "Showcase", "All-in-One", "Test"]
category: "Beispiel"
series: "Funktionsbeispiele"
math: true
mermaid: true
postFormat: "standard"
i18nKey: "example-all-special-formats"
lang: "de"
aiTranslatedFrom: "zh-CN"
---

Dieser Artikel ist ein **umfassender Abnahmetest und ein vollständiger Belastungstest-Demonstrationsartikel (All-in-one Master Showcase)**, der zum schnellen automatisierten Testen aller Formate und speziellen Funktionen im Haupttextbereich dient.

---

## 1. Hinweisboxen (Callouts)

> [!TIP]
> **Tipp**: Verwenden Sie die Tastenkombination <kbd>Ctrl</kbd> + <kbd>K</kbd>, um die Suche aufzurufen.

> [!WARNING]
> **Warnung**: Bitte bewahren Sie Ihren privaten Schlüssel sicher auf.

---

## 2. Dropdowns und Akkordeons

<div class="article-dropdown-switcher">
<div class="article-dropdown-switcher__header">
<div class="article-dropdown-switcher__title">
<span>Framework auswählen:</span>
</div>
<select class="article-select dropdown-switcher__select">
<option value="react-tab">⚛️ React 19</option>
<option value="vue-tab">🟢 Vue 3.5</option>
</select>
</div>
<div class="article-dropdown-switcher__body">
<div class="article-dropdown-panel is-active" data-panel="react-tab">
<p>React 19 Komponenten-Code wurde geladen.</p>
</div>
<div class="article-dropdown-panel" data-panel="vue-tab">
<p>Vue 3.5 Single-File-Komponenten-Code wurde geladen.</p>
</div>
</div>
</div>

<details class="article-accordion" open>
  <summary>
    <span>💡 Zum Aufklappen klicken: Erläuterung zur Leistungsoptimierung</span>
    <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
  </summary>
  <div class="accordion-content">
    <p>Astro verwendet die Islands-Architektur und liefert standardmäßig 0KB JS aus.</p>
  </div>
</details>

---

## 3. Mathematische Formeln und Mermaid-Diagramme (Math & Mermaid)

Inline-Formel: $E = mc^2$, Gauß-Integral: $\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$.

Maxwell-Gleichungen als Block:

$$
\nabla \cdot \mathbf{E} = \frac{\rho}{\varepsilon_0}, \quad \nabla \times \mathbf{B} = \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}
$$

```mermaid
graph LR
    A[Markdown-Quellcode] --> B[Astro Build-Compiler]
    B --> C[Auslieferung von reinem statischem HTML]
```

---

## 4. Sichere Passwortentschlüsselung und Gaußsche Unschärfe

<div class="article-encrypted-box" data-hash="d7fb6c64b9aa44cc0c3b427edaa623369dee1a9778329801f68fdaa34b09d351" data-hint="💡 Validierungshinweis: Für den Demo-Schlüssel geben Sie bitte direkt shijianus2026 ein.">
  <div class="encrypted-box__lock">
    <div class="encrypted-box__icon">🔒</div>
    <div class="encrypted-box__title">Geschütztes verschlüsseltes Asset</div>
    <div class="encrypted-box__desc">Bitte geben Sie das Autorisierungspasswort ein, um es zu entsperren.</div>
    <button class="encrypted-box__btn" type="button">Zum Entsperren Passwort eingeben</button>
  </div>
  <div class="encrypted-box__content">
    <div class="admonition admonition-success">
      <div class="admonition-title"><span>🎉 Entschlüsselung erfolgreich</span></div>
      <div class="admonition-content">
        <p>Privater Token: <code>shijian_sec_9988_a1b2c3d4e5f6</code></p>
      </div>
    </div>
  </div>
</div>

- Gaußsche Unschärfe Text: <span class="blur-text">Fahren Sie mit der Maus darüber, um den Spoiler-Inhalt zu sehen!</span>
- Blackout-Mosaik: <span class="mosaic-text">Vertrauliche Daten: SHA256-7f83b1657ff1fc53</span>
- Discord Spoiler: ||Doppelter vertikaler Strich Spoiler-Maske||
- Inline-Sperre: %%Inhalt mit Prozentzeichen versteckt%%

---

## 5. Post-Formate (Notiz, Status, Audio und Galerie)

<div class="article-aside">
  <p><strong>💡 Notiz</strong>: Bleiben Sie fokussiert, liefern Sie kontinuierlich reinen Wert.</p>
</div>

<div class="article-audio-card">
  <div class="audio-card__cover">
    <img src="/media/shijianus/workbench.jpg" alt="Albumcover" />
  </div>
  <div class="audio-card__info">
    <div class="audio-card__title">Sternenwanderung</div>
    <div class="audio-card__author">shijianus · Originales, konzentrationsförderndes weißes Rauschen</div>
    <audio controls preload="none" src="https://music.163.com/song/media/outer/url?id=186016.mp3"></audio>
  </div>
</div>