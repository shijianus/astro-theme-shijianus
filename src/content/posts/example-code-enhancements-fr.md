---
title: "Exemple : Démonstration complète des améliorations des blocs de code"
description: "Présentation complète des fonctionnalités : barre de contrôle de type feux de circulation macOS, badges de langage, diff d'ajout/suppression, copie en un clic et pliage automatique des blocs de code longs."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["exemple", "démonstration", "code", "shiki"]
category: "Exemple"
series: "Exemples de fonctionnalités"
math: false
mermaid: false
i18nKey: "example-code-enhancements"
lang: "fr"
aiTranslatedFrom: "zh-CN"
---

Cet exemple est dédié à la validation et au test des fonctionnalités d'**amélioration des blocs de code** dans le corps des articles de blog.

Le thème injecte dans tous les blocs de code : une **barre de contrôle de type feux de circulation macOS, des badges de langage, la comparaison Diff des lignes ajoutées/supprimées, la copie en un clic** et le **pliage automatique des blocs de code longs**.

---

## 1. Blocs de code Diff avec comparaison des lignes ajoutées/supprimées (Diff Highlighting)

Affiche les lignes ajoutées et supprimées lors des mises à jour de version et des modifications de configuration dans les blocs de code :

```typescript
import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  site: 'https://shijian.us',
- output: 'server', // 旧的服务端渲染模式
+ output: 'static', // 升级为极速纯静态导出模式
  markdown: {
+   remarkPlugins: [remarkMath], // 注入 KaTeX 公式解析
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

## 2. Démonstration du pliage automatique des blocs de code longs (Code Collapse)

Lorsque le nombre de lignes de code est trop élevé, le thème active automatiquement un masque semi-transparent et un bouton « Déplier le code » lorsque la hauteur dépasse 380px :

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