---
title: "Beispiel: Anzeigeformate für Klappfelder, Akkordeons und Dropdown-Menüs"
description: "Umfassende Demonstration nativer Details, Akkordeon-Klappgruppen, verschachtelter Klappfelder und spezieller Dropdown-Auswahlkomponenten."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["Beispiel", "Präsentation", "Klappfeld", "Dropdown"]
category: "Beispiel"
series: "Funktionsbeispiele"
math: false
mermaid: false
i18nKey: "example-details-collapse"
lang: "de"
aiTranslatedFrom: "zh-CN"
---
Dieses Beispiel dient der Validierung und dem Testen der folgenden Komponenten im Blog-Text: **Klappfelder (Details)**, **Akkordeongruppen (Accordions)** sowie **spezieller Dropdown-Auswahlfelder (Dropdown Selectors)**.

Alle Komponenten basieren vorzugsweise auf nativer Browser-Semantik oder einer leichtgewichtigen Islands-Architektur, um null oder minimale Client-Overheads zu gewährleisten.

---

## 1. Native, verschönerte Klappfelder (Einzelne Details / Summary)

Unterstützt flüssige Pfeil-Rotationsanimationen und fließende Rahmenbeleuchtung für Karten.

<details class="article-accordion" open>
  <summary>
    <span>💡 Warum können statische Seitengeneratoren eine extrem hohe Parallelität erreichen?</span>
    <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
  </summary>
  <div class="accordion-content">
    <p>Weil statische Generatoren während der Build-Phase alle Markdown-Dateien und Komponenten in reine HTML/CSS-Statikdateien kompilieren. CDN-Knoten antworten direkt auf Anfragen, ohne Datenbankabfragen oder Backend-Berechnungen durchführen zu müssen. Die theoretische Obergrenze der Parallelität hängt vom Netzwerkdurchsatz ab.</p>
  </div>
</details>

```html
<details class="article-accordion" open>
  <summary>
    <span>💡 Warum können statische Seitengeneratoren eine extrem hohe Parallelität erreichen?</span>
    <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
  </summary>
  <div class="accordion-content">
    <p>Weil statische Generatoren während der Build-Phase alle Markdown-Dateien und Komponenten in reine HTML/CSS-Statikdateien kompilieren...</p>
  </div>
</details>
```

---

## 2. Exklusive Akkordeon-Klappgruppe (Single-Open Akkordeongruppe)

Wenn ein Element geöffnet wird, schließen sich andere geöffnete Elemente innerhalb derselben Gruppe automatisch und fließend:

<div class="article-accordion-group" data-single="true">
  <details class="article-accordion" open>
    <summary>
      <span>🔒 1. Hohe Sicherheit auf physischer Ebene</span>
      <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    </summary>
    <div class="accordion-content">
      <p>Ohne öffentliche Datenbankverbindungszeichenketten und dynamische Backend-Prozesse ist es vollständig immun gegen SQL-Injection- und Server-Side-Command-Injection-Angriffe.</p>
    </div>
  </details>

  <details class="article-accordion">
    <summary>
      <span>⚡ 2. Millisekunden-schnelle globale CDN-Bereitstellung</span>
      <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    </summary>
    <div class="accordion-content">
      <p>Statische Dateien sind auf Hunderten von CDN-Edge-Knoten weltweit verteilt, was eine extrem schnelle lokale Trefferquote ermöglicht. Die TTFB liegt in der Regel unter 20 ms.</p>
    </div>
  </details>

  <details class="article-accordion">
    <summary>
      <span>💰 3. Nahezu null Wartungskosten</span>
      <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    </summary>
    <div class="accordion-content">
      <p>In Verbindung mit Hosting-Plattformen wie Cloudflare Pages ist ein stabiler Betrieb ohne den Kauf teurer Server-Hosts möglich.</p>
    </div>
  </details>
</div>

```html
<div class="article-accordion-group" data-single="true">
  <details class="article-accordion" open>
    <summary><span>🔒 1. Hohe Sicherheit auf physischer Ebene</span>...</summary>
    <div class="accordion-content">...</div>
  </details>
  <details class="article-accordion">
    <summary><span>⚡ 2. Millisekunden-schnelle globale CDN-Bereitstellung</span>...</summary>
    <div class="accordion-content">...</div>
  </details>
</div>
```

---

## 3. Spezielle Dropdown-Formate (Dropdown-Auswahlfelder & Interaktiver Rechner)

### 1. Nativ gestylte Dropdown-Auswahl

<div class="article-select-box">
  <label>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
    <span>Laufzeitarchitektur auswählen:</span>
  </label>
  <select class="article-select">
    <option value="static">🚀 Rein statische Bereitstellung (SSG - Empfohlen)</option>
    <option value="ssr">⚙️ Hybrides serverseitiges Rendering (SSR)</option>
    <option value="edge">🌐 Edge Computing Streaming-Rendering (Edge)</option>
  </select>
</div>

```html
<div class="article-select-box">
  <label><span>Laufzeitarchitektur auswählen:</span></label>
  <select class="article-select">
    <option value="static">🚀 Rein statische Auslieferung (SSG - Empfohlen)</option>
    <option value="ssr">⚙️ Hybrides Server-Side Rendering (SSR)</option>
    <option value="edge">🌐 Edge Computing Streaming-Rendering (Edge)</option>
  </select>
</div>
```

### 2. Interaktiver Dropdown-Spezifikationsrechner

Bei Auswahl verschiedener Optionen werden die entsprechenden Netzwerk- und Hardwarespezifikationen auf der rechten Seite in Echtzeit berechnet und angezeigt:

<div class="interactive-calc-select">
  <div class="article-select-box">
    <label>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      <span>Videoausgabespezifikationen auswählen:</span>
    </label>
    <select class="article-select">
      <option value="1080p" data-desc="1920 × 1080 @ 60fps · Bitrate 6.000 Kbps · Empfohlene Bandbreite 15 Mbps">1080P Full HD (1080p60)</option>
      <option value="2k" data-desc="2560 × 1440 @ 60fps · Bitrate 12.000 Kbps · Empfohlene Bandbreite 30 Mbps">2K Ultra HD (1440p60)</option>
      <option value="4k" data-desc="3840 × 2160 @ 60fps · Bitrate 25.000 Kbps · Empfohlene Bandbreite 60 Mbps">4K Ultra HD (2160p60 HDR)</option>
    </select>
  </div>
  <div class="calc-output-box">
    <span>📊 <strong>Berechnete Metriken</strong>:</span>
    <span class="calc-output-value">1920 × 1080 @ 60fps · Bitrate 6.000 Kbps · Empfohlene Bandbreite 15 Mbps</span>
  </div>
</div>

```html
<div class="interactive-calc-select">
  <div class="article-select-box">
    <label><span>Videoausgabespezifikationen auswählen:</span></label>
    <select class="article-select">
      <option value="1080p" data-desc="1920 × 1080 @ 60fps · Bitrate 6.000 Kbps · Empfohlene Bandbreite 15 Mbps">1080P Full HD (1080p60)</option>
      <option value="2k" data-desc="2560 × 1440 @ 60fps · Bitrate 12.000 Kbps · Empfohlene Bandbreite 30 Mbps">2K Ultra HD (1440p60)</option>
      <option value="4k" data-desc="3840 × 2160 @ 60fps · Bitrate 25.000 Kbps · Empfohlene Bandbreite 60 Mbps">4K Ultra HD (2160p60 HDR)</option>
    </select>
  </div>
  <div class="calc-output-box">
    <span>📊 <strong>Berechnete Metriken</strong>:</span>
    <span class="calc-output-value">1920 × 1080 @ 60fps · Bitrate 6.000 Kbps · Empfohlene Bandbreite 15 Mbps</span>
  </div>
</div>
```