---
title: "Ejemplo: Campos extendidos de Front Matter y demostración de validación con Zod"
description: "Análisis exhaustivo de todas las definiciones de campos de Front Matter soportados por este blog y sus interacciones con el tema."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["ejemplo", "demostración", "frontmatter", "config"]
category: "Ejemplo"
series: "Ejemplos de Funcionalidades"
math: false
mermaid: false
i18nKey: "example-frontmatter-fields"
lang: "es"
aiTranslatedFrom: "zh-CN"
---

Este artículo de ejemplo está dedicado a analizar y explicar sistemáticamente todos los campos de Front Matter definidos por este tema a través de un **Esquema Zod** en `src/content.config.ts`.

---

## 1. Lista de campos de Front Matter soportados

| Nombre del campo | Tipo | Valor predeterminado | Descripción |
| :--- | :--- | :--- | :--- |
| `title` | `string` | **Obligatorio** | Título principal del artículo |
| `pubDate` | `Date` | **Obligatorio** | Fecha de publicación (AAAA-MM-DD) |
| `updatedDate` | `Date` | Opcional | Fecha de última actualización |
| `description` | `string` | Opcional | Resumen del artículo, utilizado para SEO y visualización en tarjetas |
| `author` | `string` | `'shijianus'` | Firma del autor |
| `tags` | `array<string>` | `[]` | Lista de etiquetas |
| `category` | `string` | Opcional | Nombre de la categoría principal |
| `cover` | `string` | Opcional | URL de la imagen de portada principal |
| `coverAlt` | `string` | Opcional | Texto Alt de la imagen de portada |
| `featured` | `boolean` | `false` | Si se marca como artículo destacado/recomendado |
| `sticky` | `number` | `0` | Peso de fijación (mayor valor, más arriba) |
| `draft` | `boolean` | `false` | Indicador de borrador (filtrado automáticamente en la compilación de producción) |
| `postFormat` | `enum` | `'standard'` | Formato de artículo de WordPress (`aside`, `status`, `quote`, `gallery`, etc.) |
| `toc` / `hideToc` | `boolean` | `true` / `false` | Si se habilita / fuerza la ocultación del índice de contenido derecho |
| `math` | `boolean` | `false` | Si se habilita la renderización de fórmulas matemáticas LaTeX |
| `mermaid` | `boolean` | `false` | Si se habilita la renderización de diagramas vectoriales Mermaid |
| `series` | `string` | Opcional | Nombre de la serie de artículos relacionados |
| `access` | `object` | Opcional | Configuración de protección por contraseña e intercepción de IP por región |

---

## 2. Ejemplo de declaración estándar de Front Matter

```yaml
---
title: "Título completo del artículo"
pubDate: 2026-08-28
description: "Este es un artículo de ejemplo con metadatos completos."
author: "shijianus"
category: "Diseño de sistemas"
tags: ["Astro", "Markdown", "ejemplo"]
cover: "/media/shijianus/workbench.jpg"
featured: true
sticky: 1
toc: true
math: true
mermaid: true
postFormat: "standard"
---
```