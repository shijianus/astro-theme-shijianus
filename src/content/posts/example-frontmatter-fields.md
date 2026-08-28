---
title: "示例：Front Matter 扩展字段与 Zod 验证展示"
description: "全面解析本博客所有支持的 Front Matter 字段定义与其驱动的主题交互行为。"
pubDate: 2026-08-28
draft: false
toc: true
tags: ["example", "showcase", "frontmatter", "config"]
category: "Examples"
series: "功能示例"
math: false
mermaid: false
---

本篇示例专用于系统解析与说明本主题在 `src/content.config.ts` 中通过 **Zod Schema** 定义的全部 Front Matter 字段。

---

## 一、支持的 Front Matter 字段清单

| 字段名称 | 类型 | 默认值 | 作用说明 |
| :--- | :--- | :--- | :--- |
| `title` | `string` | **必填** | 文章主标题 |
| `pubDate` | `Date` | **必填** | 发布日期 (YYYY-MM-DD) |
| `updatedDate` | `Date` | 可选 | 最近更新日期 |
| `description` | `string` | 可选 | 文章摘要，用于 SEO 与卡片展示 |
| `author` | `string` | `'shijianus'` | 作者署名 |
| `tags` | `array<string>` | `[]` | 标签列表 |
| `category` | `string` | 可选 | 主分类名称 |
| `cover` | `string` | 可选 | 封面主图 URL |
| `coverAlt` | `string` | 可选 | 封面图 Alt 文本 |
| `featured` | `boolean` | `false` | 是否设为精选推荐文章 |
| `sticky` | `number` | `0` | 置顶权重 (数值越大越靠前) |
| `draft` | `boolean` | `false` | 草稿标识 (生产构建自动过滤) |
| `postFormat` | `enum` | `'standard'` | WordPress 文章形态 (`aside`, `status`, `quote`, `gallery` 等) |
| `toc` / `hideToc` | `boolean` | `true` / `false` | 是否开启 / 强制隐藏右侧目录 |
| `math` | `boolean` | `false` | 是否启用 LaTeX 数学公式渲染 |
| `mermaid` | `boolean` | `false` | 是否启用 Mermaid 矢量图表渲染 |
| `series` | `string` | 可选 | 关联的文章系列名称 |
| `access` | `object` | 可选 | 密码保护与地区 IP 拦截配置 |

---

## 二、标准 Front Matter 声明示例

```yaml
---
title: "文章完整标题"
pubDate: 2026-08-28
description: "这是一篇包含完整元数据的示范文章。"
author: "shijianus"
category: "系统设计"
tags: ["Astro", "Markdown", "示例"]
cover: "/media/shijianus/workbench.jpg"
featured: true
sticky: 1
toc: true
math: true
mermaid: true
postFormat: "standard"
---
```
