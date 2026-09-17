---
title: "Exemple : Démonstration des fonctionnalités avancées des blocs de code"
description: "Présentation exhaustive des fonctionnalités : barre de contrôle skeuomorphique de style feux de circulation macOS, badges de langage, affichage des différences (Diff), copie en un clic et pliage automatique pour les blocs de code longs."
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

Cet article d'exemple est conçu pour valider et tester les fonctionnalités des **blocs de code (Code Block Enhancements)** dans le corps des articles de blog.

Le thème injecte dans tous les blocs de code une **barre de contrôle skeuomorphique de style feux de circulation macOS**, des **badges de langage**, la **comparaison des différences (Diff) d'ajout/suppression de lignes**, la **copie en un clic** et le **pliage automatique avec hauteur limitée pour les codes longs**.

---

## 1. Blocs de code Diff avec surbrillance des différences (Diff Highlighting)

Affiche dans les blocs de code les lignes ajoutées et supprimées lors des mises à jour de version et des modifications de configuration :

```typescript
import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  site: 'https://shijian.us',
- output: 'server', // Ancien mode de rendu côté serveur
+ output: 'static', // Mise à niveau vers le mode d'exportation statique pur et ultra-rapide
  markdown: {
+   remarkPlugins: [remarkMath], // Injection de l'analyseur de formules KaTeX
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

## 2. Démonstration du pliage automatique des codes longs (Code Collapse)

Lorsque le nombre de lignes de code est trop élevé, le thème active automatiquement, lorsque la hauteur dépasse 380px, un masque semi-transparent et un bouton « Déplier le code » de style capsule :

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