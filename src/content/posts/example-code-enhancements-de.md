---
title: "Beispiel: Vollständige Demonstration der Code‑Block‑Erweiterungsfunktionen"
description: "Zeigt umfassend die macOS‑ähnliche Verkehrslicht‑Steuerleiste, Sprach‑Badges, Hinzufügen/Entfernen‑Diff, Ein‑Klick‑Kopieren und die automatische Faltung bei langen Code‑Blöcken."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["Beispiel", "Demonstration", "Code", "shiki"]
category: "Beispiel"
series: "Funktionsbeispiele"
math: false
mermaid: false
i18nKey: "example-code-enhancements"
lang: "de"
aiTranslatedFrom: "zh-CN"
---

Dieses Beispiel dient ausschließlich der Verifizierung und dem Testen der **Code‑Block‑Erweiterungen** im Blog‑Inhalt.

Das Theme fügt allen Code‑Blöcken **macOS‑ähnliche Verkehrslicht‑Steuerleiste, Sprach‑Badges, Hinzufügen/Entfernen‑Diff‑Vergleich, Ein‑Klick‑Kopieren** sowie **automatisches Falten bei zu langen Code‑Blöcken** hinzu.

---

## 1. Diff‑Code‑Block mit Hinzufügen/Entfernen‑Vergleich (Diff Highlighting)

Zeigt hinzugefügte und entfernte Zeilen bei Versions‑ und Konfigurationsänderungen im Code‑Block:

```typescript
import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  site: 'https://shijian.us',
- output: 'server', // altes serverseitiges Rendering‑Modell
+ output: 'static', // Upgrade zu ultraschnellem rein statischem Export‑Modus
  markdown: {
+   remarkPlugins: [remarkMath], // KaTeX‑Formel‑Parsing einbinden
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

## 2. Automatisches Falten bei langen Code‑Blöcken (Code Collapse)

Wenn die Code‑Zeilenzahl zu groß wird, aktiviert das Theme bei einer Höhe von über 380 px automatisch einen halbtransparenten Überzug und einen „Code ausklappen“-Kapsel‑Button:

```json
{
  "name": "shijianus-blog",
  "version": "2.0.0",
  "description": "Basierend auf Astro 6 und dem Anzhi‑Fish‑Design für ein hochperformantes, geek‑freundliches Einzelblog",
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