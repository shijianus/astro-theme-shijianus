---
title: "範例：程式碼區塊完整增強功能展示"
description: "全面展示 macOS 擬物交通燈控制條、語言徽章、增刪 Diff、一鍵複製與超長摺疊特性。"
pubDate: 2026-08-28
draft: false
toc: true
tags: ["範例", "展示", "程式碼", "Shiki"]
category: "範例"
series: "功能範例"
math: false
mermaid: false
i18nKey: "example-code-enhancements"
lang: "zh-Hant"
aiTranslatedFrom: "zh-CN"
---

本篇範例專用於驗證與測試部落格正文中的 **程式碼區塊（Code Block Enhancements）** 功能。

主題為所有程式碼區塊注入了 **macOS 擬物交通燈控制條、語言徽章、增刪行 Diff 對比、一鍵複製** 以及 **超長程式碼自動限高摺疊**。

---

## 一、帶增刪行對比的 Diff 程式碼區塊（Diff Highlighting）

在程式碼區塊中展示版本升級與配置變更時的增加行與刪除行：

```typescript
import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  site: 'https://shijian.us',
- output: 'server', // 舊的伺服器端渲染模式
+ output: 'static', // 升級為極速純靜態匯出模式
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

## 二、超長程式碼自動摺疊演示（Code Collapse）

當程式碼行數過多時，主題會自動在高度超過 380px 時啟用半透明遮罩與「展開程式碼」膠囊按鈕：

```json
{
  "name": "shijianus-blog",
  "version": "2.0.0",
  "description": "基於 Astro 6 與安知魚設計美學的高效能極客獨立部落格",
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