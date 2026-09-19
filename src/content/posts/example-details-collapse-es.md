---
title: "Ejemplo: Demostración de paneles plegables, acordeones y menús desplegables"
description: "Demostración completa de los detalles nativos, grupos de acordeón plegables, plegado anidado y componentes especiales de selector desplegable."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["ejemplo", "demostración", "plegable", "desplegable"]
category: "Ejemplo"
series: "Ejemplos de Funciones"
math: false
mermaid: false
i18nKey: "example-details-collapse"
lang: "es"
aiTranslatedFrom: "zh-CN"
---
Este ejemplo está diseñado para validar y probar los componentes de **paneles plegables (Details), grupos de acordeón (Accordions) y selectores desplegables especiales (Dropdown Selectors)** en el cuerpo de la publicación del blog.

Todos los componentes se implementan prioritariamente basándose en la semántica nativa del navegador o en una arquitectura ligera de Islands, asegurando una sobrecarga mínima o nula para el cliente.

---

## 1. Plegado nativo embellecido (Details / Summary individual)

Soporta animación de rotación de flecha suave y efecto de brillo en el borde de la tarjeta.

<details class="article-accordion" open>
  <summary>
    <span>💡 ¿Por qué los generadores de sitios estáticos pueden alcanzar una concurrencia extremadamente alta?</span>
    <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
  </summary>
  <div class="accordion-content">
    <p>Porque los generadores estáticos compilan todo el Markdown y los componentes en archivos estáticos HTML/CSS puros durante la fase de construcción. Los nodos CDN responden directamente a las solicitudes sin necesidad de consultas a la base de datos o cálculos de backend, por lo que el límite teórico de concurrencia depende del rendimiento de la red.</p>
  </div>
</details>

```html
<details class="article-accordion" open>
  <summary>
    <span>💡 ¿Por qué los generadores de sitios estáticos pueden alcanzar una concurrencia extremadamente alta?</span>
    <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
  </summary>
  <div class="accordion-content">
    <p>Porque los generadores estáticos compilan todo el Markdown y los componentes en archivos estáticos HTML/CSS puros durante la fase de construcción...</p>
  </div>
</details>
```

---

## 2. Grupo de acordeón mutuamente excluyente (Grupo de acordeón de apertura única)

Al expandir cualquier elemento, los demás elementos expandidos del mismo grupo se cerrarán automáticamente de forma suave:

<div class="article-accordion-group" data-single="true">
  <details class="article-accordion" open>
    <summary>
      <span>🔒 1. Alta seguridad a nivel físico</span>
      <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    </summary>
    <div class="accordion-content">
      <p>Sin cadenas de conexión a bases de datos públicas ni procesos de backend dinámicos, es completamente inmune a la inyección SQL y a los ataques de inyección de comandos del servidor.</p>
    </div>
  </details>

  <details class="article-accordion">
    <summary>
      <span>⚡ 2. Entrega global de CDN en milisegundos</span>
      <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    </summary>
    <div class="accordion-content">
      <p>Los archivos estáticos se distribuyen en cientos de nodos de borde de CDN en todo el mundo, lo que permite una entrega ultrarrápida desde el punto más cercano, con un TTFB generalmente inferior a 20 ms.</p>
    </div>
  </details>

  <details class="article-accordion">
    <summary>
      <span>💰 3. Costo de mantenimiento casi nulo</span>
      <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    </summary>
    <div class="accordion-content">
      <p>En combinación con plataformas de alojamiento como Cloudflare Pages, puede funcionar de forma estable sin necesidad de comprar costosos servidores.</p>
    </div>
  </details>
</div>

```html
<div class="article-accordion-group" data-single="true">
  <details class="article-accordion" open>
    <summary><span>🔒 1. Alta seguridad a nivel físico</span>...</summary>
    <div class="accordion-content">...</div>
  </details>
  <details class="article-accordion">
    <summary><span>⚡ 2. Entrega global de CDN en milisegundos</span>...</summary>
    <div class="accordion-content">...</div>
  </details>
</div>
```

---

## 3. Formato especial de selectores desplegables (Dropdown Selectors & Interactive Calc)

### 1. Selector desplegable con estilo personalizado

<div class="article-select-box">
  <label>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
    <span>Seleccionar arquitectura de tiempo de ejecución:</span>
  </label>
  <select class="article-select">
    <option value="static">🚀 Entrega puramente estática (SSG - Recomendado)</option>
    <option value="ssr">⚙️ Renderizado híbrido del lado del servidor (SSR)</option>
    <option value="edge">🌐 Renderizado de streaming de computación en el borde (Edge)</option>
  </select>
</div>

```html
<div class="article-select-box">
  <label><span>Seleccionar arquitectura de ejecución:</span></label>
  <select class="article-select">
    <option value="static">🚀 Entrega estática pura (SSG - Recomendado)</option>
    <option value="ssr">⚙️ Renderizado híbrido del servidor (SSR)</option>
    <option value="edge">🌐 Renderizado en streaming Edge Computing (Edge)</option>
  </select>
</div>
```

### 2. Calculadora interactiva de especificaciones con desplegable

Al seleccionar diferentes opciones, las especificaciones de red y hardware correspondientes se calculan y muestran en tiempo real a la derecha:

<div class="interactive-calc-select">
  <div class="article-select-box">
    <label>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      <span>Seleccionar especificaciones de salida de video:</span>
    </label>
    <select class="article-select">
      <option value="1080p" data-desc="1920 × 1080 @ 60fps · Tasa de bits 6,000 Kbps · Ancho de banda recomendado 15 Mbps">1080P Full HD (1080p60)</option>
      <option value="2k" data-desc="2560 × 1440 @ 60fps · Tasa de bits 12,000 Kbps · Ancho de banda recomendado 30 Mbps">2K Ultra Claro (1440p60)</option>
      <option value="4k" data-desc="3840 × 2160 @ 60fps · Tasa de bits 25,000 Kbps · Ancho de banda recomendado 60 Mbps">4K Ultra HD (2160p60 HDR)</option>
    </select>
  </div>
  <div class="calc-output-box">
    <span>📊 <strong>Métricas estimadas</strong>:</span>
    <span class="calc-output-value">1920 × 1080 @ 60fps · Tasa de bits 6,000 Kbps · Ancho de banda recomendado 15 Mbps</span>
  </div>
</div>

```html
<div class="interactive-calc-select">
  <div class="article-select-box">
    <label><span>Seleccionar especificaciones de salida de video:</span></label>
    <select class="article-select">
      <option value="1080p" data-desc="1920 × 1080 @ 60fps · Tasa de bits 6,000 Kbps · Ancho de banda recomendado 15 Mbps">1080P Full HD (1080p60)</option>
      <option value="2k" data-desc="2560 × 1440 @ 60fps · Tasa de bits 12,000 Kbps · Ancho de banda recomendado 30 Mbps">2K Ultra Claro (1440p60)</option>
      <option value="4k" data-desc="3840 × 2160 @ 60fps · Tasa de bits 25,000 Kbps · Ancho de banda recomendado 60 Mbps">4K Ultra HD (2160p60 HDR)</option>
    </select>
  </div>
  <div class="calc-output-box">
    <span>📊 <strong>Métricas estimadas</strong>:</span>
    <span class="calc-output-value">1920 × 1080 @ 60fps · Tasa de bits 6,000 Kbps · Ancho de banda recomendado 15 Mbps</span>
  </div>
</div>
```