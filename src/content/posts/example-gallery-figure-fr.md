---
title: "Exemple : Galerie d'images, photos Polaroid et Lightbox"
description: "Démonstration complète des grilles de galeries d'images adaptatives, des albums photo de style Polaroid et des fonctionnalités de lightbox plein écran haute fidélité."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["exemple", "démonstration", "galerie", "lightbox"]
category: "Exemples"
series: "Exemples de fonctionnalités"
math: false
mermaid: false
i18nKey: "example-gallery-figure"
lang: "fr"
aiTranslatedFrom: "zh-CN"
---

Cet article d'exemple est dédié à la démonstration et au test des composants de **galerie d'images (Gallery)** et de **lightbox plein écran (Lightbox)** dans le corps des articles de blog.

Cliquez sur n'importe quelle image pour activer la lightbox plein écran centrée et agrandie. Vous pouvez la fermer à tout moment avec la touche `Esc` ou en cliquant sur le masque.

---

## 1. Grille de galerie d'images adaptative à 3 colonnes

<div class="article-gallery">
  <div class="gallery-grid gallery-grid-3">
    <div class="gallery-item">
      <img src="/media/shijianus/workbench.jpg" alt="Vue panoramique du poste de travail de développement" />
      <div class="gallery-item__caption">Vue panoramique du poste de travail de développement</div>
    </div>
    <div class="gallery-item">
      <img src="/media/shijianus/system.jpg" alt="Grand écran central de conception architecturale" />
      <div class="gallery-item__caption">Grand écran central de conception architecturale</div>
    </div>
    <div class="gallery-item">
      <img src="/media/shijianus/default.png" alt="Visuel de couverture 'Promenade dans la Voie lactée'" />
      <div class="gallery-item__caption">Visuel de couverture 'Promenade dans la Voie lactée'</div>
    </div>
  </div>
</div>

```html
<div class="article-gallery">
  <div class="gallery-grid gallery-grid-3">
    <div class="gallery-item">
      <img src="/media/shijianus/workbench.jpg" alt="Vue panoramique du poste de travail de développement" />
      <div class="gallery-item__caption">Vue panoramique du poste de travail de développement</div>
    </div>
    ...
  </div>
</div>
```

---

## 2. Album photo de style Polaroid (Polaroid Style)

<div class="gallery-polaroid">
  <div class="polaroid-card">
    <img src="/media/shijianus/workbench.jpg" alt="Perspectives de R&D 2026" />
    <div class="polaroid-card__caption">Avril 2026, Hangzhou · Atelier de R&D</div>
  </div>
  <div class="polaroid-card">
    <img src="/media/shijianus/system.jpg" alt="Nuit de l'évolution architecturale" />
    <div class="polaroid-card__caption">Août 2026, Nuit de la refonte et de l'évolution architecturale</div>
  </div>
</div>

```html
<div class="gallery-polaroid">
  <div class="polaroid-card">
    <img src="/media/shijianus/workbench.jpg" alt="Perspectives de R&D 2026" />
    <div class="polaroid-card__caption">Avril 2026, Hangzhou · Atelier de R&D</div>
  </div>
</div>
```