---
title: "Beispiel: Bildergalerie, Polaroid-Fotos und Lightbox-Anzeige"
description: "Umfassende Demonstration von adaptivem Bildergalerie-Raster, Polaroid-Album und vollflächiger, verlustfreier Lightbox-Funktion für Bilder."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["Beispiel", "Präsentation", "Galerie", "Lightbox"]
category: "Beispiel"
series: "Funktionsbeispiel"
math: false
mermaid: false
i18nKey: "example-gallery-figure"
lang: "de"
aiTranslatedFrom: "zh-CN"
---
Dieses Beispiel dient ausschließlich der Demonstration und Prüfung der Komponenten **Bildergalerie (Gallery)** und **Vollbild-Lichtbox (Lightbox)** im Blog-Artikeltext.

Durch Klicken auf ein beliebiges Bild wird eine zentrierte Vollbild-Lichtbox geöffnet. Sie kann jederzeit über die `Esc`-Taste oder durch Klicken auf die Abdeckung geschlossen werden.

---

## 1. Responsives 3-Spalten-Bildgalerie-Raster

<div class="article-gallery">
  <div class="gallery-grid gallery-grid-3">
    <div class="gallery-item">
      <img src="/media/shijianus/workbench.jpg" alt="Überblick über die Arbeitsumgebung" />
      <div class="gallery-item__caption">Überblick über die Arbeitsumgebung</div>
    </div>
    <div class="gallery-item">
      <img src="/media/shijianus/system.jpg" alt="Zentrales Dashboard für das Architekturentwurf" />
      <div class="gallery-item__caption">Zentrales Dashboard für das Architekturentwurf</div>
    </div>
    <div class="gallery-item">
      <img src="/media/shijianus/default.png" alt="Cover-Visual 'Spaziergang durch die Galaxie'" />
      <div class="gallery-item__caption">Cover-Visual 'Spaziergang durch die Galaxie'</div>
    </div>
  </div>
</div>

```html
<div class="article-gallery">
  <div class="gallery-grid gallery-grid-3">
    <div class="gallery-item">
      <img src="/media/shijianus/workbench.jpg" alt="Überblick über die Arbeitsumgebung" />
      <div class="gallery-item__caption">Überblick über die Arbeitsumgebung</div>
    </div>
    ...
  </div>
</div>
```

---

## 2. Polaroid-Stil-Album mit menschlichem Touch

<div class="gallery-polaroid">
  <div class="polaroid-card">
    <img src="/media/shijianus/workbench.jpg" alt="Ausblick auf die Forschung und Entwicklung 2026" />
    <div class="polaroid-card__caption">2026.04 Hangzhou · R&D-Workshop</div>
  </div>
  <div class="polaroid-card">
    <img src="/media/shijianus/system.jpg" alt="Nacht der Architektur-Evolution" />
    <div class="polaroid-card__caption">2026.08 Nacht der Architektur-Refactoring-Evolution</div>
  </div>
</div>

```html
<div class="gallery-polaroid">
  <div class="polaroid-card">
    <img src="/media/shijianus/workbench.jpg" alt="Ausblick auf die Forschung und Entwicklung 2026" />
    <div class="polaroid-card__caption">2026.04 Hangzhou · R&D-Workshop</div>
  </div>
</div>
```