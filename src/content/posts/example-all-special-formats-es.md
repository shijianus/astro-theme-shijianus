---
title: "Ejemplo: Prueba exhaustiva de formatos especiales y características únicas de Astro"
description: "Una prueba integral para todos los 13 tipos de Callouts, formatos de publicación, selectores desplegables, acordeones, descifrado de contraseñas, fórmulas, diagramas y componentes de diseño."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["ejemplo", "demostración", "todo-en-uno", "prueba"]
category: "Ejemplo"
series: "Ejemplos de Funcionalidades"
math: true
mermaid: true
postFormat: "standard"
i18nKey: "example-all-special-formats"
lang: "es"
aiTranslatedFrom: "zh-CN"
---

Este es un **artículo de demostración para pruebas de aceptación integrales y de estrés (All-in-one Master Showcase)**, diseñado para probar rápidamente y de forma automatizada todos los formatos y características especiales de la columna principal del texto.

---

## 1. Cuadros de aviso (Callouts)

> [!TIP]
> **Consejo**: Usa el atajo de teclado <kbd>Ctrl</kbd> + <kbd>K</kbd> para abrir la búsqueda.

> [!WARNING]
> **Advertencia**: Guarda tu clave privada de forma segura.

---

## 2. Desplegables y Acordeones (Dropdowns & Accordions)

<div class="article-dropdown-switcher">
<div class="article-dropdown-switcher__header">
<div class="article-dropdown-switcher__title">
<span>Seleccionar framework:</span>
</div>
<select class="article-select dropdown-switcher__select">
<option value="react-tab">⚛️ React 19</option>
<option value="vue-tab">🟢 Vue 3.5</option>
</select>
</div>
<div class="article-dropdown-switcher__body">
<div class="article-dropdown-panel is-active" data-panel="react-tab">
<p>El código del componente de React 19 ha sido cargado.</p>
</div>
<div class="article-dropdown-panel" data-panel="vue-tab">
<p>El código del componente de archivo único de Vue 3.5 ha sido cargado.</p>
</div>
</div>
</div>

<details class="article-accordion" open>
  <summary>
    <span>💡 Haz clic para expandir: Explicación de optimización de rendimiento</span>
    <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
  </summary>
  <div class="accordion-content">
    <p>Astro utiliza la arquitectura de Islas, entregando 0KB de JS por defecto.</p>
  </div>
</details>

---

## 3. Fórmulas matemáticas y diagramas Mermaid (Math & Mermaid)

Fórmula en línea: $E = mc^2$, integral de Gauss: $\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$.

Ecuaciones de Maxwell en bloque:

$$
\nabla \cdot \mathbf{E} = \frac{\rho}{\varepsilon_0}, \quad \nabla \times \mathbf{B} = \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}
$$

```mermaid
graph LR
    A[Código fuente Markdown] --> B[Compilador de construcción de Astro]
    B --> C[Entrega de HTML puramente estático]
```

---

## 4. Descifrado seguro de contraseñas y desenfoque gaussiano

<div class="article-encrypted-box" data-hash="d7fb6c64b9aa44cc0c3b427edaa623369dee1a9778329801f68fdaa34b09d351" data-hint="💡 Sugerencia de verificación: Para la clave de demostración, introduce directamente shijianus2026">
  <div class="encrypted-box__lock">
    <div class="encrypted-box__icon">🔒</div>
    <div class="encrypted-box__title">Activo cifrado protegido</div>
    <div class="encrypted-box__desc">Introduce la contraseña autorizada para desbloquear.</div>
    <button class="encrypted-box__btn" type="button">Haz clic para introducir la contraseña y desbloquear</button>
  </div>
  <div class="encrypted-box__content">
    <div class="admonition admonition-success">
      <div class="admonition-title"><span>🎉 Descifrado exitoso</span></div>
      <div class="admonition-content">
        <p>Token privado: <code>shijian_sec_9988_a1b2c3d4e5f6</code></p>
      </div>
    </div>
  </div>
</div>

- Texto con desenfoque gaussiano: <span class="blur-text">¡Pasa el ratón por encima para ver el contenido del spoiler!</span>
- Mosaico de censura: <span class="mosaic-text">Datos confidenciales: SHA256-7f83b1657ff1fc53</span>
- Spoiler de Discord: ||Máscara de spoiler de doble barra vertical||
- Bloqueo en línea: %%Contenido oculto con porcentaje%%

---

## 5. Formatos de publicación (Notas, estado, audio y galería)

<div class="article-aside">
  <p><strong>💡 Nota</strong>: Mantente enfocado, entrega valor puro continuamente.</p>
</div>

<div class="article-audio-card">
  <div class="audio-card__cover">
    <img src="/media/shijianus/workbench.jpg" alt="Portada del álbum" />
  </div>
  <div class="audio-card__info">
    <div class="audio-card__title">Paseo Estelar</div>
    <div class="audio-card__author">shijianus · Ruido blanco original para concentración</div>
    <audio controls preload="none" src="https://music.163.com/song/media/outer/url?id=186016.mp3"></audio>
  </div>
</div>