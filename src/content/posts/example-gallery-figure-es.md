---
title: "Ejemplo: Galería de imágenes, fotos estilo Polaroid y visor de pantalla completa"
description: "Demostración completa de la cuadrícula de galería de imágenes adaptable, álbum de fotos estilo Polaroid con toque humano y la función de visor de imágenes de pantalla completa sin pérdidas."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["ejemplo", "demostración", "galería", "visor-de-imágenes"]
category: "Ejemplo"
series: "Ejemplos de Funcionalidades"
math: false
mermaid: false
author: shijianus
i18nKey: "example-gallery-figure"
lang: "es"
aiTranslatedFrom: "zh-CN"
---

Este ejemplo está dedicado a la demostración y prueba de los componentes de **Galería de imágenes (Gallery) y Visor de pantalla completa (Lightbox)** dentro del cuerpo del blog.

Haz clic en cualquier imagen para activar el visor de pantalla completa centrado y ampliado. Puedes cerrarlo en cualquier momento con la tecla `Esc` o haciendo clic en el fondo.

---

## 1. Cuadrícula de galería de imágenes adaptable de 3 columnas

<div class="article-gallery">
  <div class="gallery-grid gallery-grid-3">
    <div class="gallery-item">
      <img src="/media/shijianus/workbench.jpg" alt="Vista panorámica del entorno de desarrollo" />
      <div class="gallery-item__caption">Vista panorámica del entorno de desarrollo</div>
    </div>
    <div class="gallery-item">
      <img src="/media/shijianus/system.jpg" alt="Pantalla central de diseño de arquitectura" />
      <div class="gallery-item__caption">Pantalla central de diseño de arquitectura</div>
    </div>
    <div class="gallery-item">
      <img src="/media/shijianus/default.png" alt="Visual de portada de Paseo Estelar" />
      <div class="gallery-item__caption">Visual de portada de Paseo Estelar</div>
    </div>
  </div>
</div>

```html
<div class="article-gallery">
  <div class="gallery-grid gallery-grid-3">
    <div class="gallery-item">
      <img src="/media/shijianus/workbench.jpg" alt="Vista panorámica del entorno de desarrollo" />
      <div class="gallery-item__caption">Vista panorámica del entorno de desarrollo</div>
    </div>
    ...
  </div>
</div>
```

---

## 2. Álbum de fotos estilo Polaroid con toque humano

<div class="gallery-polaroid">
  <div class="polaroid-card">
    <img src="/media/shijianus/workbench.jpg" alt="Perspectivas de I+D 2026" />
    <div class="polaroid-card__caption">2026.04 Hangzhou · Taller de I+D</div>
  </div>
  <div class="polaroid-card">
    <img src="/media/shijianus/system.jpg" alt="Noche de evolución arquitectónica" />
    <div class="polaroid-card__caption">2026.08 Noche de refactorización y evolución arquitectónica</div>
  </div>
</div>

```html
<div class="gallery-polaroid">
  <div class="polaroid-card">
    <img src="/media/shijianus/workbench.jpg" alt="Perspectivas de I+D 2026" />
    <div class="polaroid-card__caption">2026.04 Hangzhou · Taller de I+D</div>
  </div>
</div>
```