---
title: "Example: Full Code Block Enhancement Showcase"
description: "A comprehensive demonstration of macOS skeuomorphic traffic light controls, language badges, diff highlighting, one-click copy, and automatic long code collapse."
pubDate: 2026-08-28
draft: false
toc: true
tags: ["example", "showcase", "code", "shiki"]
category: "Examples"
series: "Feature Examples"
math: false
mermaid: false
i18nKey: "example-code-enhancements"
lang: "en"
aiTranslatedFrom: "zh-CN"
---

This example article is dedicated to verifying and testing the **Code Block Enhancements** feature within blog posts.

The theme injects **macOS skeuomorphic traffic light controls, language badges, line addition/deletion diff highlighting, one-click copy**, and **automatic height-limited collapse for extra-long code blocks** into all code blocks.

---

## 1. Diff Code Blocks with Line Highlighting (Diff Highlighting)

Displays added and deleted lines when showing version upgrades and configuration changes within code blocks:

```typescript
import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  site: 'https://shijian.us',
- output: 'server', // Old server-side rendering mode
+ output: 'static', // Upgraded to ultra-fast static export mode
  markdown: {
+   remarkPlugins: [remarkMath], // Injects KaTeX formula parsing
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

## 2. Automatic Code Collapse for Long Blocks (Code Collapse)

When code blocks contain too many lines, the theme automatically enables a translucent overlay and an "Expand Code" capsule button when the height exceeds 380px:

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