---
title: "Beispiel: Umfassende Codeblock-Erweiterungen"
description: "Umfassende Demonstration der macOS-Semafor-Steuerleiste, Sprach-Badges, Diff-Hervorhebung für Hinzufügungen/Löschungen, Ein-Klick-Kopieren und automatisches Zusammenklappen langer Codeblöcke."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["Beispiel", "Demonstration", "Code", "Shiki"]
category: "Beispiel"
series: "Funktionsbeispiele"
math: false
mermaid: false
i18nKey: "example-code-enhancements"
lang: "de"
aiTranslatedFrom: "zh-CN"
---

Dieses Beispiel dient der Validierung und dem Testen der **Codeblock-Erweiterungen** im Blogbeitrag.

Das Theme integriert für alle Codeblöcke die **macOS-Semafor-Steuerleiste, Sprach-Badges, Diff-Hervorhebung für hinzugefügte/gelöschte Zeilen, Ein-Klick-Kopieren** und das **automatische Zusammenklappen von überlangen Codeblöcken**.

---

## 1. Diff-Codeblöcke mit Hinzufügungs-/Löschungs-Vergleich (Diff Highlighting)

Zeigt hinzugefügte und gelöschte Zeilen in Codeblöcken bei Versions-Upgrades und Konfigurationsänderungen an:

```typescript
import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  site: 'https://shijian.us',
- output: 'server', // Alter serverseitiger Rendering-Modus
+ output: 'static', // Upgrade auf den ultraschnellen statischen Exportmodus
  markdown: {
+   remarkPlugins: [remarkMath], // KaTeX-Formel-Parsing injizieren
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

## 2. Demonstration des automatischen Code-Zusammenklappens (Code Collapse)

Wenn die Anzahl der Codezeilen zu groß ist, aktiviert das Theme automatisch eine halbtransparente Überlagerung und einen „Code erweitern“-Button, sobald die Höhe 380px überschreitet:

```json
{
  "name": "shijianus-blog",
  "version": "2.0.0",
  "description": "Ein hochperformanter, unabhängiger Geek-Blog basierend auf Astro 6 und der Designästhetik von Anzhiyu",
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