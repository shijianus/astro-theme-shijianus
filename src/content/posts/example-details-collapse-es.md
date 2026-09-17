---
title: "Ejemplo: Paneles plegables, acordeones y selectores desplegables"
description: "Demostración completa de los componentes nativos de details, grupos de acordeones plegables, colapsados anidados y selectores desplegables especiales."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["ejemplo", "demostración", "colapso", "desplegable"]
category: "Ejemplos"
series: "Ejemplos de funcionalidades"
math: false
mermaid: false
i18nKey: "example-details-collapse"
lang: "es"
aiTranslatedFrom: "zh-CN"
---

Este ejemplo está diseñado específicamente para validar y probar los componentes de **paneles plegables (Details), grupos de acordeones (Accordions) y selectores desplegables especiales (Dropdown Selectors)** dentro del cuerpo del blog.

Todos los componentes se implementan priorizando la semántica nativa del navegador o una arquitectura ligera de Islands, garantizando un costo de cliente cero o mínimo.

---

## 1. Panel plegable nativo estilizado (Single Details / Summary)

Soporta animación suave de rotación de flecha y borde de tarjeta con efecto de flujo de luz.

<details class="article-accordion" open>
  <summary>
    <span>💡 ¿Por qué los generadores de sitios estáticos pueden alcanzar una concurrencia extremadamente alta?</span>
    <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
  </summary>
  <div class="accordion-content">
    <p>Porque los generadores estáticos compilan todo el Markdown y los componentes en archivos estáticos de HTML/CSS puros durante la fase de construcción. Los nodos del CDN responden directamente a las solicitudes sin necesidad de consultas a bases de datos ni cálculos en el backend, por lo que el límite teórico de concurrencia depende del ancho de banda de red.</p>
  </div>
</details>

```html
<details class="article-accordion" open>
  <summary>
    <span>💡 ¿Por qué los generadores de sitios estáticos pueden alcanzar una concurrencia extremadamente alta?</span>
    <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
  </summary>
  <div class="accordion-content">
    <p>Porque los generadores estáticos compilan todo el Markdown y los componentes en archivos estáticos de HTML/CSS puros...</p>
  </div>
</details>
```

---

## 2. Grupo de acordeones mutuamente excluyentes (Single-Open Accordion Group)

Al expandir cualquiera de los elementos, los demás elementos expandidos del mismo grupo se cerrarán automáticamente con una transición suave:

<div class="article-accordion-group" data-single="true">
  <details class="article-accordion" open>
    <summary>
      <span>🔒 1. Alta seguridad a nivel físico</span>
      <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    </summary>
    <div class="accordion-content">
      <p>Sin cadenas de conexión a bases de datos públicas ni procesos de backend dinámicos, es completamente inmune a ataques de inyección SQL e inyección de comandos en el servidor.</p>
    </div>
  </details>

  <details class="article-accordion">
    <summary>
      <span>⚡ 2. Entrega global por CDN en milisegundos</span>
      <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    </summary>
    <div class="accordion-content">
      <p>Los archivos estáticos se distribuyen en cientos de nodos de borde de CDN en todo el mundo, logrando aciertos rápidos y cercanos, con un TTFB generalmente inferior a 20 ms.</p>
    </div>
  </details>

  <details class="article-accordion">
    <summary>
      <span>💰 3. Costos de mantenimiento casi nulos</span>
      <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    </summary>
    <div class="accordion-content">
      <p>Con plataformas de hosting como Cloudflare Pages, se puede operar de manera estable sin necesidad de comprar servidores costosos.</p>
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
    <summary><span>⚡ 2. Entrega global por CDN en milisegundos</span>...</summary>
    <div class="accordion-content">...</div>
  </details>
</div>
```

---

## 3. Formato especial de selector desplegable (Dropdown Selectors & Interactive Calc)

### 1. Selector desplegable nativo estilizado (Custom Styled Select)

<div class="article-select-box">
  <label>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
    <span>Selecciona la arquitectura de tiempo de ejecución:</span>
  </label>
  <select class="article-select">
    <option value="static">🚀 Entrega puramente estática (SSG - Recomendado)</option>
    <option value="ssr">⚙️ Renderizado híbrido en servidor (SSR)</option>
    <option value="edge">🌐 Renderizado por streaming en el borde (Edge)</option>
  </select>
</div>

```html
<div class="article-select-box">
  <label><span>Selecciona la arquitectura de tiempo de ejecución:</span></label>
  <select class="article-select">
    <option value="static">🚀 Entrega puramente estática (SSG - Recomendado)</option>
    <option value="ssr">⚙️ Renderizado híbrido en servidor (SSR)</option>
    <option value="edge">🌐 Renderizado por streaming en el borde (Edge)</option>
  </select>
</div>
```

### 2. Calculadora interactiva de especificaciones desplegables (Interactive Calc Dropdown)

Al seleccionar diferentes opciones, se calculan