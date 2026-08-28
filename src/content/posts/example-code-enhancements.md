---
title: "示例：代码块全量增强功能展示"
description: "全面展示 macOS 拟物交通灯控制条、语言徽章、增删 Diff、一键复制与超长折叠特性。"
pubDate: 2026-08-28
draft: false
toc: true
tags: ["example", "showcase", "code", "shiki"]
category: "Examples"
series: "功能示例"
math: false
mermaid: false
---

本篇示例专用于验证与测试博客正文中的 **代码块（Code Block Enhancements）** 功能。

主题为所有代码块注入了 **macOS 拟物交通灯控制条、语言徽章、增删行 Diff 对比、一键复制** 以及 **超长代码自动限高折叠**。

---

## 一、带增删行对比的 Diff 代码块（Diff Highlighting）

在代码块中展示版本升级与配置变更时的增加行与删除行：

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

## 二、超长代码自动折叠演示（Code Collapse）

当代码行数过多时，主题会自动在高度超过 380px 时启用半透明遮罩与「展开代码」胶囊按钮：

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
