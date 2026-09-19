---
title: "Ejemplo: Demostración Completa de Mejoras en Bloques de Código"
description: "Muestra completamente las características de la barra de control de semáforos de macOS, insignias de lenguaje, diferencias de adición/eliminación (Diff), copia con un clic y plegado automático para código largo."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["ejemplo", "demostración", "código", "shiki"]
category: "Ejemplo"
series: "Ejemplos de Funcionalidades"
math: false
mermaid: false
i18nKey: "example-code-enhancements"
lang: "es"
aiTranslatedFrom: "zh-CN"
---

Este artículo de ejemplo está dedicado a la verificación y prueba de las funcionalidades de **Mejoras en Bloques de Código** dentro del cuerpo del blog.

El tema inyecta en todos los bloques de código: la **barra de control de semáforos de macOS (skeuomorphic), insignias de lenguaje, comparación de diferencias de líneas (Diff), copia con un clic** y **plegado automático con límite de altura para código excesivamente largo**.

---

## 1. Bloques de Código Diff con Comparación de Líneas Añadidas/Eliminadas (Diff Highlighting)

Muestra las líneas añadidas y eliminadas al actualizar versiones o cambiar configuraciones dentro de los bloques de código:

```typescript
import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  site: 'https://shijian.us',
- output: 'server', // Antiguo modo de renderizado del lado del servidor
+ output: 'static', // Actualizado a modo de exportación estática pura y ultrarrápida
  markdown: {
+   remarkPlugins: [remarkMath], // Inyecta el análisis de fórmulas KaTeX
+   rehypePlugins: [rehypeKatex],
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark-dimmed',
      },
    },
  },
});
```

---

## 2. Demostración de Plegado Automático para Código Largo (Code Collapse)

Cuando el número de líneas de código es excesivo, el tema activará automáticamente una superposición semitransparente y un botón de cápsula "Expandir código" cuando la altura exceda los 380px:

```json
{
  "name": "shijianus-blog",
  "version": "2.0.0",
  "description": "基于 Astro 6 与安知鱼设计美学的高性能极客独立博客",
  "author": "shijianus",
  "license": "MIT",
  "scripts": {
    "dev": "astro dev --host 0.0.0.0",
    "build": "BLOG_BUILD_TARGET=static PUBLIC_STATIC_EXPORT=1 astro build",
    "preview": "astro preview",
    "clean": "node scripts/clean.mjs"
  },
  "dependencies": {
    "@astrojs/mdx": "^5.0.3",
    "@astrojs/node": "^10.0.6",
    "@astrojs/react": "^5.0.2",
    "@tailwindcss/postcss": "^4.2.4",
    "@tailwindcss/vite": "^4.2.2",
    "astro": "^6.1.3",
    "clsx": "^2.1.1",
    "katex": "^0.16.11",
    "lucide-react": "^0.460.0",
    "mermaid": "^11.4.1",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "rehype-katex": "^7.0.1",
    "remark-gfm": "^4.0.1",
    "remark-math": "^6.0.0",
    "tailwind-merge": "^3.5.0",
    "tailwindcss": "^4.2.2"
  },
  "devDependencies": {
    "playwright": "^1.62.1",
    "wrangler": "^4.85.0"
  }
}
```